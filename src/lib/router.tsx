import { createBrowserRouter } from 'react-router-dom'
import LoginPage from '@/modules/auth/LoginPage'
import ProtectedRoute from '@/modules/auth/ProtectedRoute'
import RequirePermission from '@/modules/auth/RequirePermission'
import AppLayout from '@/components/AppLayout'
import UserListPage from '@/modules/identity/UserListPage'
import CustomerListPage from '@/modules/funnel/CustomerListPage'
import TicketKanbanPage from '@/modules/funnel/TicketKanbanPage'
import DealsPage from '@/modules/commercial/DealsPage'
import DashboardPage from '@/modules/analytics/DashboardPage'
import ConfigPage from '@/modules/config/ConfigPage'

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
            element: <RequirePermission resource="ANALYTICS" action="READ" />,
            children: [{ index: true, element: <DashboardPage /> }],
          },
          {
            element: <RequirePermission resource="TICKET" action="READ" />,
            children: [{ path: 'funnel', element: <TicketKanbanPage /> }],
          },
          {
            element: <RequirePermission resource="CUSTOMER" action="READ" />,
            children: [{ path: 'customers', element: <CustomerListPage /> }],
          },
          {
            element: <RequirePermission resource="DEAL" action="READ" />,
            children: [{ path: 'commercial', element: <DealsPage /> }],
          },
          {
            element: <RequirePermission resource="USER" action="READ" />,
            children: [{ path: 'users', element: <UserListPage /> }],
          },
          {
            element: <RequirePermission resource="CONFIG" action="CONFIGURE" />,
            children: [{ path: 'config', element: <ConfigPage /> }],
          },
        ],
      },
    ],
  },
])
