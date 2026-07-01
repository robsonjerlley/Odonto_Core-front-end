import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { AlertTriangle, Check } from 'lucide-react'
import { paySchema, type PayFormInput, type PayFormData } from './installment.schema'
import { usePayInstallment, useUnpayInstallment } from './installment.queries'
import type { Installment } from '@/types/models'
import { formatCurrency, todayBrasiliaISO, cn } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { usePermission } from '@/hooks/usePermission'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'

function fmtDate(iso: string): string {
  return format(new Date(`${iso}T00:00:00`), 'dd/MM/yyyy')
}

// ─── Badge de status ────────────────────────────────────────────────────────────

function StatusBadge({ installment }: { installment: Installment }) {
  if (installment.status === 'PAID') {
    return (
      <Badge variant="outline" className="border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
        <Check className="size-3" /> Pago
      </Badge>
    )
  }
  if (installment.overdue) {
    return (
      <Badge variant="outline" className="border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
        <AlertTriangle className="size-3" /> Atrasado
      </Badge>
    )
  }
  return <Badge variant="outline">A receber</Badge>
}

// ─── Sheet "Marcar pago" ────────────────────────────────────────────────────────

function PayDialog({ installment, open, onOpenChange }: {
  installment: Installment; open: boolean; onOpenChange: (v: boolean) => void
}) {
  const pay = usePayInstallment()
  const form = useForm<PayFormInput, unknown, PayFormData>({
    resolver: zodResolver(paySchema),
    defaultValues: { paidAmount: installment.expectedAmount, paidAt: todayBrasiliaISO() },
  })

  const paidAmount = useWatch({ control: form.control, name: 'paidAmount' })
  const isPartial = typeof paidAmount === 'number' && paidAmount < installment.expectedAmount

  async function onSubmit(data: PayFormData) {
    try {
      await pay.mutateAsync({ id: installment.id, dto: { paidAmount: data.paidAmount, paidAt: data.paidAt } })
      toast('Parcela marcada como paga', 'success')
      onOpenChange(false)
    } catch { /* toast pelo interceptor */ }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Marcar pagamento</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Paciente</span><span className="font-medium">{installment.customerName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Parcela</span><span>{installment.sequence}/{installment.totalInstallments}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Vencimento</span><span>{fmtDate(installment.dueDate)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Valor esperado</span><span>{formatCurrency(installment.expectedAmount)}</span></div>
            </div>

            <FormField control={form.control} name="paidAmount" render={({ field }) => (
              <FormItem>
                <FormLabel>Valor recebido *</FormLabel>
                <FormControl><CurrencyInput value={field.value} onChange={field.onChange} autoFocus /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="paidAt" render={({ field }) => (
              <FormItem>
                <FormLabel>Data do pagamento *</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {isPartial && (
              <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                ⚠️ Pagamento parcial marca a parcela como quitada — o sistema não guarda saldo residual.
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={pay.isPending}>
                {pay.isPending ? 'Salvando...' : 'Confirmar pagamento'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Linha da parcela ────────────────────────────────────────────────────────────

interface InstallmentRowProps {
  installment: Installment
  /** Modo leitura (drawer de histórico) — oculta ações. */
  readOnly?: boolean
  /** Clique no nome abre o histórico do paciente. */
  onOpenCustomer?: (customerId: string) => void
}

export default function InstallmentRow({ installment, readOnly, onOpenCustomer }: InstallmentRowProps) {
  const [payOpen, setPayOpen] = useState(false)
  const [unpayOpen, setUnpayOpen] = useState(false)
  const unpay = useUnpayInstallment()
  const canUpdate = usePermission('INSTALLMENT', 'UPDATE')

  const isPaid = installment.status === 'PAID'

  async function handleUnpay() {
    try {
      await unpay.mutateAsync(installment.id)
      toast('Pagamento estornado', 'success')
      setUnpayOpen(false)
    } catch { /* toast pelo interceptor */ }
  }

  return (
    <>
      <div className={cn(
        'flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center',
        installment.overdue && !isPaid && 'border-rose-200 dark:border-rose-900',
      )}>
        <div className="min-w-0 flex-1">
          {onOpenCustomer ? (
            <button
              className="truncate text-left text-sm font-medium hover:underline"
              onClick={() => onOpenCustomer(installment.customerId)}
            >
              {installment.customerName}
            </button>
          ) : (
            <p className="truncate text-sm font-medium">{installment.customerName}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Parcela {installment.sequence}/{installment.totalInstallments} · Vence {fmtDate(installment.dueDate)}
            {isPaid && installment.paidAt && ` · Pago em ${fmtDate(installment.paidAt)}`}
          </p>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-sm font-semibold tabular-nums">{formatCurrency(installment.expectedAmount)}</span>
          <div className="w-24 shrink-0"><StatusBadge installment={installment} /></div>
          {!readOnly && canUpdate && (
            isPaid ? (
              <Button size="sm" variant="outline" className="min-h-9 shrink-0" onClick={() => setUnpayOpen(true)}>Estornar</Button>
            ) : (
              <Button size="sm" className="min-h-9 shrink-0" onClick={() => setPayOpen(true)}>Marcar pago</Button>
            )
          )}
        </div>
      </div>

      <PayDialog installment={installment} open={payOpen} onOpenChange={setPayOpen} />

      <AlertDialog open={unpayOpen} onOpenChange={setUnpayOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Estornar pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Estornar o pagamento desta parcela? Ela volta para "A receber".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnpay} disabled={unpay.isPending}>
              {unpay.isPending ? 'Estornando...' : 'Estornar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
