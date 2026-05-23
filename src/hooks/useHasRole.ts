import { useAuthStore } from '@/store/auth.store'
import type { Role } from '@/types/enums'

export function useHasRole(...roles: Role[]): boolean {
  const userRole = useAuthStore((state) => state.user?.role)
  return userRole !== undefined && (roles as string[]).includes(userRole)
}
