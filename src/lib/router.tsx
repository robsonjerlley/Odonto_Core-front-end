import LoginPage from "@/modules/auth/LoginPage";
import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from '@/modules/auth/ProtectedRoute'



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
                index: true,
                element: <div>Dashborad - em breve</div>,
            },
        ],
    },

])