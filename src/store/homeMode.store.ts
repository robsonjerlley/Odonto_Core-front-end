import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Role } from '@/types/enums'

/**
 * Preferência de layout da home (ADR-Frontend-002 §3, revisão 2026-06-30).
 * Tri-estado reversível: AUTO deixa a heurística decidir; OPERATION/CARDS
 * sobrescrevem. Persistida por navegador (o endpoint por-usuário é [IMPACTO
 * BACKEND] ainda não disponível).
 */
export type HomeMode = 'AUTO' | 'OPERATION' | 'CARDS'

interface HomeModeState {
  mode: HomeMode
  setMode: (mode: HomeMode) => void
}

export const useHomeModeStore = create<HomeModeState>()(
  persist(
    (set) => ({
      mode: 'AUTO',
      setMode: (mode) => set({ mode }),
    }),
    { name: 'home-mode' },
  ),
)

/**
 * Resolve o modo efetivo. Em AUTO, a heurística escolhe "Modo Operação" para o
 * perfil solo / papel amplo — hoje o ADM_SYSTEM (dono-faz-tudo da clínica pequena),
 * que é também o único papel com acesso a agenda + financeiro no feed. Demais
 * papéis caem no grid de cards. O usuário pode sempre sobrescrever.
 */
export function resolveHomeMode(mode: HomeMode, role: Role | undefined | null): 'OPERATION' | 'CARDS' {
  if (mode !== 'AUTO') return mode
  return role === Role.ADM_SYSTEM ? 'OPERATION' : 'CARDS'
}
