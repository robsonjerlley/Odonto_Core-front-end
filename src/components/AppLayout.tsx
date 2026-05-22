import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'

const navItems = [
  { to: '/',       label: 'Dashboard' },
  { to: '/users',  label: 'Usuários'  },
]

export default function AppLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen">
      <aside className="w-56 border-r flex flex-col">
        <div className="p-4 border-b font-semibold">OdontoCore</div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t space-y-1">
          <p className="text-xs text-muted-foreground truncate">{user?.username}</p>
          <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
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
