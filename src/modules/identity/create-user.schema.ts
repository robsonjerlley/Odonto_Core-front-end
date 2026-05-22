import { z } from 'zod'
import {Sector, Role } from '@/types/enums'


export const createUserSchema = z.object({
    name: z.string().min(2, 'Nome é obrigatório'),
    username: z.string().min(3, 'Mínimo de 3 caracteres'),
    password: z.string().min(8, 'Mínimo de 8 caracteres'),
    sector: z.enum(Object.values(Sector) as [Sector, ...Sector[]]),
    role: z.enum(Object.values(Role) as [Role, ...Role[]])
})

export type CreateUserFormData = z.infer<typeof createUserSchema>