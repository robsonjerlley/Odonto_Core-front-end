import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Workflow, Users, Handshake,
  UserCog, Settings, LogOut, type LucideIcon,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useHasRole } from '@/hooks/useHasRole'
import { Role } from '@/types/enums'
import { Button } from '@/components/ui/button'
import { ROLE_LABELS, NAV_LABELS } from '@/lib/labels'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const MAIN_NAV: NavItem[] = [
  { to: '/',           label: NAV_LABELS.overview,     icon: LayoutDashboard, end: true },
  { to: '/funnel',     label: NAV_LABELS.pipeline,     icon: Workflow },
  { to: '/customers',  label: NAV_LABELS.patients,     icon: Users },
  { to: '/commercial', label: NAV_LABELS.negotiations, icon: Handshake },
]

const ADMIN_NAV: NavItem[] = [
  { to: '/users',  label: NAV_LABELS.team,     icon: UserCog },
  { to: '/config', label: NAV_LABELS.settings, icon: Settings },
]

function NavItemLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
          isActive
            ? 'bg-muted font-medium text-foreground'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand" />
          )}
          <Icon className={`size-4 shrink-0 ${isActive ? 'text-brand' : ''}`} />
          {item.label}
        </>
      )}
    </NavLink>
  )
}

export default function AppLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = useHasRole(Role.ADM_SYSTEM)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <div className="flex h-screen bg-background">
      <aside className="flex w-60 flex-col border-r bg-sidebar">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex size-7 items-center justify-center rounded-md bg-brand text-brand-foreground text-sm font-bold">
            O
          </div>
          <span className="font-semibold tracking-tight">OdontoCore</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
          {MAIN_NAV.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}

          {isAdmin && (
            <>
              <p className="px-3 pt-4 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Administração
              </p>
              {ADMIN_NAV.map((item) => (
                <NavItemLink key={item.to} item={item} />
              ))}
            </>
          )}
        </nav>

        <div className="border-t p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
              {initials || '—'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.role ? ROLE_LABELS[user.role] : user?.username}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={handleLogout}>
            <LogOut className="size-3.5" />
            {NAV_LABELS.logout}
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
