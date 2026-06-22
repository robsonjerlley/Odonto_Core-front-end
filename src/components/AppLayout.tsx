import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Home, LayoutDashboard, PieChart, Workflow, Users, Handshake,
  UserCog, Settings, LogOut, LineChart, Moon, Sun, Stethoscope, type LucideIcon,
} from 'lucide-react'
import { MolarIcon } from '@/components/icons/MolarIcon'
import { useAuthStore } from '@/store/auth.store'
import { canAccessRoute, analyticsScope } from '@/lib/permissions'
import type { Role } from '@/types/enums'
import { Button } from '@/components/ui/button'
import { ROLE_LABELS, NAV_LABELS } from '@/lib/labels'
import { useDarkMode } from '@/hooks/useDarkMode'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  show: (role: Role | undefined | null) => boolean
  end?: boolean
  /** Classe de texto para o ícone quando ativo (ex: "text-sky-600 dark:text-sky-400"). */
  textAccent: string
  /** Classe de fundo para o indicador lateral quando ativo (ex: "bg-sky-600"). */
  bgAccent: string
}

const MAIN_NAV: NavItem[] = [
  { to: '/',               label: NAV_LABELS.home,           icon: Home,           end: true, show: (r) => canAccessRoute(r, '/'),               textAccent: 'text-teal-700 dark:text-teal-400',    bgAccent: 'bg-teal-600' },
  { to: '/analytics',      label: NAV_LABELS.analytics,      icon: LayoutDashboard,            show: (r) => canAccessRoute(r, '/analytics'),       textAccent: 'text-teal-700 dark:text-teal-400',    bgAccent: 'bg-teal-600' },
  { to: '/analytics-setor',label: NAV_LABELS.sectorAnalytics,icon: PieChart,                   show: (r) => analyticsScope(r) === 'SECTOR',        textAccent: 'text-teal-700 dark:text-teal-400',    bgAccent: 'bg-teal-600' },
  { to: '/meu-desempenho', label: NAV_LABELS.performance,    icon: LineChart,                   show: (r) => analyticsScope(r) === 'OWN',           textAccent: 'text-amber-600 dark:text-amber-400',  bgAccent: 'bg-amber-500' },
  { to: '/funnel',         label: NAV_LABELS.pipeline,       icon: Workflow,                    show: (r) => canAccessRoute(r, '/funnel'),          textAccent: 'text-blue-700 dark:text-blue-400',    bgAccent: 'bg-blue-600' },
  { to: '/customers',      label: NAV_LABELS.patients,       icon: Users,                       show: (r) => canAccessRoute(r, '/customers'),       textAccent: 'text-violet-600 dark:text-violet-400',bgAccent: 'bg-violet-600' },
  { to: '/avaliacoes',     label: NAV_LABELS.evaluations,    icon: Stethoscope,                 show: (r) => canAccessRoute(r, '/avaliacoes'),      textAccent: 'text-orange-700 dark:text-orange-400',bgAccent: 'bg-orange-500' },
  { to: '/commercial',     label: NAV_LABELS.negotiations,   icon: Handshake,                   show: (r) => canAccessRoute(r, '/commercial'),      textAccent: 'text-emerald-600 dark:text-emerald-400', bgAccent: 'bg-emerald-600' },
]

const ADMIN_NAV: NavItem[] = [
  { to: '/users',  label: NAV_LABELS.team,     icon: UserCog,  show: (r) => canAccessRoute(r, '/users'),  textAccent: 'text-slate-600 dark:text-slate-400',  bgAccent: 'bg-slate-500' },
  { to: '/config', label: NAV_LABELS.settings, icon: Settings, show: (r) => canAccessRoute(r, '/config'), textAccent: 'text-indigo-600 dark:text-indigo-400', bgAccent: 'bg-indigo-600' },
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
            <span className={`absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full ${item.bgAccent}`} />
          )}
          <Icon className={`size-4 shrink-0 ${isActive ? item.textAccent : ''}`} />
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
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand/10">
            <MolarIcon size={22} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold tracking-tight leading-tight">OdontoCore</p>
            <p className="text-[10px] leading-tight text-muted-foreground">by SertãoBit</p>
          </div>
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
