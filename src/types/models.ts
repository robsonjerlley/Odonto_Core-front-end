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
    channel: ContactChannel
    notes?: string
    scheduledAt?: string
    createdBy: string
    createdAt: string
}

// Commercial 

export interface DealProcedure {
    name: string
    quantity: number
    unitPrice: number
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

// Analytics

export interface AdsRoiResultDTO {
    channel: AdsChannel
    investment: number
    revenue: number
    roi: number
}

export interface StageConversionResultDTO {
    stage: TicketStatus
    entered: number 
    converted: number
    conversionRate: number 
}

export interface SectorDropOffResultDTO {
    sector: Sector
    received: number
    lost: number
    dropOffRate: number
}


export interface UserPerformanceResultDTO {
    userId: string
    username: string
    sector: Sector
    wins: number
    totalDeals: number
    revenue: number
}

export interface GlobalDashboard {
    period: DataRangeDTO
    adsRoi: AdsRoiResultDTO[]
    stageConversion: StageConversionResultDTO[]
    sectorDropOff: SectorDropOffResultDTO[]
    topPerformers: UserPerformanceResultDTO[]

}

