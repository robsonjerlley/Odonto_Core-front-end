import api from '@/lib/api'
import type { Sector, Role } from '@/types/enums'
import type { User, Page } from '@/types/models'

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

// Backend UserPasswordUpdateRequestDTO aceita apenas newPassword (api-spec v0)
export interface UpdatePasswordDTO {
    newPassword: string
}

export const usersService = {
    findAll: () =>
        api.get<Page<User>>('/api/v1/users').then((r) => r.data.content),

    findByUsername: (username: string) =>
        api.get<User>(`/api/v1/users/username/${username}`).then((r) => r.data),

    findBySector: (sector: Sector) =>
        api.get<Page<User>>('/api/v1/users', { params: { sector } }).then((r) => r.data.content),

    findBySectorAndRole: (sector: Sector, role: Role) =>
        api.get<Page<User>>('/api/v1/users', { params: { sector, role } }).then((r) => r.data.content),

    create: (data: CreateUserDTO) => {
        const payload: CreateUserPayload = {
            name: data.name,
            username: data.username,
            passwordHash: data.password,
            sector: data.sector,
            role: data.role,
        }
        return api.post<User>('/api/v1/users', payload).then((r) => r.data)
    },

    updatePassword: (username: string, data: UpdatePasswordDTO) =>
        api.patch(`/api/v1/users/${username}/newPassword`, data),

    remove: (id: string) =>
        api.delete(`/api/v1/users/${id}`),
}
 
