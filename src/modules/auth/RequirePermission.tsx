import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { can, firstAccessibleRoute, type Resource, type Action } from '@/lib/permissions'

interface RequirePermissionProps {
  resource: Resource
  action: Action
}

/**
 * Guarda de rota: bloqueia o acesso quando o papel não tem a permissão exigida
 * e redireciona para a primeira rota acessível do usuário.
 */
export default function RequirePermission({ resource, action }: RequirePermissionProps) {
  const role = useAuthStore((state) => state.user?.role)

  if (!can(role, resource, action)) {
    return <Navigate to={firstAccessibleRoute(role)} replace />
  }

  return <Outlet />
}
