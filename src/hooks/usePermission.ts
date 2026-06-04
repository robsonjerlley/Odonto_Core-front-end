import { useAuthStore } from '@/store/auth.store'
import { can, type Resource, type Action } from '@/lib/permissions'

/** Retorna se o usuário logado pode executar `action` sobre `resource`. */
export function usePermission(resource: Resource, action: Action): boolean {
  const role = useAuthStore((state) => state.user?.role)
  return can(role, resource, action)
}
