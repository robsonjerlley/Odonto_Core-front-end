import type {
    Role, Sector,
    TicketStatus, AdsChannel,
    ContactChannel, CustomerSource
} from './enums'

export interface DataRangeDTO {
    startDate: string 
    endDate: string
}

// Identity

export interface User {
    id: string
    name: string
    username: string
    sector: Sector
    role: Role
    active: boolean
    createdBy?: string
    createdAt: string
    updatedAt: string 
}

// Funnel

export interface Customer {
    id: string
    name: string
    cpf: string
    phone: string
    email: string
    source: CustomerSource
    adChannel?: AdsChannel
    adCampaign?: string
    referredBy?: string
    createdBy: string
    createdAt: string
    updatedAt: string
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
    statusBefore: TicketStatus
    statusAfter: TicketStatus
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
    createdBySector: Sector
    createdBy: string
    procedures: DealProcedure[]
    totalValue: number
    discountPct?: number
    discountApprovedBy?: string
    finalValue?: number
    paymentMethod?: string
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

export interface GlobalDashboard {
    period: DataRangeDTO
    adsRoi: AdsRoiResultDTO[]
    stageConversion: StageConversionResultDTO
    sectorDropOff: SectorDropOffResultDTO[]
    topPerformers: UserPerformanceResultDTO[]
}

