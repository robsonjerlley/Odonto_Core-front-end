import { useForm, useWatch, type DefaultValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CustomerSource, AdsChannel, ContactChannel } from '@/types/enums'
import { useCreateCustomer } from './funnel.queries'
import { customerSchema, type CustomerFormData } from './customer.schema'
import { CUSTOMER_SOURCE_LABELS, ADS_CHANNEL_LABELS, CONTACT_CHANNEL_LABELS } from '@/lib/labels'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CreateCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFAULT_VALUES: DefaultValues<CustomerFormData> = {
  name: '',
  cpf: '',
  phone: '',
  phone2: '',
  email: '',
  initialNote: '',
  channel: undefined,
  source: undefined,
  adsChannel: undefined,
  adCampaign: '',
}

export default function CreateCustomerDialog({ open, onOpenChange }: CreateCustomerDialogProps) {
  const createCustomer = useCreateCustomer()

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const source = useWatch({ control: form.control, name: 'source' })
  const initialNote = useWatch({ control: form.control, name: 'initialNote' })

  function handleOpenChange(value: boolean) {
    if (!value) form.reset(DEFAULT_VALUES)
    onOpenChange(value)
  }

  async function onSubmit(data: CustomerFormData) {
    form.clearErrors('root')
    try {
      const payload = {
        ...data,
        cpf: data.cpf || undefined,
        phone2: data.phone2 || undefined,
        email: data.email || undefined,
        initialNote: data.initialNote || undefined,
        channel: data.initialNote ? data.channel : undefined,
        adsChannel: data.adsChannel ?? undefined,
        adCampaign: data.adCampaign || undefined,
      }
      await createCustomer.mutateAsync(payload)
      form.reset(DEFAULT_VALUES)
      onOpenChange(false)
    } catch (err) {
      const response = (err as { response?: { data?: { message?: string }; status?: number } })?.response
      const msg = response?.data?.message
      if (response?.status === 409 && msg?.toLowerCase().includes('cpf')) {
        form.setError('cpf', { message: msg })
      } else {
        form.setError('root', { message: msg ?? 'Erro ao criar cliente. Verifique os dados.' })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo cliente</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Nome</FormLabel>
                  <FormControl><Input placeholder="Nome do cliente" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="cpf" render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF (opcional)</FormLabel>
                  <FormControl><Input placeholder="00000000000" maxLength={11} {...field} /></FormControl>
                  <p className="text-[11px] text-muted-foreground">Obrigatório apenas para agendar a consulta.</p>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl><Input placeholder="00 000000000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone2" render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone 2 (opcional)</FormLabel>
                  <FormControl><Input placeholder="00 000000000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail (opcional)</FormLabel>
                  <FormControl><Input placeholder="e-mail" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="initialNote" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Observação do primeiro contato (opcional)</FormLabel>
                  <FormControl><Textarea rows={2} placeholder="Ex: ligou interessado em implante, retornar à tarde…" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {initialNote ? (
                <FormField control={form.control} name="channel" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Canal do contato</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ContactChannel).map((c) => (
                          <SelectItem key={c} value={c}>{CONTACT_CHANNEL_LABELS[c]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              ) : null}

              <FormField control={form.control} name="source" render={({ field }) => (
                <FormItem>
                  <FormLabel>Origem</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(CustomerSource).map((s) => (
                        <SelectItem key={s} value={s}>{CUSTOMER_SOURCE_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {source === 'ADS_PAID' && (
                <FormField control={form.control} name="adsChannel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canal de Ads</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(AdsChannel).map((c) => (
                          <SelectItem key={c} value={c}>{ADS_CHANNEL_LABELS[c]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              {source === 'ADS_PAID' && (
                <FormField control={form.control} name="adCampaign" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Campanha (opcional)</FormLabel>
                    <FormControl><Input placeholder="Nome da campanha" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </div>

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createCustomer.isPending}>
                {createCustomer.isPending ? 'Criando...' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
