import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { AnalyticsPeriod } from './analytics.service'

interface DateRangeFilterProps {
  period: AnalyticsPeriod
  onApply: (period: AnalyticsPeriod) => void
}

const MIN_DATE = '2000-01-01'
const MAX_DATE = '2099-12-31'

function isValidDate(value: string): boolean {
  if (!value) return false
  const year = value.split('-')[0]
  return year.length === 4
}

export function DateRangeFilter({ period, onApply }: DateRangeFilterProps) {
  const [from, setFrom] = useState(period.from)
  const [to, setTo] = useState(period.to)

  const canApply = isValidDate(from) && isValidDate(to) && from <= to

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label className="sr-only" htmlFor="period-from">De</label>
      <input
        id="period-from"
        type="date"
        className="border rounded-md px-3 py-1.5 text-sm bg-background"
        value={from}
        min={MIN_DATE}
        max={to || MAX_DATE}
        onChange={(e) => {
          const val = e.target.value
          const year = val.split('-')[0]
          if (year && year.length > 4) return
          setFrom(val)
        }}
      />
      <span className="text-sm text-muted-foreground">até</span>
      <label className="sr-only" htmlFor="period-to">Até</label>
      <input
        id="period-to"
        type="date"
        className="border rounded-md px-3 py-1.5 text-sm bg-background"
        value={to}
        min={from || MIN_DATE}
        max={MAX_DATE}
        onChange={(e) => {
          const val = e.target.value
          const year = val.split('-')[0]
          if (year && year.length > 4) return
          setTo(val)
        }}
      />
      <Button size="sm" onClick={() => onApply({ from, to })} disabled={!canApply}>
        Aplicar
      </Button>
    </div>
  )
}
