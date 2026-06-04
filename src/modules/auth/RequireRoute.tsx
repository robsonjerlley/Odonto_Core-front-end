import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { canAccessRoute, firstAccessibleRoute, type AppRoute } from '@/lib/permissions'

/**
 * Guarda de rota baseada no caminho — resolve tanto rotas de capacidade quanto
 * as de analytics (que dependem de escopo GLOBAL/OWN). Quando o papel não pode
 * acessar, redireciona para a primeira rota acessível.
 */
export default function RequireRoute({ path }: { path: AppRoute }) {
  const role = useAuthStore((state) => state.user?.role)

  if (!canAccessRoute(role, path)) {
    return <Navigate to={firstAccessibleRoute(role)} replace />
  }

  return <Outlet />
}
