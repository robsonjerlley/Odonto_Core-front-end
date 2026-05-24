import api from '@/lib/api'
import { Sector } from '@/types/enums'
import type { Role } from '@/types/enums'
import type { User } from '@/types/models'


export interface CreateUserDTO {
    name: string
    username: string
    password: string
    sector: Sector
    role: Role
}

interface CreateUserPayload {
    name: string
    username: string
    passwordHash: string
    sector: Sector
    role: Role
}


export interface UpdatePasswordDTO {
    username: string
    oldPassword: string
    newPasswordHash: string
}

export const usersService = {
    findAll: async (): Promise<User[]> => {
        const results = await Promise.all(
            Object.values(Sector).map((s) =>
                api.get<User[]>(`/api/v1/users/findBySector/${s}`).then((r) => r.data)
            )
        )
        const map = new Map<string, User>()
        results.flat().forEach((u) => map.set(u.id, u))
        return Array.from(map.values())
    },

    findBySector: (sector: Sector) =>
        api.get<User[]>(`/api/v1/users/findBySector/${sector}`).then((r) => r.data),


    findBySectorAndRole: (sector: Sector, role: Role) =>
        api.get<User[]>(`/api/v1/users/findBySectorAndRole/${sector}/${role}`).then((r) => r.data),


    create: (data: CreateUserDTO) => {
        const payload: CreateUserPayload = {
            name: data.name,
            username: data.username,
            passwordHash: data.password,
            sector: data.sector,
            role: data.role,
        }
        return api.post<User>(`/api/v1/users/create`, payload).then((r) => r.data)
    },

    updatePassword: (username: string, data: UpdatePasswordDTO) => 
        api.patch(`/api/v1/users/updatePassword/${username}/passwordHash`, data),

    remove: (id: string) =>
        api.delete(`/api/v1/users/${id}`),


}
 
