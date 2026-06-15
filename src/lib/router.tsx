import { createBrowserRouter } from 'react-router-dom'
import LoginPage from '@/modules/auth/LoginPage'
import ProtectedRoute from '@/modules/auth/ProtectedRoute'
import RequireRoute from '@/modules/auth/RequireRoute'
import AppLayout from '@/components/AppLayout'
import HomePage from '@/modules/home/HomePage'
import UserListPage from '@/modules/identity/UserListPage'
import CustomerListPage from '@/modules/funnel/CustomerListPage'
import TicketKanbanPage from '@/modules/funnel/TicketKanbanPage'
import EvaluationsPage from '@/modules/evaluations/EvaluationsPage'
import DealsPage from '@/modules/commercial/DealsPage'
import DashboardPage from '@/modules/analytics/DashboardPage'
import SectorAnalyticsPage from '@/modules/analytics/SectorAnalyticsPage'
import MyPerformancePage from '@/modules/analytics/MyPerformancePage'
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
            element: <RequireRoute path="/" />,
            children: [{ index: true, element: <HomePage /> }],
          },
          {
            element: <RequireRoute path="/analytics" />,
            children: [{ path: 'analytics', element: <DashboardPage /> }],
          },
          {
            element: <RequireRoute path="/analytics-setor" />,
            children: [{ path: 'analytics-setor', element: <SectorAnalyticsPage /> }],
          },
          {
            element: <RequireRoute path="/meu-desempenho" />,
            children: [{ path: 'meu-desempenho', element: <MyPerformancePage /> }],
          },
          {
            element: <RequireRoute path="/funnel" />,
            children: [{ path: 'funnel', element: <TicketKanbanPage /> }],
          },
          {
            element: <RequireRoute path="/customers" />,
            children: [{ path: 'customers', element: <CustomerListPage /> }],
          },
          {
            element: <RequireRoute path="/avaliacoes" />,
            children: [{ path: 'avaliacoes', element: <EvaluationsPage /> }],
          },
          {
            element: <RequireRoute path="/commercial" />,
            children: [{ path: 'commercial', element: <DealsPage /> }],
          },
          {
            element: <RequireRoute path="/users" />,
            children: [{ path: 'users', element: <UserListPage /> }],
          },
          {
            element: <RequireRoute path="/config" />,
            children: [{ path: 'config', element: <ConfigPage /> }],
          },
        ],
      },
    ],
  },
])
