import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { AnalyticsPeriod } from './analytics.service'

interface DateRangeFilterProps {
  period: AnalyticsPeriod
  onApply: (period: AnalyticsPeriod) => void
}

export function DateRangeFilter({ period, onApply }: DateRangeFilterProps) {
  const [from, setFrom] = useState(period.from)
  const [to, setTo] = useState(period.to)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label className="sr-only" htmlFor="period-from">De</label>
      <input
        id="period-from"
        type="date"
        className="border rounded-md px-3 py-1.5 text-sm bg-background"
        value={from}
        max={to}
        onChange={(e) => setFrom(e.target.value)}
      />
      <span className="text-sm text-muted-foreground">até</span>
      <label className="sr-only" htmlFor="period-to">Até</label>
      <input
        id="period-to"
        type="date"
        className="border rounded-md px-3 py-1.5 text-sm bg-background"
        value={to}
        min={from}
        onChange={(e) => setTo(e.target.value)}
      />
      <Button size="sm" onClick={() => onApply({ from, to })} disabled={!from || !to || from > to}>
        Aplicar
      </Button>
    </div>
  )
}
