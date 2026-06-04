import type {
    Role, Sector,
    TicketStatus, AdsChannel,
    ContactChannel, CustomerSource, PaymentMethod
} from './enums'

export interface DataRangeDTO {
    from: string
    to: string
}

// Spring Data Page — formato de resposta paginada do backend
export interface Page<T> {
    content: T[]
    totalElements: number
    totalPages: number
    number: number
    size: number
    first: boolean
    last: boolean
    numberOfElements: number
    empty: boolean
}

// Identity

// Backend UserResponseDTO retorna apenas { id, name, username, sector, role }
export interface User {
    id: string
    name: string
    username: string
    sector: Sector
    role: Role
}

// Funnel

export interface Customer {
    id: string
    name: string
    cpf?: string           // opcional — pode ser null (US-FUND-01)
    phone: string
    phone2?: string
    email?: string
    initialNote?: string
    source: CustomerSource
    adChannel?: AdsChannel
    adCampaign?: string
    referredBy?: string
    createdBy: string
    createdAt: string
    updatedAt: string
    anonymized: boolean    // ADR-006 — cliente anonimizado (LGPD)
}

export interface LeadTicket {
    id: string
    customerId: string
    status: TicketStatus
    currentSector: Sector
    assignedTo?: string
    scheduledAt?: string
    pendingAt?: string
    closedAt?: string
    recycledAt?: string
    previousTicketId?: string
    procedurePerformedAt?: string
    returnScheduledAt?: string
    createdBy: string
    createdAt: string
    updatedAt: string
}

export interface ContactLog {
    id: string
    ticketId: string
    userId: string
    channel: ContactChannel
    note: string
    statusBefore?: TicketStatus   // só em logs de mudança de status
    statusAfter?: TicketStatus
    occurredAt: string
    createdAt: string
}

// Commercial 

export interface DealProcedure {
    name: string
    code?: string
    tableValue: number
    quantity: number
    note?: string
}

export interface Deal {
    id: string
    ticketId: string
    createdBy: string
    createdBySector: Sector
    procedures: DealProcedure[]
    totalValue: number
    discountPct?: number
    discountApprovedBy?: string
    finalValue?: number
    paymentMethod?: PaymentMethod
    closedBy?: string
    closedAt?: string
    archived: boolean
    createdAt: string
    updatedAt: string
}

export interface DealHistory {
    dealId: string
    changedBy: string
    changedBySector: Sector
    fieldChanged: string
    valueBefore: string
    valueAfter: string
    occurredAt: string
}

export interface DealDetail {
    deal: Deal
    history: DealHistory[]
}

export interface BonusResultDTO {
    value: number
}

// Analytics

export interface AdsRoiResultDTO {
    channel: AdsChannel
    totalInvestment: number
    totalRevenue: number
    roiMultiplier: number
    leadsCount: number
    closedCount: number
}

export interface StageConversionResultDTO {
    sector: Sector
    captureCount: number
    scheduledCount: number
    dealCreatedCount: number
    closedCount: number
    leadsConversionPct: number
    evaluationConversionPct: number
    commercialConversionPct: number
}

export interface SectorDropOffResultDTO {
    sector: Sector
    entryCount: number
    exitCount: number
    lossCount: number
    dropOffPct: number
}

export interface UserPerformanceResultDTO {
    userId: string
    name: string
    sector: Sector
    totalAssigned: number
    totalConverted: number
    conversionPct: number
    avgTicketValue: number
    calculatedBonus: number
}

export interface GlobalDashBoardResultDTO {
    period: DataRangeDTO
    adsRoi: AdsRoiResultDTO[]
    stageConversion: StageConversionResultDTO
    sectorDropOff: SectorDropOffResultDTO[]
    topPerformers: UserPerformanceResultDTO[]
}

