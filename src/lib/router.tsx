import { createBrowserRouter } from 'react-router-dom'
import LoginPage from '@/modules/auth/LoginPage'
import ProtectedRoute from '@/modules/auth/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import UserListPage from '@/modules/identity/UserListPage'
import CustomerListPage from '@/modules/funnel/CustomerListPage'
import TicketKanbanPage from '@/modules/funnel/TicketKanbanPage'
import DealsPage from '@/modules/commercial/DealsPage'
import DashboardPage from '@/modules/analytics/DashboardPage'

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
            element: <DashboardPage />,
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
          {
            path: 'commercial',
            element: <DealsPage />,
          },
        ],
      },
    ],
  },
])
