import { Role } from '@/types/enums'

/**
 * Matriz de permissões — espelho exato das regras de autorização do backend
 * (`AccessRule` / `PermissionService`).
 *
 * O frontend só decide se o **papel** tem a capacidade (resource + action) em
 * algum escopo. O escopo real (OWN / SECTOR / GLOBAL) continua sendo aplicado
 * pelo backend — aqui só escondemos o que o papel categoricamente não pode fazer.
 */

export type Resource =
  | 'USER'
  | 'CUSTOMER'
  | 'TICKET'
  | 'CONTACT_LOG'
  | 'DEAL'
  | 'ANALYTICS'
  | 'CONFIG'

export type Action =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'CLOSE'
  | 'RECYCLE'
  | 'CONFIGURE'

export type Permission = `${Resource}:${Action}`

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [Role.ADM_SYSTEM]: [
    'USER:CREATE', 'USER:READ', 'USER:UPDATE', 'USER:DELETE',
    'CUSTOMER:CREATE', 'CUSTOMER:READ', 'CUSTOMER:UPDATE', 'CUSTOMER:DELETE',
    'TICKET:CREATE', 'TICKET:READ', 'TICKET:UPDATE', 'TICKET:RECYCLE',
    'CONTACT_LOG:CREATE', 'CONTACT_LOG:READ',
    'DEAL:CREATE', 'DEAL:READ', 'DEAL:UPDATE', 'DEAL:CLOSE',
    'ANALYTICS:READ',
    'CONFIG:CONFIGURE',
  ],

  [Role.ADM_LEADS]: [
    'CUSTOMER:CREATE', 'CUSTOMER:READ', 'CUSTOMER:UPDATE',
    'TICKET:CREATE', 'TICKET:READ', 'TICKET:UPDATE',
    'CONTACT_LOG:CREATE', 'CONTACT_LOG:READ',
  ],

  [Role.USER_LEADS]: [
    'CUSTOMER:CREATE', 'CUSTOMER:READ', 'CUSTOMER:UPDATE',
    'TICKET:CREATE', 'TICKET:READ', 'TICKET:UPDATE',
    'CONTACT_LOG:CREATE', 'CONTACT_LOG:READ',
  ],

  [Role.USER_ATTENDANT]: [
    'CUSTOMER:CREATE', 'CUSTOMER:READ', 'CUSTOMER:UPDATE',
    'TICKET:READ', 'TICKET:UPDATE',
    'CONTACT_LOG:CREATE', 'CONTACT_LOG:READ',
    // ANALYTICS:READ do atendente é escopo OWN (só métricas pessoais). O único
    // dashboard existente é o GLOBAL (ADM_SYSTEM). Sem tela de métricas pessoais,
    // o atendente não acessa o Overview — evita 403. Reabilitar quando houver
    // uma view de performance individual.
  ],

  [Role.ADM_EVALUATOR]: [
    'DEAL:CREATE', 'DEAL:READ', 'DEAL:UPDATE',
    'TICKET:READ', 'TICKET:UPDATE',
    'CONTACT_LOG:READ',
  ],

  [Role.USER_EVALUATOR]: [
    'DEAL:CREATE', 'DEAL:READ', 'DEAL:UPDATE',
    'TICKET:READ', 'TICKET:UPDATE',
    'CONTACT_LOG:READ',
  ],

  [Role.ADM_COMMERCIAL]: [
    'DEAL:READ', 'DEAL:UPDATE', 'DEAL:CLOSE',
    'TICKET:READ', 'TICKET:UPDATE', 'TICKET:CLOSE',
    'CONTACT_LOG:READ',
  ],

  [Role.USER_COMMERCIAL]: [
    'DEAL:READ', 'DEAL:UPDATE', 'DEAL:CLOSE',
    'TICKET:READ', 'TICKET:UPDATE', 'TICKET:CLOSE',
    'CONTACT_LOG:READ',
  ],
}

/** Verifica se o papel pode executar a ação sobre o recurso (em algum escopo). */
export function can(
  role: Role | undefined | null,
  resource: Resource,
  action: Action,
): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(`${resource}:${action}`) ?? false
}

/**
 * Permissão exigida por cada rota protegida da aplicação.
 * Usada tanto pela guarda de rota quanto pela navegação lateral.
 */
export const ROUTE_PERMISSION = {
  '/':           { resource: 'ANALYTICS', action: 'READ' },
  '/funnel':     { resource: 'TICKET',    action: 'READ' },
  '/customers':  { resource: 'CUSTOMER',  action: 'READ' },
  '/commercial': { resource: 'DEAL',      action: 'READ' },
  '/users':      { resource: 'USER',      action: 'READ' },
  '/config':     { resource: 'CONFIG',    action: 'CONFIGURE' },
} as const satisfies Record<string, { resource: Resource; action: Action }>

/** Ordem de preferência ao escolher a primeira rota acessível de um papel. */
const ROUTE_ORDER: Array<keyof typeof ROUTE_PERMISSION> = [
  '/', '/funnel', '/customers', '/commercial', '/users', '/config',
]

/** Primeira rota que o papel consegue acessar — fallback de redirecionamento. */
export function firstAccessibleRoute(role: Role | undefined | null): string {
  for (const route of ROUTE_ORDER) {
    const { resource, action } = ROUTE_PERMISSION[route]
    if (can(role, resource, action)) return route
  }
  return '/login'
}
