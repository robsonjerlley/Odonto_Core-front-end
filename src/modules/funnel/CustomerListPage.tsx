import { useState } from 'react'
import { useCustomers, useRemoveCustomer } from './funnel.queries'
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
import { useHasRole } from '@/hooks/useHasRole'
import { Role } from '@/types/enums'

export default function CustomerListPage() {
  const { data: customers = [], isLoading } = useCustomers()
  const removeCustomer = useRemoveCustomer()
  const canCreate = useHasRole(Role.ADM_SYSTEM, Role.ADM_LEADS, Role.USER_LEADS, Role.USER_ATTENDANT)

  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.cpf.includes(search)
  })

  function formatCpf(cpf: string) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  function formatPhone(phone: string) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        {canCreate && <Button onClick={() => setDialogOpen(true)}>Novo cliente</Button>}
      </div>

      <Input
        placeholder="Buscar por nome ou CPF..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

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
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell className="font-mono text-sm">{formatCpf(customer.cpf)}</TableCell>
                  <TableCell>{formatPhone(customer.phone)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{CUSTOMER_SOURCE_LABELS[customer.source]}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O cliente{' '}
                            <strong>{customer.name}</strong> será removido permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeCustomer.mutate(customer.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
