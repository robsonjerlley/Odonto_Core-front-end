import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useHasRole } from '@/hooks/useHasRole'
import { Role } from '@/types/enums'
import { Button } from '@/components/ui/button'
import { ROLE_LABELS, NAV_LABELS } from '@/lib/labels'

export default function AppLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = useHasRole(Role.ADM_SYSTEM)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded-md text-sm transition-colors ${
      isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
    }`

  return (
    <div className="flex h-screen">
      <aside className="w-56 border-r flex flex-col">
        <div className="p-4 border-b font-semibold">OdontoCore</div>
        <nav className="flex-1 p-2 space-y-1">
          <NavLink to="/" end className={navLinkClass}>{NAV_LABELS.overview}</NavLink>
          <NavLink to="/funnel" className={navLinkClass}>{NAV_LABELS.pipeline}</NavLink>
          <NavLink to="/customers" className={navLinkClass}>{NAV_LABELS.patients}</NavLink>
          <NavLink to="/commercial" className={navLinkClass}>{NAV_LABELS.negotiations}</NavLink>
          {isAdmin && (
            <>
              <NavLink to="/users" className={navLinkClass}>{NAV_LABELS.team}</NavLink>
              <NavLink to="/config" className={navLinkClass}>{NAV_LABELS.settings}</NavLink>
            </>
          )}
        </nav>
        <div className="p-3 border-t space-y-1">
          <p className="text-xs font-medium truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {user?.role ? ROLE_LABELS[user.role] : user?.username}
          </p>
          <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
