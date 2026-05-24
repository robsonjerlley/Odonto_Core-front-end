import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'
import { router } from '@/lib/router'
import { toast } from '@/components/Toaster'

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/authentication/login')
    const status = error.response?.status
    if (status === 401 && !isLoginEndpoint) {
      const currentToken = useAuthStore.getState().token
      const requestToken = (error.config?.headers?.Authorization as string | undefined)
        ?.replace('Bearer ', '')
      // Only logout if the request used the current token (not a stale one from before re-login)
      if (!requestToken || requestToken === currentToken) {
        useAuthStore.getState().logout()
        router.navigate('/login')
      }
    } else if (!isLoginEndpoint && ((typeof status === 'number' && status >= 400) || error.code === 'ERR_NETWORK')) {
      const data = error.response?.data
      const message =
        (typeof data === 'string' && data) ||
        data?.message ||
        data?.error ||
        error.message ||
        'Ocorreu um erro inesperado.'
      toast(message, 'error')
    }
    return Promise.reject(error)
  },
)

export default api