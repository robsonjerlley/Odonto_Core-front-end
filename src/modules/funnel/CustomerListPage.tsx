import { useState } from 'react'
import { useCustomers, useRemoveCustomer } from './funnel.queries'
import { Plus, Search, ChevronLeft } from 'lucide-react'
import CreateCustomerDialog from './CreateCustomerDialog'
import CustomerDetailPanel from './CustomerDetailPanel'
import type { Customer } from '@/types/models'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { usePermission } from '@/hooks/usePermission'

function formatCpf(cpf?: string) {
  if (!cpf) return '—'
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export default function CustomerListPage() {
  const { data: customers = [], isLoading } = useCustomers()
  const removeCustomer = useRemoveCustomer()
  const canCreate = usePermission('CUSTOMER', 'CREATE')
  const canDelete = usePermission('CUSTOMER', 'DELETE')

  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || (c.cpf ?? '').includes(search)
  })

  // `selected` cai para null automaticamente se o id não existir mais na lista.
  const selected = customers.find((c) => c.id === selectedId) ?? null

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pacientes</h1>
          <p className="text-sm text-muted-foreground">Cadastro, busca e histórico de contatos.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Novo paciente
          </Button>
        )}
      </div>

      <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-[300px_1fr]">
        {/* ── Lista ── */}
        <div className={cn('flex min-h-0 flex-col', selected && 'hidden md:flex')}>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto rounded-lg border p-1">
            {isLoading ? (
              <p className="p-3 text-sm text-muted-foreground">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">Nenhum paciente encontrado</p>
            ) : (
              filtered.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => setSelectedId(customer.id)}
                  className={cn(
                    'flex w-full flex-col items-start rounded-md px-3 py-2 text-left transition-colors',
                    customer.id === selectedId ? 'bg-muted' : 'hover:bg-muted/60',
                    customer.anonymized && 'opacity-60',
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {customer.name}
                    {customer.anonymized && (
                      <Badge variant="outline" className="text-[10px] font-normal">Anonimizado</Badge>
                    )}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{formatCpf(customer.cpf)}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Detalhe ── */}
        <div className={cn('min-h-0 overflow-y-auto rounded-lg border p-5', !selected && 'hidden md:block')}>
          {selected ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setSelectedId(null)}
                >
                  <ChevronLeft className="size-4" /> Voltar
                </Button>
                {canDelete && !selected.anonymized && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(selected)}
                  >
                    Anonimizar
                  </Button>
                )}
              </div>
              <CustomerDetailPanel customer={selected} />
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
              Selecione um paciente para ver os dados e o histórico de contatos.
            </div>
          )}
        </div>
      </div>

      {canCreate && <CreateCustomerDialog open={dialogOpen} onOpenChange={setDialogOpen} />}

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anonimizar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Em conformidade com a LGPD, os dados pessoais de{' '}
              <strong>{deleteTarget?.name}</strong> (nome, CPF, telefone, e-mail) serão removidos
              permanentemente. O histórico de tickets, orçamentos e métricas é preservado. Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) removeCustomer.mutate(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              Anonimizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
