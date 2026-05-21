import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { usersService, type CreateUserDTO, type UpdatePasswordDTO } from "./users.service"
import type { Sector, Role } from '@/types/enums'




const USERS_KEY = 'users'

export function useUsers() {
    return useQuery({
        queryKey: [USERS_KEY],
        queryFn: usersService.findAll,
    })
}


export function useUsersBySector(sector: Sector | null) {
    return useQuery({
        queryKey: [USERS_KEY, 'sector', sector],
        queryFn: () => usersService.findBySector(sector!),
        enabled: sector !== null,
    })
}


export function useUsersBySectorAndRole(sector: Sector | null, role: Role | null) {
    return useQuery({
        queryKey: [USERS_KEY, 'sector', sector, 'role', role],
        queryFn: () => usersService.findBySectorAndRole(sector!, role!),
        enabled: sector !== null && role !== null,
    })
}


export function useCreateUser() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateUserDTO) => usersService.create(data),
        onSuccess: () =>queryClient.invalidateQueries({ queryKey: [USERS_KEY] }),
    })
}


export function useUpdatePassword() {
    return useMutation({
        mutationFn: ({ username, data }: {username: string; data: UpdatePasswordDTO }) => 
            usersService.updatePassword(username, data),
    })
}


export function useRemoveUser() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => usersService.remove(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [USERS_KEY] }),
    })
}

