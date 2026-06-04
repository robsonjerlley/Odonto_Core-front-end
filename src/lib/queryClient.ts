import { QueryClient } from '@tanstack/react-query'
import axios from 'axios'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 2 minutos — elimina refetch desnecessário ao navegar entre telas
      staleTime: 2 * 60 * 1000,
      // Não refetch ao focar a janela — evita explosão de requests em background
      refetchOnWindowFocus: false,
      // Erros 4xx são definitivos (acesso negado, não encontrado) — não retentar.
      // Erros de rede/5xx: até 2 tentativas extras.
      retry: (failureCount, error) => {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          if (status && status >= 400 && status < 500) return false
        }
        return failureCount < 2
      },
    },
  },
})
