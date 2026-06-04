import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth.store'
import { router } from '@/lib/router'
import { toast } from '@/lib/toast'
import { authService } from '@/modules/auth/auth.service'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// ─── Refresh de token (§3 do contrato) ──────────────────────────────────────
// Um único refresh em voo é compartilhado entre todas as requisições que
// receberem 401 simultaneamente, evitando uma tempestade de chamadas ao backend.
let refreshPromise: Promise<string> | null = null

function runRefresh(currentToken: string): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = authService
      .refresh(currentToken)
      .then((res) => {
        useAuthStore.getState().setToken(res.token)
        return res.token
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

function forceLogout() {
  useAuthStore.getState().logout()
  router.navigate('/login')
}

function notifyError(error: unknown) {
  if (!axios.isAxiosError(error)) return
  const data = error.response?.data as { message?: string; error?: string } | string | undefined
  const message =
    (typeof data === 'string' && data) ||
    (typeof data === 'object' && (data?.message || data?.error)) ||
    error.message ||
    'Ocorreu um erro inesperado.'
  toast(message, 'error')
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error)

    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
    const status = error.response?.status
    const url = original?.url ?? ''
    const isAuthEndpoint = url.includes('/authentication/')

    // 401 fora dos endpoints de auth → tenta renovar o token uma única vez e
    // refaz a requisição original. Se o refresh falhar, encerra a sessão.
    if (status === 401 && !isAuthEndpoint && original && !original._retried) {
      const currentToken = useAuthStore.getState().token
      if (!currentToken) {
        forceLogout()
        return Promise.reject(error)
      }
      try {
        const newToken = await runRefresh(currentToken)
        original._retried = true
        original.headers.set('Authorization', `Bearer ${newToken}`)
        return api(original)
      } catch {
        forceLogout()
        return Promise.reject(error)
      }
    }

    // Erros de auth (login/refresh) não disparam toast genérico — a tela de
    // login trata a mensagem; demais erros 4xx/5xx e falha de rede notificam.
    if (!isAuthEndpoint && ((typeof status === 'number' && status >= 400) || error.code === 'ERR_NETWORK')) {
      notifyError(error)
    }

    return Promise.reject(error)
  },
)

export default api
