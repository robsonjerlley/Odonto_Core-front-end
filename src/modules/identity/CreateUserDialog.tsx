import { useForm, type DefaultValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sector, Role } from '@/types/enums'
import { useCreateUser } from './users.queries'
import { createUserSchema, type CreateUserFormData } from './create-user.schema'
import { SECTOR_LABELS, ROLE_LABELS } from '@/lib/labels'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFAULT_VALUES: DefaultValues<CreateUserFormData> = {
  name: '',
  username: '',
  password: '',
  sector: undefined,
  role: undefined,
}

export default function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const createUser = useCreateUser()

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: DEFAULT_VALUES,
  })

  function handleOpenChange(value: boolean) {
    if (!value) form.reset(DEFAULT_VALUES)
    onOpenChange(value)
  }

  async function onSubmit(data: CreateUserFormData) {
    try {
      await createUser.mutateAsync(data)
      form.reset(DEFAULT_VALUES)
      onOpenChange(false)
    } catch {
      // erro tratado pelo estado isError da mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl><Input placeholder="Nome completo" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="username" render={({ field }) => (
              <FormItem>
                <FormLabel>Usuário</FormLabel>
                <FormControl><Input placeholder="nome.sobrenome" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 gap-3">
              <FormField control={form.control} name="sector" render={({ field }) => (
                <FormItem>
                  <FormLabel>Setor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(Sector).map((s) => (
                        <SelectItem key={s} value={s}>{SECTOR_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(Role).map((r) => (
                        <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {createUser.isError && (
              <p className="text-sm text-destructive">
                Erro ao criar usuário. O nome de usuário pode já estar em uso.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? 'Criando...' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
