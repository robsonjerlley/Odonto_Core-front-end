import { useAuthStore } from "@/store/auth.store";
import { Navigate, Outlet } from 'react-router-dom' 


export default function ProtectedRoute() {
    const isAuthenticated = useAuthStore ((state) => state.isAuthenticated)

    if(!isAuthenticated()) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />

}