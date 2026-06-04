import { useForm, type DefaultValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ContactChannel, TicketStatus } from '@/types/enums'
import { useCreateContactLog } from './funnel.queries'
import { contactLogSchema, type ContactLogFormData } from './contact-log.schema'
import { CONTACT_CHANNEL_LABELS } from '@/lib/labels'
import { nowBrasiliaISO } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AddContactLogDialogProps {
  ticketId: string
  ticketStatus: TicketStatus
  open: boolean
  onOpenChange: (open: boolean) => void
}

// O canal de contato só faz sentido enquanto o lead está na fase de contato,
// antes de ser agendado para avaliação.
const CONTACT_PHASE: TicketStatus[] = [TicketStatus.NEW, TicketStatus.IN_CONTACT]

const DEFAULT_VALUES: DefaultValues<ContactLogFormData> = {
  channel: undefined,
  note: '',
}

export default function AddContactLogDialog({
  ticketId, ticketStatus, open, onOpenChange,
}: AddContactLogDialogProps) {
  const createLog = useCreateContactLog(ticketId)
  const showChannel = CONTACT_PHASE.includes(ticketStatus)

  const form = useForm<ContactLogFormData>({
    resolver: zodResolver(contactLogSchema),
    defaultValues: DEFAULT_VALUES,
  })

  function handleOpenChange(value: boolean) {
    if (!value) form.reset(DEFAULT_VALUES)
    onOpenChange(value)
  }

  async function onSubmit(data: ContactLogFormData) {
    if (showChannel && !data.channel) {
      form.setError('channel', { message: 'Selecione o canal de contato' })
      return
    }
    try {
      await createLog.mutateAsync({
        ticketId,
        channel: data.channel ?? ContactChannel.OTHER,
        note: data.note,
        occurredAt: nowBrasiliaISO(),
      })
      form.reset(DEFAULT_VALUES)
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
            {showChannel && (
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
            )}

            <FormField control={form.control} name="note" render={({ field }) => (
              <FormItem>
                <FormLabel>Observação</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descreva o contato..." rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <p className="text-xs text-muted-foreground">
              Registrado automaticamente com a data e hora atuais (horário de Brasília).
            </p>

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
