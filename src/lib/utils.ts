import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Data/hora atual no fuso de Brasília (America/Sao_Paulo) no formato
 * "YYYY-MM-DDTHH:mm:ss" — compatível com `LocalDateTime` do backend.
 * Usa o locale 'sv-SE' (padrão ISO) só para formatar, não para idioma.
 */
export function nowBrasiliaISO(): string {
  return new Date()
    .toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' })
    .replace(' ', 'T')
}

/** Data de hoje em Brasília no formato "YYYY-MM-DD". */
export function todayBrasiliaISO(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

/** Formata um valor numérico em reais (BRL). `null`/`undefined` → "—". */
export function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '—'
  return currencyFormatter.format(value)
}
