import { createBrowserRouter } from 'react-router-dom'
import LoginPage from '@/modules/auth/LoginPage'
import ProtectedRoute from '@/modules/auth/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import UserListPage from '@/modules/identity/UserListPage'
import CustomerListPage from '@/modules/funnel/CustomerListPage'
import TicketKanbanPage from '@/modules/funnel/TicketKanbanPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <div className="p-6">Dashboard — em breve</div>,
          },
          {
            path: 'users',
            element: <UserListPage />,
          },
          {
            path: 'customers',
            element: <CustomerListPage />,
          },
          {
            path: 'funnel',
            element: <TicketKanbanPage />,
          },
        ],
      },
    ],
  },
])
