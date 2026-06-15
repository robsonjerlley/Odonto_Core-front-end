import { useMemo, useState } from 'react'
import { useUserPerformance } from './analytics.queries'
import { MonthFilter } from './MonthFilter'
import { currentMonth, monthToPeriod, formatMonthLabel } from './period'
import { useAuthStore } from '@/store/auth.store'
import { SECTOR_LABELS } from '@/lib/labels'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function currency(v: number | null | undefined) {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function pct(v: number | null | undefined) {
  if (v == null) return '—'
  return `${Number(v).toFixed(1)}%`
}

export default function MyPerformancePage() {
  const user = useAuthStore((state) => state.user)
  const [month, setMonth] = useState(currentMonth)
  const period = useMemo(() => monthToPeriod(month), [month])

  const userId = user?.id ?? ''
  const { data: perf, isLoading } = useUserPerformance(userId, period)

  const metrics = [
    { label: 'Atribuídos', value: perf ? String(perf.totalAssigned) : '—' },
    { label: 'Convertidos', value: perf ? String(perf.totalConverted) : '—' },
    { label: 'Conversão', value: pct(perf?.conversionPct) },
    { label: 'Ticket médio', value: currency(perf?.avgTicketValue) },
    { label: 'Caixa esperado', value: currency(perf?.expectedCash) },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meu desempenho</h1>
          <p className="text-sm text-muted-foreground">
            Suas métricas pessoais de atendimento e conversão no mês.
          </p>
        </div>
        <MonthFilter month={month} onApply={setMonth} />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando dados...</p>}

      {perf && (
        <p className="text-sm text-muted-foreground">
          {perf.name} · {SECTOR_LABELS[perf.sector]}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-2xl font-semibold tracking-tight mt-1">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bônus apurado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center rounded-lg bg-muted/40 p-3 max-w-xs">
            <span className="text-sm text-muted-foreground">
              {perf ? `Bônus de ${formatMonthLabel(perf.bonusPeriodRef)}` : 'Bônus do mês'}
            </span>
            <span className="font-bold text-lg">
              {currency(perf?.calculatedBonus)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
