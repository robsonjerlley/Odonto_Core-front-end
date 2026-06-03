import { useState } from 'react'
import { useUsers, useRemoveUser } from './users.queries'
import { Sector, Role } from '@/types/enums'
import { SECTOR_LABELS, ROLE_LABELS } from '@/lib/labels'
import type { User } from '@/types/models'
import RoleGuard from '@/modules/auth/RoleGuard'
import CreateUserDialog from './CreateUserDialog'
import ChangePasswordDialog from './ChangePasswordDialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function UserListPage() {
  const { data: users = [], isLoading } = useUsers()
  const removeUser = useRemoveUser()

  const [sectorFilter, setSectorFilter] = useState<Sector | 'all'>('all')
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [passwordUser, setPasswordUser] = useState<User | null>(null)

  const filtered = users.filter((u) => {
    if (sectorFilter !== 'all' && u.sector !== sectorFilter) return false
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    return true
  })

  if (isLoading) return <p className="p-6">Carregando...</p>

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Usuários</h1>
        <RoleGuard allowed={[Role.ADM_SYSTEM]}>
          <Button onClick={() => setCreateOpen(true)}>Novo usuário</Button>
        </RoleGuard>
      </div>

      <div className="flex gap-3">
        <Select value={sectorFilter} onValueChange={(v) => setSectorFilter(v as Sector | 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Setor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os setores</SelectItem>
            {Object.values(Sector).map((s) => (
              <SelectItem key={s} value={s}>{SECTOR_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as Role | 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os roles</SelectItem>
            {Object.values(Role).map((r) => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Setor</TableHead>
            <TableHead>Role</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onDelete={(id) => removeUser.mutate(id)}
              onChangePassword={() => setPasswordUser(user)}
            />
          ))}
        </TableBody>
      </Table>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />

      {passwordUser && (
        <ChangePasswordDialog
          open={true}
          onOpenChange={(open) => { if (!open) setPasswordUser(null) }}
          username={passwordUser.username}
        />
      )}
    </div>
  )
}

interface UserRowProps {
  user: User
  onDelete: (id: string) => void
  onChangePassword: () => void
}

function UserRow({ user, onDelete, onChangePassword }: UserRowProps) {
  return (
    <TableRow>
      <TableCell>{user.name}</TableCell>
      <TableCell className="text-muted-foreground">{user.username}</TableCell>
      <TableCell><Badge variant="outline">{SECTOR_LABELS[user.sector]}</Badge></TableCell>
      <TableCell><Badge>{ROLE_LABELS[user.role]}</Badge></TableCell>
      <TableCell className="text-right space-x-2">
        <Button variant="outline" size="sm" onClick={onChangePassword}>
          Trocar senha
        </Button>
        <RoleGuard allowed={[Role.ADM_SYSTEM]}>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">Excluir</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir {user.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Essa ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(user.id)}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </RoleGuard>
      </TableCell>
    </TableRow>
  )
}
