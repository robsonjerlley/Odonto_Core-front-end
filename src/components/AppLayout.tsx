import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Workflow, Users, Handshake,
  UserCog, Settings, LogOut, LineChart, Moon, Sun, Stethoscope, type LucideIcon,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { can, analyticsScope } from '@/lib/permissions'
import type { Role } from '@/types/enums'
import { Button } from '@/components/ui/button'
import { ROLE_LABELS, NAV_LABELS } from '@/lib/labels'
import { useDarkMode } from '@/hooks/useDarkMode'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Visibilidade do item no menu para o papel logado. */
  show: (role: Role | undefined | null) => boolean
  end?: boolean
}

const MAIN_NAV: NavItem[] = [
  // Overview global: apenas papéis com analytics de escopo GLOBAL (ADM_SYSTEM).
  { to: '/',               label: NAV_LABELS.overview,     icon: LayoutDashboard, end: true, show: (r) => analyticsScope(r) === 'GLOBAL' },
  // Desempenho pessoal: papéis com analytics de escopo OWN (ex.: atendente).
  { to: '/meu-desempenho', label: NAV_LABELS.performance,  icon: LineChart,                  show: (r) => analyticsScope(r) === 'OWN' },
  { to: '/funnel',         label: NAV_LABELS.pipeline,     icon: Workflow,                   show: (r) => can(r, 'TICKET', 'READ') },
  { to: '/customers',      label: NAV_LABELS.patients,     icon: Users,                      show: (r) => can(r, 'CUSTOMER', 'READ') },
  { to: '/avaliacoes',     label: NAV_LABELS.evaluations,  icon: Stethoscope,                show: (r) => can(r, 'DEAL', 'CREATE') },
  { to: '/commercial',     label: NAV_LABELS.negotiations, icon: Handshake,                  show: (r) => can(r, 'DEAL', 'READ') },
]

const ADMIN_NAV: NavItem[] = [
  { to: '/users',  label: NAV_LABELS.team,     icon: UserCog,  show: (r) => can(r, 'USER', 'READ') },
  { to: '/config', label: NAV_LABELS.settings, icon: Settings, show: (r) => can(r, 'CONFIG', 'CONFIGURE') },
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
  const role = user?.role
  const { dark, toggle: toggleDark } = useDarkMode()

  const mainNav = MAIN_NAV.filter((item) => item.show(role))
  const adminNav = ADMIN_NAV.filter((item) => item.show(role))

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
          {mainNav.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}

          {adminNav.length > 0 && (
            <>
              <p className="px-3 pt-4 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Administração
              </p>
              {adminNav.map((item) => (
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
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleLogout}>
              <LogOut className="size-3.5" />
              {NAV_LABELS.logout}
            </Button>
            <Button variant="outline" size="icon" className="size-8 shrink-0" onClick={toggleDark} aria-label="Alternar tema">
              {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
