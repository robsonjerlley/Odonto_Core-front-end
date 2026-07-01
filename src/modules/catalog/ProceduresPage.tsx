import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search } from 'lucide-react'
import { useProcedures, useCreateProcedure, useUpdateProcedure, useDeleteProcedure } from './procedure.queries'
import { procedureSchema, type ProcedureFormInput, type ProcedureFormData } from './procedure.schema'
import type { Procedure } from '@/types/models'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// ─── Formulário (criar / editar) ────────────────────────────────────────────────

interface ProcedureFormDialogProps {
  procedure: Procedure | null
  open: boolean
  onOpenChange: (v: boolean) => void
}

function ProcedureFormDialog({ procedure, open, onOpenChange }: ProcedureFormDialogProps) {
  const isEdit = !!procedure
  const create = useCreateProcedure()
  const update = useUpdateProcedure(procedure?.id ?? '')

  const form = useForm<ProcedureFormInput, unknown, ProcedureFormData>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
      name: procedure?.name ?? '',
      code: procedure?.code ?? '',
      defaultPrice: procedure?.defaultPrice,
      active: procedure?.active ?? true,
    },
  })

  async function onSubmit(data: ProcedureFormData) {
    try {
      if (isEdit) {
        await update.mutateAsync({
          name: data.name,
          code: data.code || undefined,
          defaultPrice: data.defaultPrice,
          active: data.active ?? true,
        })
      } else {
        await create.mutateAsync({
          name: data.name,
          code: data.code || undefined,
          defaultPrice: data.defaultPrice,
        })
      }
      onOpenChange(false)
    } catch {
      /* erro exibido via toast pelo interceptor; mantém o diálogo aberto */
    }
  }

  const pending = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar procedimento' : 'Novo procedimento'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Implante dentário" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Código (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="TUSS, CBP..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="defaultPrice" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor padrão (R$)</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      placeholder="0,00"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value as number | undefined}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {isEdit && (
              <FormField control={form.control} name="active" render={({ field }) => (
                <FormItem>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="size-4 accent-brand"
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    Ativo (disponível para novos orçamentos)
                  </label>
                </FormItem>
              )} />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={pending}>{pending ? 'Salvando...' : 'Salvar'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ProceduresPage() {
  const { data: procedures = [], isLoading } = useProcedures()
  const remove = useDeleteProcedure()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Procedure | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Procedure | null>(null)

  const filtered = procedures.filter((p) => {
    const q = search.toLowerCase()
    return p.name.toLowerCase().includes(q) || (p.code ?? '').toLowerCase().includes(q)
  })

  function openCreate() {
    setEditTarget(null)
    setFormOpen(true)
  }

  function openEdit(p: Procedure) {
    setEditTarget(p)
    setFormOpen(true)
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Procedimentos</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo usado na montagem dos orçamentos.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Novo procedimento
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Código</TableHead>
              <TableHead className="text-right">Valor padrão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum procedimento cadastrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id} className={p.active ? undefined : 'opacity-60'}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{p.code || '—'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.defaultPrice)}</TableCell>
                  <TableCell>
                    <Badge variant={p.active ? 'outline' : 'secondary'}>
                      {p.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Editar</Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(p)}
                    >
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <ProcedureFormDialog
        procedure={editTarget}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir procedimento?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> será desativado no catálogo. Orçamentos já
              criados que o referenciam continuam válidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) remove.mutate(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
