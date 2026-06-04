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
