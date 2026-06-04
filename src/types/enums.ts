export const Role = {
  ADM_SYSTEM:      'ADM_SYSTEM',
  ADM_LEADS:       'ADM_LEADS',
  USER_LEADS:      'USER_LEADS',
  USER_ATTENDANT:  'USER_ATTENDANT',
  ADM_EVALUATOR:   'ADM_EVALUATOR',
  USER_EVALUATOR:  'USER_EVALUATOR',
  ADM_COMMERCIAL:  'ADM_COMMERCIAL',
  USER_COMMERCIAL: 'USER_COMMERCIAL',
} as const
export type Role = typeof Role[keyof typeof Role]

export const Sector = {
  LEADS:      'LEADS',
  ATTENDANT:  'ATTENDANT',
  EVALUATOR:  'EVALUATOR',
  COMMERCIAL: 'COMMERCIAL',
  ADM:        'ADM',
  MANAGER:    'MANAGER',
} as const
export type Sector = typeof Sector[keyof typeof Sector]

export const TicketStatus = {
  NEW:             'NEW',
  IN_CONTACT:      'IN_CONTACT',
  SCHEDULED:       'SCHEDULED',
  IN_EVALUATION:   'IN_EVALUATION',
  NEGOTIATION:     'NEGOTIATION',
  WIN:             'WIN',
  PENDING:         'PENDING',
  RECYCLED:        'RECYCLED',
  LOSS:            'LOSS',
  POST_PROCEDURE:  'POST_PROCEDURE',
} as const
export type TicketStatus = typeof TicketStatus[keyof typeof TicketStatus]

export const AdsChannel = {
  GOOGLE:    'GOOGLE',
  META:      'META',
  INSTAGRAM: 'INSTAGRAM',
  TIKTOK:    'TIKTOK',
  OUTER:     'OUTER',
} as const
export type AdsChannel = typeof AdsChannel[keyof typeof AdsChannel]

export const ContactChannel = {
  ORGANIC:      'ORGANIC',
  REFERRAL:     'REFERRAL',
  FACEBOOK:     'FACEBOOK',
  INSTAGRAM:    'INSTAGRAM',
  WHATSAPP:     'WHATSAPP',
  PHONE_CALL:   'PHONE_CALL',
  WEBSITE_FROM: 'WEBSITE_FROM',
  OTHER:        'OTHER',
} as const
export type ContactChannel = typeof ContactChannel[keyof typeof ContactChannel]

export const CustomerSource = {
  ADS_PAID:   'ADS_PAID',
  ORGANIC:    'ORGANIC',
  INDICATION: 'INDICATION',
} as const
export type CustomerSource = typeof CustomerSource[keyof typeof CustomerSource]

export const PaymentMethod = {
  PIX:              'PIX',
  CASH:             'CASH',
  DEBIT_CARD:       'DEBIT_CARD',
  CREDIT_CARD:      'CREDIT_CARD',
  INSTALLMENT:      'INSTALLMENT',
  DENTAL_INSURANCE: 'DENTAL_INSURANCE',
} as const
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod]

/**
 * Percentual líquido que a clínica recebe após taxas por forma de pagamento.
 * Espelha `PaymentMethod.conversionFactor` do backend (ADR-008). Usado para
 * exibir o valor esperado em caixa (`expectedCash = finalValue × fator`).
 */
export const PAYMENT_METHOD_CONVERSION_FACTOR: Record<PaymentMethod, number> = {
  PIX:              1.00,
  CASH:             1.00,
  DEBIT_CARD:       0.98,
  CREDIT_CARD:      0.97,
  INSTALLMENT:      0.85,
  DENTAL_INSURANCE: 0.90,
}