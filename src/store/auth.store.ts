import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/models'
import { queryClient } from '@/lib/queryClient'

interface AuthState {
    user: User | null
    token: string | null
    login: (user: User | null, token: string) => void
    logout: () => void
    isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) =>({
            user: null,
            token: null,
        
            login: (user, token) => {
                set({ user, token })
            },

            logout: () => {
                set({ user: null, token: null })
                queryClient.clear()
            },

            isAuthenticated: () => get().token !== null,
        }), 
        {name: 'auth'},   
    ),
)