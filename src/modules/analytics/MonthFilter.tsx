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

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label className="sr-only" htmlFor="period-month">Mês de referência</label>
      <input
        id="period-month"
        type="month"
        className="border rounded-md px-3 py-1.5 text-sm bg-background"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button size="sm" onClick={() => onApply(value)}>
        Aplicar
      </Button>
    </div>
  )
}
