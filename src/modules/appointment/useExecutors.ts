import { useMemo } from 'react'
import { useUsers } from '@/modules/identity/users.queries'
import { usePermission } from '@/hooks/usePermission'
import { useAuthStore } from '@/store/auth.store'

export interface Executor {
  id: string
  name: string
}

/**
 * Lista de profissionais selecionáveis como executor de um atendimento.
 *
 * Só papéis com `USER:READ` (ADM_SYSTEM) conseguem listar usuários; para os
 * demais o dropdown degrada para apenas o usuário logado. `solo` indica clínica
 * de um único operador — nesse caso o filtro/dropdown de executor deve ficar
 * oculto ou travado (ADR-Frontend-003 §5).
 */
export function useExecutors(): { executors: Executor[]; solo: boolean } {
  const canReadUsers = usePermission('USER', 'READ')
  const currentUser = useAuthStore((s) => s.user)
  const { data: users } = useUsers(canReadUsers)

  return useMemo(() => {
    if (canReadUsers && users && users.length > 0) {
      const executors = users.map((u) => ({ id: u.id, name: u.name }))
      return { executors, solo: executors.length <= 1 }
    }
    // Fallback: sem leitura de usuários, só o próprio operador.
    const self = currentUser ? [{ id: currentUser.id, name: currentUser.name }] : []
    return { executors: self, solo: true }
  }, [canReadUsers, users, currentUser])
}
