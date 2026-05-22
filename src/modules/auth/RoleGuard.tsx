import type { ReactNode } from 'react'
import type { Role } from '@/types/enums'
import { useAuthStore } from '@/store/auth.store'


interface RoleGuardProps {
    allowed: Role[]
    children: ReactNode
    fallback?: ReactNode
}

export default function RoleGuard ({
    allowed, children, fallback = null }: RoleGuardProps) {
    const user = useAuthStore((state) => state.user)

    if(!user || !allowed.includes(user.role)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}