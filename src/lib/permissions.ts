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
    // ANALYTICS:READ do atendente é escopo OWN (só métricas pessoais). O Overview
    // global continua restrito ao ADM_SYSTEM; o atendente acessa a view pessoal
    // `/meu-desempenho` (ver ANALYTICS_SCOPE e canAccessRoute).
    'ANALYTICS:READ',
  ],

  [Role.ADM_EVALUATOR]: [
    'CUSTOMER:READ',
    'DEAL:CREATE', 'DEAL:READ', 'DEAL:UPDATE',
    'TICKET:READ', 'TICKET:UPDATE',
    'CONTACT_LOG:READ',
  ],

  [Role.USER_EVALUATOR]: [
    'CUSTOMER:READ',
    'DEAL:CREATE', 'DEAL:READ', 'DEAL:UPDATE',
    'TICKET:READ', 'TICKET:UPDATE',
    'CONTACT_LOG:READ',
  ],

  [Role.ADM_COMMERCIAL]: [
    'DEAL:READ', 'DEAL:UPDATE', 'DEAL:CLOSE',
    'TICKET:READ', 'TICKET:UPDATE', 'TICKET:CLOSE',
    'CUSTOMER:READ',
    'CONTACT_LOG:READ',
  ],

  [Role.USER_COMMERCIAL]: [
    'DEAL:READ', 'DEAL:UPDATE', 'DEAL:CLOSE',
    'TICKET:READ', 'TICKET:UPDATE', 'TICKET:CLOSE',
    'CUSTOMER:READ',
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
 * Escopo de ANALYTICS por papel — espelha o `PermissionScope` do backend.
 * GLOBAL = vê o dashboard consolidado de toda a clínica (apenas ADM_SYSTEM).
 * OWN    = vê apenas as próprias métricas (USER_ATTENDANT).
 * Papéis ausentes do mapa não têm acesso a analytics.
 */
export type AnalyticsScope = 'GLOBAL' | 'OWN'

const ANALYTICS_SCOPE: Partial<Record<Role, AnalyticsScope>> = {
  [Role.ADM_SYSTEM]: 'GLOBAL',
  [Role.USER_ATTENDANT]: 'OWN',
}

/** Escopo de analytics do papel, ou `null` se não acessa nenhum analytics. */
export function analyticsScope(role: Role | undefined | null): AnalyticsScope | null {
  if (!role) return null
  return ANALYTICS_SCOPE[role] ?? null
}

/**
 * Permissão (resource:action) exigida pelas rotas baseadas em capacidade.
 * As rotas de analytics (`/` e `/meu-desempenho`) dependem de escopo e são
 * resolvidas à parte em `canAccessRoute`.
 */
export const ROUTE_PERMISSION = {
  '/analytics':   { resource: 'ANALYTICS', action: 'READ' },
  '/funnel':      { resource: 'TICKET',    action: 'READ' },
  '/customers':   { resource: 'CUSTOMER',  action: 'READ' },
  '/avaliacoes':  { resource: 'DEAL',      action: 'CREATE' },
  '/commercial':  { resource: 'DEAL',      action: 'READ' },
  '/users':       { resource: 'USER',      action: 'READ' },
  '/config':      { resource: 'CONFIG',    action: 'CONFIGURE' },
} as const satisfies Record<string, { resource: Resource; action: Action }>

export type AppRoute = '/' | '/meu-desempenho' | keyof typeof ROUTE_PERMISSION

/**
 * Restrição adicional por papel para rotas cuja capacidade (resource:action) é
 * ampla demais para servir de controle de tela. Muitos papéis têm `TICKET:READ`
 * e `DEAL:READ` para ler tickets/deals **dentro da própria tela** (avaliação lê
 * tickets na tela de Avaliações; comercial lê deals na de Negociações), mas isso
 * **não** deve liberar o Pipeline nem a tela de Negociações para fora do setor.
 * Quando a rota aparece aqui, além da capacidade o papel precisa estar na lista.
 */
const ROUTE_ROLES: Partial<Record<keyof typeof ROUTE_PERMISSION, readonly Role[]>> = {
  '/funnel':     [Role.ADM_SYSTEM, Role.ADM_LEADS, Role.USER_LEADS, Role.USER_ATTENDANT],
  '/commercial': [Role.ADM_SYSTEM, Role.ADM_COMMERCIAL, Role.USER_COMMERCIAL],
}

/** Pode o papel acessar a rota? Cobre as rotas de capacidade e as de analytics. */
export function canAccessRoute(role: Role | undefined | null, route: AppRoute): boolean {
  if (route === '/') return !!role                                      // home: qualquer autenticado
  if (route === '/analytics') return analyticsScope(role) === 'GLOBAL'  // dashboard global só GLOBAL
  if (route === '/meu-desempenho') return analyticsScope(role) != null  // métricas próprias
  const { resource, action } = ROUTE_PERMISSION[route]
  if (!can(role, resource, action)) return false
  const allowed = ROUTE_ROLES[route]
  return !allowed || (!!role && allowed.includes(role))
}

/** Ordem de preferência ao escolher a primeira rota acessível de um papel. */
const ROUTE_ORDER: AppRoute[] = ['/']

/** Primeira rota que o papel consegue acessar — fallback de redirecionamento. */
export function firstAccessibleRoute(role: Role | undefined | null): string {
  for (const route of ROUTE_ORDER) {
    if (canAccessRoute(role, route)) return route
  }
  return '/login'
}
