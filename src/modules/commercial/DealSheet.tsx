import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  useDealForTicket,
  useDealDetail,
  useCreateDeal,
  useUpdateDeal,
  useApplyDiscount,
  useCloseDeal,
} from './commercial.queries'
import {
  dealFormSchema, discountSchema, closeDealSchema,
  type DealFormInput, type DealFormData,
  type DiscountFormInput, type DiscountFormData,
  type CloseDealFormData,
} from './deal.schema'
import ProcedureListEditor from './ProcedureListEditor'
import { SECTOR_LABELS } from '@/lib/labels'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { LeadTicket, Customer, Deal, DealHistory } from '@/types/models'

const PAYMENT_METHODS = ['Pix', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência', 'Financiamento']

function currency(value: number | undefined | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// ─── Edit Procedures Dialog ───────────────────────────────────────────────────

interface EditProceduresDialogProps {
  deal: Deal
  ticketId: string
  open: boolean
  onOpenChange: (v: boolean) => void
}

function EditProceduresDialog({ deal, ticketId, open, onOpenChange }: EditProceduresDialogProps) {
  const update = useUpdateDeal(deal.id, ticketId)

  const form = useForm<DealFormInput, any, DealFormData>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: { procedures: deal.procedures },
  })

  async function onSubmit(data: DealFormData) {
    try {
      await update.mutateAsync(data)
      onOpenChange(false)
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar procedimentos</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ProcedureListEditor control={form.control} />
            {update.isError && (
              <p className="text-sm text-destructive">Erro ao salvar. Tente novamente.</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Apply Discount Dialog ────────────────────────────────────────────────────

interface ApplyDiscountDialogProps {
  deal: Deal
  ticketId: string
  open: boolean
  onOpenChange: (v: boolean) => void
}

function ApplyDiscountDialog({ deal, ticketId, open, onOpenChange }: ApplyDiscountDialogProps) {
  const apply = useApplyDiscount(deal.id, ticketId)

  const form = useForm<DiscountFormInput, any, DiscountFormData>({
    resolver: zodResolver(discountSchema),
    defaultValues: { discountPct: deal.discountPct ?? undefined },
  })

  async function onSubmit(data: DiscountFormData) {
    try {
      await apply.mutateAsync(data)
      onOpenChange(false)
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Aplicar desconto</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="discountPct"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desconto (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0.01} max={100} step={0.01} placeholder="Ex: 10" {...field} value={(field.value as string | number | undefined) ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-sm text-muted-foreground">
              Valor total: {currency(deal.totalValue)}
            </p>
            {apply.isError && (
              <p className="text-sm text-destructive">Erro ao aplicar desconto.</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={apply.isPending}>
                {apply.isPending ? 'Aplicando...' : 'Aplicar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Close Deal Dialog ────────────────────────────────────────────────────────

interface CloseDealDialogProps {
  deal: Deal
  ticketId: string
  open: boolean
  onOpenChange: (v: boolean) => void
}

function CloseDealDialog({ deal, ticketId, open, onOpenChange }: CloseDealDialogProps) {
  const close = useCloseDeal(deal.id, ticketId)

  const form = useForm<CloseDealFormData>({
    resolver: zodResolver(closeDealSchema),
    defaultValues: { paymentMethod: '' },
  })

  async function onSubmit(data: CloseDealFormData) {
    try {
      await close.mutateAsync(data)
      onOpenChange(false)
    } catch {}
  }

  const finalValue = deal.finalValue ?? deal.totalValue

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Fechar deal</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor total</span>
                <span>{currency(deal.totalValue)}</span>
              </div>
              {deal.discountPct != null && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto ({deal.discountPct}%)</span>
                  <span>- {currency(deal.totalValue * deal.discountPct / 100)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                <span>Valor final</span>
                <span>{currency(finalValue)}</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de pagamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {close.isError && (
              <p className="text-sm text-destructive">Erro ao fechar deal.</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={close.isPending}>
                {close.isPending ? 'Fechando...' : 'Confirmar fechamento'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── History Timeline ─────────────────────────────────────────────────────────

function HistoryTimeline({ history }: { history: DealHistory[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma alteração registrada.</p>
  }

  const sorted = [...history].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  )

  return (
    <ol className="relative border-l border-border space-y-4 ml-3">
      {sorted.map((h, i) => (
        <li key={i} className="ml-4">
          <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-background bg-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {format(new Date(h.occurredAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {' · '}
            <span className="font-medium">{SECTOR_LABELS[h.changedBySector]}</span>
          </p>
          <p className="text-sm mt-0.5">
            <span className="font-medium">{h.fieldChanged}</span>
            {': '}
            <span className="text-muted-foreground line-through">{h.valueBefore}</span>
            {' → '}
            <span>{h.valueAfter}</span>
          </p>
        </li>
      ))}
    </ol>
  )
}

// ─── Main DealSheet ───────────────────────────────────────────────────────────

interface DealSheetProps {
  ticket: LeadTicket | null
  customer: Customer | undefined
  open: boolean
  onOpenChange: (v: boolean) => void
}

export default function DealSheet({ ticket, customer, open, onOpenChange }: DealSheetProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [discountOpen, setDiscountOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const { data: cachedDeal } = useDealForTicket(ticket?.id ?? '')
  const deal = cachedDeal ?? null

  const { data: dealDetail } = useDealDetail(deal?.id ?? '')

  const createDeal = useCreateDeal(ticket?.id ?? '')

  const createForm = useForm<DealFormInput, any, DealFormData>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: { procedures: [{ name: '', code: '', tableValue: 0, quantity: 1, note: '' }] },
  })

  async function handleCreate(data: DealFormData) {
    try {
      await createDeal.mutateAsync(data)
      createForm.reset()
    } catch {}
  }

  if (!ticket) return null

  const isClosed = !!deal?.closedAt

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Orçamento — {customer?.name ?? 'Cliente'}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-6">

            {/* ── Sem deal: formulário de criação ── */}
            {!deal && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Nenhum orçamento criado para este ticket. Adicione os procedimentos abaixo.
                </p>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                    <ProcedureListEditor control={createForm.control} />
                    {createDeal.isError && (
                      <p className="text-sm text-destructive">
                        Erro ao criar orçamento. Verifique se já existe um orçamento para este ticket.
                      </p>
                    )}
                    <Button type="submit" className="w-full" disabled={createDeal.isPending}>
                      {createDeal.isPending ? 'Criando...' : 'Criar orçamento'}
                    </Button>
                  </form>
                </Form>
              </div>
            )}

            {/* ── Com deal: visão geral ── */}
            {deal && (
              <>
                {/* Status */}
                <div className="flex items-center gap-2">
                  <Badge variant={isClosed ? 'secondary' : 'default'}>
                    {isClosed ? 'Fechado' : 'Aberto'}
                  </Badge>
                  {deal.discountPct != null && (
                    <Badge variant="outline">{deal.discountPct}% de desconto</Badge>
                  )}
                </div>

                {/* Procedimentos */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">Procedimentos</h3>
                    {!isClosed && (
                      <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
                        Editar
                      </Button>
                    )}
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2 font-medium">Procedimento</th>
                          <th className="text-right p-2 font-medium">Qtd</th>
                          <th className="text-right p-2 font-medium">Vlr. Tab.</th>
                          <th className="text-right p-2 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deal.procedures.map((p, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">
                              <p>{p.name}</p>
                              {p.code && <p className="text-xs text-muted-foreground">{p.code}</p>}
                              {p.note && <p className="text-xs text-muted-foreground italic">{p.note}</p>}
                            </td>
                            <td className="p-2 text-right">{p.quantity}</td>
                            <td className="p-2 text-right">{currency(p.tableValue)}</td>
                            <td className="p-2 text-right font-medium">{currency(p.tableValue * p.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t bg-muted/30">
                        <tr>
                          <td colSpan={3} className="p-2 text-right font-semibold">Total</td>
                          <td className="p-2 text-right font-semibold">{currency(deal.totalValue)}</td>
                        </tr>
                        {deal.discountPct != null && (
                          <tr className="text-green-600">
                            <td colSpan={3} className="p-2 text-right">Desconto ({deal.discountPct}%)</td>
                            <td className="p-2 text-right">- {currency(deal.totalValue * deal.discountPct / 100)}</td>
                          </tr>
                        )}
                        {deal.finalValue != null && (
                          <tr className="font-bold">
                            <td colSpan={3} className="p-2 text-right">Valor Final</td>
                            <td className="p-2 text-right">{currency(deal.finalValue)}</td>
                          </tr>
                        )}
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Fechamento info */}
                {isClosed && (
                  <div className="rounded-lg border p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Forma de pagamento</span>
                      <span className="font-medium">{deal.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fechado em</span>
                      <span>{format(new Date(deal.closedAt!), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                  </div>
                )}

                {/* Ações */}
                {!isClosed && (
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => setDiscountOpen(true)}>
                      {deal.discountPct != null ? 'Alterar desconto' : 'Aplicar desconto'}
                    </Button>
                    <Button size="sm" onClick={() => setCloseOpen(true)}>
                      Fechar deal
                    </Button>
                  </div>
                )}

                {/* Histórico */}
                <div className="border-t pt-4 space-y-3">
                  <button
                    className="text-sm font-medium hover:underline"
                    onClick={() => setShowHistory((v) => !v)}
                  >
                    {showHistory ? 'Ocultar histórico' : 'Ver histórico de alterações'}
                  </button>
                  {showHistory && (
                    dealDetail
                      ? <HistoryTimeline history={dealDetail.history} />
                      : <p className="text-sm text-muted-foreground">Carregando...</p>
                  )}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {deal && (
        <>
          <EditProceduresDialog
            deal={deal}
            ticketId={ticket.id}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <ApplyDiscountDialog
            deal={deal}
            ticketId={ticket.id}
            open={discountOpen}
            onOpenChange={setDiscountOpen}
          />
          <CloseDealDialog
            deal={deal}
            ticketId={ticket.id}
            open={closeOpen}
            onOpenChange={setCloseOpen}
          />
        </>
      )}
    </>
  )
}
