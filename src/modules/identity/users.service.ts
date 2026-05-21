import api from '@/lib/api'
import type { Sector, Role } from '@/types/enums'
import type { User } from '@/types/models'


export interface CreateUserDTO {
    name: string
    username: string
    password: string
    sector: Sector
    role: Role
}


export interface UpdatePasswordDTO {
    passwordHash: string
}

export const usersService = {
    findAll: () => 
        api.get<User[]>(`/api/v1/users`).then((r) => r.data),


    findBySector: (sector: Sector) =>
        api.get<User[]>(`/api/v1/users/findBySector/${sector}`).then((r) => r.data),


    findBySectorAndRole: (sector: Sector, role: Role) =>
        api.get<User[]>(`/api/v1/users/findBySectorAndRole/${sector}/${role}`).then((r) => r.data),


    create: (data: CreateUserDTO) =>
        api.post<User>(`/api/v1/users/create`, data).then((r) => r.data),

    updatePassword: (username: string, data: UpdatePasswordDTO) => 
        api.patch(`/api/v1/users/updatePassword/${username}/passwordHash`, data),

    remove: (id: string) =>
        api.delete(`/api/v1/users/${id}`),


}
 
