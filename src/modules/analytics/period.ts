import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { AnalyticsPeriod } from './analytics.service'

// O backend (v1.5/ADR-016) exige que `from/to` caiba em um único mês calendário —
// range cruzando meses → 422 (vale para /dashboard e /user-performance). Por isso o
// período é sempre derivado de um mês "yyyy-MM" escolhido no <input type="month">.

/** "yyyy-MM" do mês atual — default do seletor. */
export function currentMonth(): string {
  return format(new Date(), 'yyyy-MM')
}

/** "yyyy-MM" → { from: 1º dia, to: último dia } do mês. */
export function monthToPeriod(month: string): AnalyticsPeriod {
  const [year, m] = month.split('-').map(Number)
  const first = new Date(year, m - 1, 1)
  const last = new Date(year, m, 0) // dia 0 do mês seguinte = último dia do mês atual
  return {
    from: format(first, 'yyyy-MM-dd'),
    to: format(last, 'yyyy-MM-dd'),
  }
}

/** "yyyy-MM" → "jun/2026". Usa o `bonusPeriodRef` devolvido pelo backend. */
export function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-').map(Number)
  return format(new Date(year, m - 1, 1), 'MMM/yyyy', { locale: ptBR })
}
