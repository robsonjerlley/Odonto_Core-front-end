import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  procedureService,
  type ProcedureCreateDTO,
  type ProcedureUpdateDTO,
} from './procedure.service'
import type { Procedure } from '@/types/models'

export const PROCEDURES_KEY = ['procedures'] as const

export function useProcedures(enabled = true) {
  return useQuery<Procedure[]>({
    queryKey: PROCEDURES_KEY,
    queryFn: () => procedureService.search(),
    enabled,
  })
}

export function useCreateProcedure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: ProcedureCreateDTO) => procedureService.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROCEDURES_KEY }),
  })
}

export function useUpdateProcedure(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: ProcedureUpdateDTO) => procedureService.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROCEDURES_KEY }),
  })
}

export function useDeleteProcedure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => procedureService.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROCEDURES_KEY }),
  })
}
