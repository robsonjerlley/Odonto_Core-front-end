import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { useUserPerformance, useBonus } from './analytics.queries'
import type { AnalyticsPeriod } from './analytics.service'
import { useAuthStore } from '@/store/auth.store'
import { SECTOR_LABELS } from '@/lib/labels'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function currency(v: number | null | undefined) {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function pct(v: number | null | undefined) {
  if (v == null) return '—'
  return `${Number(v).toFixed(1)}%`
}

function defaultPeriod(): AnalyticsPeriod {
  const today = new Date()
  return {
    from: format(subDays(today, 30), 'yyyy-MM-dd'),
    to: format(today, 'yyyy-MM-dd'),
  }
}

function PeriodFilter({ period, onApply }: { period: AnalyticsPeriod; onApply: (p: AnalyticsPeriod) => void }) {
  const [start, setStart] = useState(period.from)
  const [end, setEnd] = useState(period.to)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label className="sr-only" htmlFor="period-start">Data inicial</label>
      <input
        id="period-start"
        type="date"
        className="border rounded-md px-3 py-1.5 text-sm bg-background"
        value={start}
        onChange={(e) => setStart(e.target.value)}
      />
      <span className="text-muted-foreground text-sm">até</span>
      <label className="sr-only" htmlFor="period-end">Data final</label>
      <input
        id="period-end"
        type="date"
        className="border rounded-md px-3 py-1.5 text-sm bg-background"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
      />
      <Button size="sm" onClick={() => onApply({ from: start, to: end })}>
        Aplicar
      </Button>
    </div>
  )
}

export default function MyPerformancePage() {
  const user = useAuthStore((state) => state.user)
  const [period, setPeriod] = useState<AnalyticsPeriod>(defaultPeriod)
  const [periodRef, setPeriodRef] = useState(format(new Date(), 'yyyy-MM'))

  const userId = user?.id ?? ''
  const { data: perf, isLoading } = useUserPerformance(userId, period)
  const { data: bonus, isLoading: bonusLoading } = useBonus(userId, periodRef)

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
            Suas métricas pessoais de atendimento e conversão no período.
          </p>
        </div>
        <PeriodFilter period={period} onApply={setPeriod} />
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
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 max-w-xs">
            <label className="sr-only" htmlFor="bonus-period">Mês de referência (AAAA-MM)</label>
            <input
              id="bonus-period"
              type="text"
              placeholder="AAAA-MM"
              pattern="\d{4}-\d{2}"
              className="border rounded-md px-3 py-1.5 text-sm bg-background flex-1"
              value={periodRef}
              onChange={(e) => setPeriodRef(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center rounded-lg bg-muted/40 p-3 max-w-xs">
            <span className="text-sm text-muted-foreground">Bônus do período</span>
            <span className="font-bold text-lg">
              {bonusLoading ? '...' : currency(bonus ?? null)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
