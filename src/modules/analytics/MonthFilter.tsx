import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface MonthFilterProps {
  month: string // "yyyy-MM"
  onApply: (month: string) => void
}

/**
 * Seletor de mês único. Garante por construção que o período enviado ao analytics
 * fica contido em um mês calendário (v1.5/ADR-016 — cross-month responde 422).
 */
export function MonthFilter({ month, onApply }: MonthFilterProps) {
  const [value, setValue] = useState(month)

  const isValid = value.length >= 7 && value.split('-')[0].length === 4

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label className="sr-only" htmlFor="period-month">Mês de referência</label>
      <input
        id="period-month"
        type="month"
        className="border rounded-md px-3 py-1.5 text-sm bg-background"
        value={value}
        min="2000-01"
        max="2099-12"
        onChange={(e) => {
          const val = e.target.value
          const year = val.split('-')[0]
          if (year && year.length > 4) return
          setValue(val)
        }}
      />
      <Button size="sm" onClick={() => onApply(value)} disabled={!isValid}>
        Aplicar
      </Button>
    </div>
  )
}
