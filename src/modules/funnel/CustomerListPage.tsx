import { useState } from 'react'
import { useCustomers, useRemoveCustomer } from './funnel.queries'
import { Plus, Search } from 'lucide-react'
import CreateCustomerDialog from './CreateCustomerDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { CUSTOMER_SOURCE_LABELS } from '@/lib/labels'
import { usePermission } from '@/hooks/usePermission'

export default function CustomerListPage() {
  const { data: customers = [], isLoading } = useCustomers()
  const removeCustomer = useRemoveCustomer()
  const canCreate = usePermission('CUSTOMER', 'CREATE')
  const canDelete = usePermission('CUSTOMER', 'DELETE')

  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || (c.cpf ?? '').includes(search)
  })

  function formatCpf(cpf?: string) {
    if (!cpf) return '—'
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  function formatPhone(phone?: string) {
    if (!phone || phone === 'NULL') return '—'
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pacientes</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro e busca de pacientes da clínica.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Novo paciente
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou CPF..."
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
              <TableHead>CPF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum cliente encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((customer) => (
                <TableRow key={customer.id} className={customer.anonymized ? 'opacity-60' : undefined}>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-2">
                      {customer.name}
                      {customer.anonymized && (
                        <Badge variant="outline" className="text-[10px] font-normal">Anonimizado</Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{formatCpf(customer.cpf)}</TableCell>
                  <TableCell>{formatPhone(customer.phone)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{CUSTOMER_SOURCE_LABELS[customer.source]}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canDelete && !customer.anonymized && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            Anonimizar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Anonimizar cliente?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Em conformidade com a LGPD, os dados pessoais de{' '}
                              <strong>{customer.name}</strong> (nome, CPF, telefone, e-mail) serão
                              removidos permanentemente. O histórico de tickets, orçamentos e métricas
                              é preservado. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeCustomer.mutate(customer.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Anonimizar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {canCreate && <CreateCustomerDialog open={dialogOpen} onOpenChange={setDialogOpen} />}
    </div>
  )
}
