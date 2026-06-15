import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { AnalyticsPeriod } from './analytics.service'

/** "yyyy-MM" do mês atual — default do seletor de mês (MyPerformancePage). */
export function currentMonth(): string {
  return format(new Date(), 'yyyy-MM')
}

/** Últimos 30 dias — default do seletor de range do dashboard (ADR-017: range livre). */
export function defaultPeriod(): AnalyticsPeriod {
  const today = new Date()
  const from = new Date(today)
  from.setDate(today.getDate() - 29)
  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(today, 'yyyy-MM-dd'),
  }
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
