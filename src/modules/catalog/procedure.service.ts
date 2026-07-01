import api from '@/lib/api'
import type { Procedure, Page } from '@/types/models'

export interface ProcedureCreateDTO {
  name: string
  code?: string
  defaultPrice: number
}

export interface ProcedureUpdateDTO {
  name: string
  code?: string
  defaultPrice: number
  active: boolean
}

const BASE = '/api/v1/procedures'

export const procedureService = {
  /** Busca paginada; desempacota `Page.content`. Filtros por nome/código (opcionais). */
  search: (params?: { name?: string; code?: string }) =>
    api
      .get<Page<Procedure>>(BASE, { params: { size: 200, ...params } })
      .then((r) => r.data.content),

  create: (dto: ProcedureCreateDTO) =>
    api.post<Procedure>(BASE, dto).then((r) => r.data),

  update: (id: string, dto: ProcedureUpdateDTO) =>
    api.patch<Procedure>(`${BASE}/${id}`, dto).then((r) => r.data),

  softDelete: (id: string) =>
    api.delete<void>(`${BASE}/${id}`).then(() => undefined),
}
