import api from '@/lib/api'
import type { Appointment, BatchScheduleResult, Page } from '@/types/models'
import type { AppointmentStatus } from '@/types/enums'

export interface ScheduleDTO {
  scheduledAt: string          // LocalDateTime "YYYY-MM-DDTHH:mm:ss"
  assignedTo?: string
}

export interface RescheduleDTO {
  scheduledAt: string
}

export interface AssigneeDTO {
  assignedTo: string
}

export interface CancelDTO {
  cancelReason: string
}

export interface BatchItemDTO {
  appointmentId: string
  scheduledAt: string
  assignedTo?: string
}

const BASE = '/api/v1/appointments'

export const appointmentService = {
  findByStatus: (status: AppointmentStatus) =>
    api.get<Page<Appointment>>(BASE, { params: { status } }).then((r) => r.data.content),

  /** Agenda de um executor num intervalo (from/to = LocalDateTime). */
  findAssignedBetween: (assignedTo: string, from: string, to: string) =>
    api
      .get<Page<Appointment>>(BASE, { params: { assignedTo, from, to } })
      .then((r) => r.data.content),

  schedule: (id: string, dto: ScheduleDTO) =>
    api.patch<Appointment>(`${BASE}/${id}/schedule`, dto).then((r) => r.data),

  reschedule: (id: string, dto: RescheduleDTO) =>
    api.patch<Appointment>(`${BASE}/${id}/reschedule`, dto).then((r) => r.data),

  assignee: (id: string, dto: AssigneeDTO) =>
    api.patch<Appointment>(`${BASE}/${id}/assignee`, dto).then((r) => r.data),

  cancel: (id: string, dto: CancelDTO) =>
    api.patch<Appointment>(`${BASE}/${id}/cancel`, dto).then((r) => r.data),

  /** 202 sem corpo — concluir. */
  complete: (id: string) => api.patch<void>(`${BASE}/${id}/complete`).then(() => undefined),

  scheduleBatch: (items: BatchItemDTO[]) =>
    api.patch<BatchScheduleResult>(`${BASE}/schedule-batch`, items).then((r) => r.data),
}
