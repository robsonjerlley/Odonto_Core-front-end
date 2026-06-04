import axios from 'axios'

export interface AuthResponse {
  token: string
  type: 'Bearer'
}

const baseURL = import.meta.env.VITE_API_URL ?? ''

/**
 * Cliente axios "cru" (sem o interceptor de `@/lib/api`) usado exclusivamente
 * para autenticação. Evita dependência circular com o interceptor — que importa
 * a store, que importa o api — e impede que um 401 do próprio refresh dispare
 * outra tentativa de refresh.
 */
const authClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

export const authService = {
  login: (username: string, password: string) =>
    authClient
      .post<AuthResponse>('/api/v1/authentication/login', { username, password })
      .then((r) => r.data),

  /**
   * Renova o token enviando o token atual (expirado ou ainda válido).
   * Endpoint público — ver §3 do contrato de integração.
   */
  refresh: (token: string) =>
    authClient
      .post<AuthResponse>('/api/v1/authentication/refresh', { token })
      .then((r) => r.data),
}
