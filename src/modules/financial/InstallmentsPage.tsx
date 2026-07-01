import { useMemo, useState } from 'react'
import { format, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts'
import {
  useInstallmentsByMonth, useInstallmentsByCustomer, useCashflow,
} from './installment.queries'
import InstallmentRow from './InstallmentRow'
import type { Installment } from '@/types/models'
import type { PaymentStatus } from '@/types/enums'
import { formatCurrency, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'

type Filter = 'ALL' | PaymentStatus
type Tab = 'parcelas' | 'fluxo'

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted/40" />)}
    </div>
  )
}

// ─── KPI ─────────────────────────────────────────────────────────────────────

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex-1 rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('mt-0.5 text-lg font-semibold tabular-nums', accent)}>{value}</p>
    </div>
  )
}

// ─── Drawer de histórico do paciente ────────────────────────────────────────────

function CustomerDrawer({ customerId, name, onClose }: {
  customerId: string | null; name: string; onClose: () => void
}) {
  const { data, isLoading } = useInstallmentsByCustomer(customerId ?? undefined, !!customerId)
  return (
    <Sheet open={!!customerId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Plano de pagamento</SheetTitle>
          <SheetDescription>{name} — todas as parcelas.</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4 space-y-2">
          {isLoading ? <SkeletonRows /> : (data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma parcela encontrada.</p>
          ) : (
            data!.map((i) => <InstallmentRow key={i.id} installment={i} readOnly />)
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Fluxo de caixa (aba secundária) ────────────────────────────────────────────

function CashflowTab({ monthDate }: { monthDate: Date }) {
  const from = format(subMonths(monthDate, 5), 'yyyy-MM')
  const to = format(monthDate, 'yyyy-MM')
  const { data, isLoading } = useCashflow(from, to)

  const chartData = useMemo(
    () => (data ?? []).map((c) => ({
      mes: format(new Date(`${c.month}-01T00:00:00`), 'MMM/yy', { locale: ptBR }),
      Recebido: c.recebido,
      'A receber': c.aReceber,
    })),
    [data],
  )

  if (isLoading) return <div className="h-72 animate-pulse rounded-lg border bg-muted/40" />
  if (chartData.length === 0) return <p className="text-sm text-muted-foreground">Sem dados de fluxo de caixa.</p>

  return (
    <div className="rounded-lg border bg-card p-4">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => formatCurrency(Number(v))} />
          <Legend />
          <Bar dataKey="Recebido" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="A receber" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'EXPECTED', label: 'A receber' },
  { value: 'PAID', label: 'Pago' },
]

export default function InstallmentsPage() {
  const [monthDate, setMonthDate] = useState(() => new Date())
  const [filter, setFilter] = useState<Filter>('ALL')
  const [onlyOverdue, setOnlyOverdue] = useState(false)
  const [tab, setTab] = useState<Tab>('parcelas')
  const [drawer, setDrawer] = useState<{ id: string; name: string } | null>(null)

  const month = format(monthDate, 'yyyy-MM')

  const list = useInstallmentsByMonth(month, filter === 'ALL' ? undefined : filter)
  const expected = useInstallmentsByMonth(month, 'EXPECTED')   // base para o KPI de atrasados
  const cashflow = useCashflow(month, month)

  const kpi = cashflow.data?.[0]
  const overdueTotal = useMemo(
    () => (expected.data ?? []).filter((i) => i.overdue).reduce((s, i) => s + i.expectedAmount, 0),
    [expected.data],
  )

  const rows = useMemo(() => {
    let r = list.data ?? []
    if (onlyOverdue) r = r.filter((i) => i.overdue)
    return [...r].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  }, [list.data, onlyOverdue])

  function openCustomer(customerId: string) {
    const inst = (list.data ?? []).find((i) => i.customerId === customerId)
    setDrawer({ id: customerId, name: inst?.customerName ?? 'Paciente' })
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Financeiro · Parcelas</h1>
          <p className="text-sm text-muted-foreground">Recebimentos do mês e fluxo de caixa.</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-9" aria-label="Mês anterior"
            onClick={() => setMonthDate((d) => subMonths(d, 1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-32 text-center text-sm font-medium capitalize">
            {format(monthDate, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon" className="size-9" aria-label="Próximo mês"
            onClick={() => setMonthDate((d) => addMonths(d, 1))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Abas */}
      <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-sm">
        <button onClick={() => setTab('parcelas')}
          className={cn('rounded-md px-3 py-1.5 font-medium transition-colors', tab === 'parcelas' ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
          Parcelas
        </button>
        <button onClick={() => setTab('fluxo')}
          className={cn('rounded-md px-3 py-1.5 font-medium transition-colors', tab === 'fluxo' ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
          Fluxo de caixa
        </button>
      </div>

      {tab === 'fluxo' ? (
        <CashflowTab monthDate={monthDate} />
      ) : (
        <>
          {/* KPI strip */}
          <div className="flex flex-wrap gap-3">
            <Kpi label="Recebido" value={formatCurrency(kpi?.recebido ?? 0)} accent="text-emerald-600 dark:text-emerald-400" />
            <Kpi label="A receber" value={formatCurrency(kpi?.aReceber ?? 0)} accent="text-amber-600 dark:text-amber-400" />
            <Kpi label="Atrasado" value={formatCurrency(overdueTotal)} accent={overdueTotal > 0 ? 'text-rose-600 dark:text-rose-400' : undefined} />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-sm">
              {FILTERS.map((f) => (
                <button key={f.value} onClick={() => setFilter(f.value)}
                  className={cn('rounded-md px-3 py-1.5 font-medium transition-colors', filter === f.value ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
                  {f.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="size-4 accent-rose-500" checked={onlyOverdue}
                onChange={(e) => setOnlyOverdue(e.target.checked)} />
              <AlertTriangle className="size-3.5 text-rose-500" /> Só atrasados
            </label>
          </div>

          {/* Lista */}
          {list.isLoading ? (
            <SkeletonRows />
          ) : list.isError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm dark:border-rose-900 dark:bg-rose-950/30">
              <p className="text-rose-700 dark:text-rose-300">Não foi possível carregar as parcelas.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => list.refetch()}>Tentar de novo</Button>
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              {onlyOverdue
                ? 'Nenhuma parcela atrasada neste mês.'
                : `Nenhuma parcela vence em ${format(monthDate, 'MMMM', { locale: ptBR })}.`}
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((i: Installment) => (
                <InstallmentRow key={i.id} installment={i} onOpenCustomer={openCustomer} />
              ))}
            </div>
          )}
        </>
      )}

      <CustomerDrawer
        customerId={drawer?.id ?? null}
        name={drawer?.name ?? ''}
        onClose={() => setDrawer(null)}
      />
    </div>
  )
}
