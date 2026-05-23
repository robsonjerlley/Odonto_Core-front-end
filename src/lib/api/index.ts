import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'
import { router } from '@/lib/router'

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
    if (error.response?.status === 401 && !isLoginEndpoint) {
      useAuthStore.getState().logout()
      router.navigate('/login')
    }
    return Promise.reject(error)
  },
)

export default api