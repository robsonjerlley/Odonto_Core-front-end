import type { ReactNode } from 'react'
import { usePermission } from '@/hooks/usePermission'
import type { Resource, Action } from '@/lib/permissions'

interface CanProps {
  resource: Resource
  action: Action
  children: ReactNode
  fallback?: ReactNode
}

/** Renderiza `children` apenas se o usuário tiver a permissão informada. */
export default function Can({ resource, action, children, fallback = null }: CanProps) {
  const allowed = usePermission(resource, action)
  return <>{allowed ? children : fallback}</>
}
