import type { Role, Sector, TicketStatus, AdsChannel, ContactChannel, CustomerSource, PaymentMethod, AppointmentType, AppointmentStatus, PaymentStatus } from '@/types/enums'

// ─────────────────────────────────────────────────────────────────────────────
// EQUIPE — Cargos (Role)
// ─────────────────────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<Role, string> = {
  ADM_SYSTEM:      'Administrador',
  ADM_LEADS:       'Gerente de Relacionamento',
  USER_LEADS:      'Consultor(a) de Relacionamento',
  USER_ATTENDANT:  'Recepcionista',
  ADM_EVALUATOR:   'Coordenador Clínico',
  USER_EVALUATOR:  'Especialista Clínico',
  ADM_COMMERCIAL:  'Gerente Comercial',
  USER_COMMERCIAL: 'Consultor(a) Comercial',
}

// ─────────────────────────────────────────────────────────────────────────────
// SETORES (Sector)
// ─────────────────────────────────────────────────────────────────────────────

export const SECTOR_LABELS: Record<Sector, string> = {
  LEADS:      'Relacionamento',
  ATTENDANT:  'Recepção',
  EVALUATOR:  'Clínico',
  COMMERCIAL: 'Comercial',
  ADM:        'Administração',
  MANAGER:    'Gerência',
}

// ─────────────────────────────────────────────────────────────────────────────
// PIPELINE — Status do ticket
// ─────────────────────────────────────────────────────────────────────────────

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  NEW:            'Novo Lead',
  IN_CONTACT:     'Em Contato',
  SCHEDULED:      'Consulta Agendada',
  IN_EVALUATION:  'Em Avaliação',
  NEGOTIATION:    'Em Negociação',
  WIN:            'Fechado',
  PENDING:        'Em Espera',
  RECYCLED:       'Reativado',
  LOSS:           'Não Convertido',
  POST_PROCEDURE: 'Pós-Procedimento',
}

/** Uso: <Badge className={TICKET_STATUS_COLOR[status]}> */
export const TICKET_STATUS_COLOR: Record<TicketStatus, string> = {
  NEW:            'bg-sky-100 text-sky-800 border-sky-200',
  IN_CONTACT:     'bg-teal-100 text-teal-800 border-teal-200',
  SCHEDULED:      'bg-amber-100 text-amber-800 border-amber-200',
  IN_EVALUATION:  'bg-teal-100 text-teal-800 border-teal-200',
  NEGOTIATION:    'bg-teal-100 text-teal-800 border-teal-200',
  WIN:            'bg-emerald-100 text-emerald-800 border-emerald-200',
  PENDING:        'bg-amber-100 text-amber-800 border-amber-200',
  RECYCLED:       'bg-slate-100 text-slate-600 border-slate-200',
  LOSS:           'bg-rose-100 text-rose-800 border-rose-200',
  POST_PROCEDURE: 'bg-violet-100 text-violet-800 border-violet-200',
}

/**
 * Ordem das colunas no Kanban (Pipeline).
 * Inclui WIN (Fechado) e POST_PROCEDURE para dar visibilidade e ponto de entrada
 * às ações de pós-venda (procedimento realizado, agendar retorno, perda).
 * LOSS e RECYCLED ficam fora: LOSS é estado morto e RECYCLED é transição
 * automática do RecycleJob que reabre um novo ticket NEW.
 */
export const KANBAN_COLUMN_ORDER: TicketStatus[] = [
  'NEW',
  'IN_CONTACT',
  'SCHEDULED',
  'IN_EVALUATION',
  'NEGOTIATION',
  'PENDING',
  'WIN',
  'POST_PROCEDURE',
]

/** Statuses terminais/fora do fluxo arrastável do Kanban. */
export const TERMINAL_STATUSES: TicketStatus[] = ['LOSS', 'RECYCLED']

// ─────────────────────────────────────────────────────────────────────────────
// CANAIS DE CAPTAÇÃO (AdsChannel)
// ─────────────────────────────────────────────────────────────────────────────

export const ADS_CHANNEL_LABELS: Record<AdsChannel, string> = {
  GOOGLE:    'Google Ads',
  META:      'Meta Ads',
  INSTAGRAM: 'Instagram',
  TIKTOK:    'TikTok',
  OUTER:     'Outro Canal',
}

// ─────────────────────────────────────────────────────────────────────────────
// CANAIS DE CONTATO (ContactChannel)
// ─────────────────────────────────────────────────────────────────────────────

export const CONTACT_CHANNEL_LABELS: Record<ContactChannel, string> = {
  ORGANIC:      'Espontâneo',
  REFERRAL:     'Indicação',
  FACEBOOK:     'Facebook',
  INSTAGRAM:    'Instagram',
  WHATSAPP:     'WhatsApp',
  PHONE_CALL:   'Ligação',
  WEBSITE_FROM: 'Site',
  OTHER:        'Outro',
}

// ─────────────────────────────────────────────────────────────────────────────
// ORIGEM DO PACIENTE (CustomerSource)
// ─────────────────────────────────────────────────────────────────────────────

export const CUSTOMER_SOURCE_LABELS: Record<CustomerSource, string> = {
  ADS_PAID:   'Mídia Paga',
  ORGANIC:    'Orgânico',
  INDICATION: 'Indicação',
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAS DE PAGAMENTO (PaymentMethod)
// ─────────────────────────────────────────────────────────────────────────────

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  PIX:              'PIX',
  CASH:             'Dinheiro',
  DEBIT_CARD:       'Cartão de Débito',
  CREDIT_CARD:      'Cartão de Crédito',
  INSTALLMENT:      'Parcelado',
  DENTAL_INSURANCE: 'Convênio / Plano',
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENDA — Tipo de atendimento (AppointmentType)
// ─────────────────────────────────────────────────────────────────────────────

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  EVALUATION: 'Avaliação',
  PROCEDURE:  'Procedimento',
}

/** Cor por tipo — laranja=avaliação, esmeralda=procedimento (linguagem da ADR-030). */
export const APPOINTMENT_TYPE_COLOR: Record<AppointmentType, string> = {
  EVALUATION: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  PROCEDURE:  'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
}

/** Ponto de cor (dot) por tipo, para a coluna da linha da agenda. */
export const APPOINTMENT_TYPE_DOT: Record<AppointmentType, string> = {
  EVALUATION: 'bg-orange-500',
  PROCEDURE:  'bg-emerald-500',
}

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  AWAITING_SCHEDULE: 'A agendar',
  SCHEDULED:         'Agendado',
  DONE:              'Concluído',
  CANCELLED:         'Cancelado',
}

// ─────────────────────────────────────────────────────────────────────────────
// FINANCEIRO — Status de pagamento (PaymentStatus)
// ─────────────────────────────────────────────────────────────────────────────

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  EXPECTED: 'A receber',
  PAID:     'Pago',
}

// ─────────────────────────────────────────────────────────────────────────────
// SETORES — Cores de badge (alinhadas à paleta de seção do sistema)
// ─────────────────────────────────────────────────────────────────────────────

/** Uso: <Badge variant="outline" className={SECTOR_BADGE_COLOR[sector]}> */
export const SECTOR_BADGE_COLOR: Record<Sector, string> = {
  LEADS:      'bg-blue-100   text-blue-800   border-blue-200   dark:bg-blue-900/30   dark:text-blue-300   dark:border-blue-800',
  ATTENDANT:  'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
  EVALUATOR:  'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  COMMERCIAL: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  ADM:        'bg-teal-100   text-teal-800   border-teal-200   dark:bg-teal-900/30   dark:text-teal-300   dark:border-teal-800',
  MANAGER:    'bg-amber-100  text-amber-800  border-amber-200  dark:bg-amber-900/30  dark:text-amber-300  dark:border-amber-800',
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVEGAÇÃO — Menu lateral
// ─────────────────────────────────────────────────────────────────────────────

export const NAV_LABELS = {
  home:           'Início',
  analytics:      'Analytics',
  sectorAnalytics: 'Analytics do Setor',
  pipeline:       'Pipeline',
  patients:      'Pacientes',
  agenda:        'Agenda',
  evaluations:   'Avaliações',
  negotiations:  'Negociações',
  financial:     'Financeiro',
  performance:   'Performance',
  settings:      'Configurações',
  procedures:    'Procedimentos',
  team:          'Equipe',
  logout:        'Sair',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Converte qualquer enum em array de opções { value, label } para uso em <Select>. */
export function toSelectOptions<T extends string>(
  labels: Record<T, string>,
): { value: T; label: string }[] {
  return (Object.entries(labels) as [T, string][]).map(([value, label]) => ({
    value,
    label,
  }))
}

export const ROLE_OPTIONS            = toSelectOptions(ROLE_LABELS)
export const SECTOR_OPTIONS          = toSelectOptions(SECTOR_LABELS)
export const TICKET_STATUS_OPTIONS   = toSelectOptions(TICKET_STATUS_LABELS)
export const ADS_CHANNEL_OPTIONS     = toSelectOptions(ADS_CHANNEL_LABELS)
export const CONTACT_CHANNEL_OPTIONS = toSelectOptions(CONTACT_CHANNEL_LABELS)
export const CUSTOMER_SOURCE_OPTIONS = toSelectOptions(CUSTOMER_SOURCE_LABELS)
export const PAYMENT_METHOD_OPTIONS  = toSelectOptions(PAYMENT_METHOD_LABELS)
