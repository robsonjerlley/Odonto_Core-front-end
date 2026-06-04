import { TicketStatus, Role } from '@/types/enums'

/**
 * Máquina de estados do funil — espelho exato de `LeadTicketServiceImpl`
 * (`ALLOWED_TRANSITIONS` + `TRANSITION_ROLES`) no backend.
 *
 * Fluxo:
 *   NEW → IN_CONTACT → SCHEDULED → IN_EVALUATION → NEGOTIATION → WIN → POST_PROCEDURE
 *                  ↘ LOSS        ↘ LOSS          ↘ PENDING → RECYCLED → (novo NEW)
 *                                                  POST_PROCEDURE → SCHEDULED | LOSS
 *
 * Observações importantes do backend:
 * - De NEGOTIATION só se vai para WIN ou PENDING — **não existe NEGOTIATION → LOSS**.
 * - PENDING só sai para RECYCLED (transição automática pelo RecycleJob após o prazo
 *   da RecycleConfig). RECYCLED reabre o ciclo em NEW.
 * - Transição → SCHEDULED exige o Customer com CPF preenchido (validado no backend).
 */
export const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.NEW]:            [TicketStatus.IN_CONTACT],
  [TicketStatus.IN_CONTACT]:     [TicketStatus.SCHEDULED, TicketStatus.LOSS],
  [TicketStatus.SCHEDULED]:      [TicketStatus.IN_EVALUATION],
  [TicketStatus.IN_EVALUATION]:  [TicketStatus.NEGOTIATION, TicketStatus.LOSS],
  [TicketStatus.NEGOTIATION]:    [TicketStatus.WIN, TicketStatus.PENDING],
  [TicketStatus.PENDING]:        [TicketStatus.RECYCLED],
  [TicketStatus.RECYCLED]:       [TicketStatus.NEW],
  [TicketStatus.WIN]:            [TicketStatus.POST_PROCEDURE],
  [TicketStatus.POST_PROCEDURE]: [TicketStatus.SCHEDULED, TicketStatus.LOSS],
  [TicketStatus.LOSS]:           [],
}

/**
 * Restrição de papel por status de **destino** (espelha `TRANSITION_ROLES`).
 * Status ausente do mapa = qualquer papel com TICKET:UPDATE pode transicionar.
 */
export const TRANSITION_ROLES: Partial<Record<TicketStatus, Role[]>> = {
  [TicketStatus.WIN]:            [Role.USER_COMMERCIAL, Role.ADM_COMMERCIAL, Role.ADM_SYSTEM],
  [TicketStatus.LOSS]:           [Role.USER_LEADS, Role.ADM_LEADS, Role.ADM_SYSTEM],
  [TicketStatus.POST_PROCEDURE]: [Role.USER_ATTENDANT, Role.USER_LEADS, Role.ADM_LEADS, Role.ADM_SYSTEM],
}

/** USER_ATTENDANT é explicitamente bloqueado destes destinos (US-FUND-02). */
const ATTENDANT_BLOCKED: TicketStatus[] = [TicketStatus.LOSS, TicketStatus.IN_CONTACT]

/** O papel pode mover o ticket de `from` para `to`? */
export function canTransition(
  role: Role | undefined | null,
  from: TicketStatus,
  to: TicketStatus,
): boolean {
  if (!role) return false
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) return false
  if (role === Role.USER_ATTENDANT && ATTENDANT_BLOCKED.includes(to)) return false
  const roles = TRANSITION_ROLES[to]
  if (roles && !roles.includes(role)) return false
  return true
}

/** Lista os destinos válidos para o papel a partir de `from`. */
export function availableTransitions(
  role: Role | undefined | null,
  from: TicketStatus,
): TicketStatus[] {
  return (ALLOWED_TRANSITIONS[from] ?? []).filter((to) => canTransition(role, from, to))
}
