import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
  type CloseDealFormInput, type CloseDealFormData,
} from './deal.schema'
import ProcedureListEditor from './ProcedureListEditor'
import { PaymentMethod } from '@/types/enums'
import { SECTOR_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_METHOD_OPTIONS } from '@/lib/labels'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePermission } from '@/hooks/usePermission'
import { useProcedures } from '@/modules/catalog/procedure.queries'
import type { LeadTicket, Customer, Deal, DealHistory, Procedure } from '@/types/models'

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

  const form = useForm<DealFormInput, unknown, DealFormData>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      items: deal.items.map((it) => ({
        procedureId: it.procedureId,
        priceOverride: it.priceOverride,
        quantity: it.quantity,
        note: it.note ?? '',
      })),
    },
  })

  async function onSubmit(data: DealFormData) {
    try {
      await update.mutateAsync(data)
      onOpenChange(false)
    } catch {
      /* erro já exibido via toast pelo interceptor; mantém o diálogo aberto */
    }
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

  const form = useForm<DiscountFormInput, unknown, DiscountFormData>({
    resolver: zodResolver(discountSchema),
    defaultValues: { discountPct: deal.discountPct ?? undefined },
  })

  async function onSubmit(data: DiscountFormData) {
    try {
      await apply.mutateAsync(data)
      onOpenChange(false)
    } catch {
      /* erro já exibido via toast pelo interceptor; mantém o diálogo aberto */
    }
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
  /** Reporta o nº de parcelas escolhido (visual/local — não persiste no backend). */
  onClosed: (installments: number | null) => void
}

function CloseDealDialog({ deal, ticketId, open, onOpenChange, onClosed }: CloseDealDialogProps) {
  const close = useCloseDeal(deal.id, ticketId)

  const form = useForm<CloseDealFormInput, unknown, CloseDealFormData>({
    resolver: zodResolver(closeDealSchema),
  })

  const paymentMethod = useWatch({ control: form.control, name: 'paymentMethod' })
  const isInstallment = paymentMethod === PaymentMethod.INSTALLMENT

  async function onSubmit(data: CloseDealFormData) {
    try {
      // O backend só persiste a forma de pagamento; parcelas são visuais.
      await close.mutateAsync({ paymentMethod: data.paymentMethod })
      onClosed(data.installments ?? null)
      onOpenChange(false)
    } catch {
      /* erro já exibido via toast pelo interceptor; mantém o diálogo aberto */
    }
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
                      {PAYMENT_METHOD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isInstallment && (
                    <p className="text-xs text-muted-foreground">
                      Selecione "Parcelado" para informar o número de parcelas.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {isInstallment && (
              <FormField
                control={form.control}
                name="installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de parcelas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={2}
                        max={24}
                        placeholder="Ex: 10"
                        {...field}
                        value={(field.value as string | number | undefined) ?? ''}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Informação visual — será persistida quando o módulo financeiro entrar.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
  // Parcelas escolhidas no fechamento — visual apenas, não persiste (some ao recarregar).
  const [installments, setInstallments] = useState<number | null>(null)

  const canCreate = usePermission('DEAL', 'CREATE')
  const canUpdate = usePermission('DEAL', 'UPDATE')
  const canClose = usePermission('DEAL', 'CLOSE')

  const { data: cachedDeal } = useDealForTicket(ticket?.id ?? '')
  const deal = cachedDeal ?? null

  const { data: dealDetail } = useDealDetail(deal?.id ?? '')

  const createDeal = useCreateDeal(ticket?.id ?? '')

  const createForm = useForm<DealFormInput, unknown, DealFormData>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: { items: [{ procedureId: '', priceOverride: undefined, quantity: 1, note: '' }] },
  })

  // Catálogo para resolver nome/preço dos itens (o response só traz procedureId).
  const { data: procedures = [] } = useProcedures()
  const procMap = new Map<string, Procedure>(procedures.map((p) => [p.id, p]))

  async function handleCreate(data: DealFormData) {
    try {
      await createDeal.mutateAsync(data)
      createForm.reset()
    } catch {
      /* erro já exibido via toast pelo interceptor; mantém o formulário preenchido */
    }
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
              canCreate ? (
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
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum orçamento criado para este ticket.
                </p>
              )
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
                    {!isClosed && canUpdate && (
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
                          <th className="text-right p-2 font-medium">Vlr. Unit.</th>
                          <th className="text-right p-2 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deal.items.map((it, i) => {
                          const proc = procMap.get(it.procedureId)
                          const unit = it.priceOverride ?? proc?.defaultPrice
                          return (
                            <tr key={i} className="border-t">
                              <td className="p-2">
                                <p>{proc?.name ?? '—'}</p>
                                {proc?.code && <p className="text-xs text-muted-foreground">{proc.code}</p>}
                                {it.priceOverride != null && (
                                  <p className="text-xs text-amber-600">Preço ajustado</p>
                                )}
                                {it.note && <p className="text-xs text-muted-foreground italic">{it.note}</p>}
                              </td>
                              <td className="p-2 text-right">{it.quantity}</td>
                              <td className="p-2 text-right">{currency(unit)}</td>
                              <td className="p-2 text-right font-medium">
                                {unit != null ? currency(unit * it.quantity) : '—'}
                              </td>
                            </tr>
                          )
                        })}
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
                      <span className="font-medium">
                        {deal.paymentMethod ? PAYMENT_METHOD_LABELS[deal.paymentMethod] : '—'}
                        {deal.paymentMethod === PaymentMethod.INSTALLMENT && installments != null &&
                          ` em ${installments}x`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fechado em</span>
                      <span>{format(new Date(deal.closedAt!), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                  </div>
                )}

                {/* Ações */}
                {!isClosed && (canUpdate || canClose) && (
                  <div className="flex gap-2 flex-wrap">
                    {canUpdate && (
                      <Button variant="outline" size="sm" onClick={() => setDiscountOpen(true)}>
                        {deal.discountPct != null ? 'Alterar desconto' : 'Aplicar desconto'}
                      </Button>
                    )}
                    {canClose && (
                      <Button size="sm" onClick={() => setCloseOpen(true)}>
                        Fechar deal
                      </Button>
                    )}
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
            onClosed={setInstallments}
          />
        </>
      )}
    </>
  )
}
