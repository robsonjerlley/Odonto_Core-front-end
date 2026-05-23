import { useForm, type DefaultValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ContactChannel } from '@/types/enums'
import { useCreateContactLog } from './funnel.queries'
import { contactLogSchema, type ContactLogFormData } from './contact-log.schema'
import { CONTACT_CHANNEL_LABELS } from '@/lib/labels'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

interface AddContactLogDialogProps {
  ticketId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFAULT_VALUES: DefaultValues<ContactLogFormData> = {
  channel: undefined,
  note: '',
  occurredAt: '',
}

function nowLocal() {
  const d = new Date()
  d.setSeconds(0, 0)
  return d.toISOString().slice(0, 16)
}

export default function AddContactLogDialog({ ticketId, open, onOpenChange }: AddContactLogDialogProps) {
  const createLog = useCreateContactLog(ticketId)

  const form = useForm<ContactLogFormData>({
    resolver: zodResolver(contactLogSchema),
    defaultValues: DEFAULT_VALUES,
  })

  function handleOpenChange(value: boolean) {
    if (!value) form.reset({ ...DEFAULT_VALUES, occurredAt: nowLocal() })
    onOpenChange(value)
  }

  // Pre-fill the date whenever the dialog opens
  if (open && !form.getValues('occurredAt')) {
    form.setValue('occurredAt', nowLocal())
  }

  async function onSubmit(data: ContactLogFormData) {
    try {
      await createLog.mutateAsync({
        ticketId,
        channel: data.channel,
        note: data.note,
        occurredAt: new Date(data.occurredAt).toISOString(),
      })
      form.reset({ ...DEFAULT_VALUES, occurredAt: nowLocal() })
      onOpenChange(false)
    } catch {
      // erro tratado pelo estado isError da mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo registro de contato</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="channel" render={({ field }) => (
              <FormItem>
                <FormLabel>Canal</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecione o canal" /></SelectTrigger>
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

            <FormField control={form.control} name="occurredAt" render={({ field }) => (
              <FormItem>
                <FormLabel>Data / hora</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="note" render={({ field }) => (
              <FormItem>
                <FormLabel>Observação</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descreva o contato..." rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {createLog.isError && (
              <p className="text-sm text-destructive">
                Erro ao salvar registro. Tente novamente.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createLog.isPending}>
                {createLog.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
