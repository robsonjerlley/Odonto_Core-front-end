import type { Role, Sector, TicketStatus, AdsChannel, ContactChannel, CustomerSource } from '@/types/enums'

export const ROLE_LABELS: Record<Role, string> = {
  ADM_SYSTEM:      'Admin do Sistema',
  ADM_LEADS:       'Admin de Leads',
  USER_LEADS:      'Atendente de Leads',
  USER_ATTENDANT:  'Atendente',
  ADM_EVALUATOR:   'Admin de Avaliação',
  USER_EVALUATOR:  'Avaliador',
  ADM_COMMERCIAL:  'Admin Comercial',
  USER_COMMERCIAL: 'Comercial',
}

export const SECTOR_LABELS: Record<Sector, string> = {
  LEADS:      'Leads',
  ATTENDANT:  'Atendimento',
  EVALUATOR:  'Avaliação',
  COMMERCIAL: 'Comercial',
  ADM:        'Administração',
  MANAGER:    'Gerência',
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  NEW:           'Novo',
  IN_CONTACT:    'Em contato',
  SCHEDULED:     'Agendado',
  IN_EVALUATION: 'Em avaliação',
  NEGOTIATION:   'Negociação',
  WIN:           'Ganho',
  PENDING:       'Pendente',
  RECYCLED:      'Reciclado',
  LOSS:          'Perdido',
}

export const ADS_CHANNEL_LABELS: Record<AdsChannel, string> = {
  GOOGLE:    'Google',
  META:      'Meta',
  INSTAGRAM: 'Instagram',
  TIKTOK:    'TikTok',
  OUTER:     'Externo',
}

export const CONTACT_CHANNEL_LABELS: Record<ContactChannel, string> = {
  ORGANIC:      'Orgânico',
  REFERRAL:     'Indicação',
  FACEBOOK:     'Facebook',
  INSTAGRAM:    'Instagram',
  WHATSAPP:     'WhatsApp',
  PHONE_CALL:   'Ligação',
  WEBSITE_FROM: 'Site',
  OTHER:        'Outro',
}

export const CUSTOMER_SOURCE_LABELS: Record<CustomerSource, string> = {
  ADS_PAID:   'Mídia Paga',
  ORGANIC:    'Orgânico',
  INDICATION: 'Indicação',
}
