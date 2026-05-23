import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ContactChannel } from '@/types/enums'
import { useCreateContactLog } from './funnel.queries'
import { contactLogSchema, type ContactLogFormData } from './contact-log.schema'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

const CHANNEL_LABELS: Record<string, string> = {
  ORGANIC: 'Orgânico',
  REFERRAL: 'Indicação',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  WHATSAPP: 'WhatsApp',
  PHONE_CALL: 'Ligação',
  WEBSITE_FROM: 'Site',
  OTHER: 'Outro',
}

interface AddContactLogDialogProps {
  ticketId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AddContactLogDialog({ ticketId, open, onOpenChange }: AddContactLogDialogProps) {
  const createLog = useCreateContactLog(ticketId)

  const form = useForm<ContactLogFormData>({
    resolver: zodResolver(contactLogSchema),
    defaultValues: {
      channel: undefined,
      note: '',
      occurredAt: new Date().toISOString().slice(0, 16),
    },
  })

  async function onSubmit(data: ContactLogFormData) {
    await createLog.mutateAsync({
      ticketId,
      channel: data.channel,
      note: data.note,
      occurredAt: new Date(data.occurredAt).toISOString(),
    })
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo registro de contato</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="channel" render={({ field }) => (
              <FormItem>
                <FormLabel>Canal</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecione o canal" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(ContactChannel).map((c) => (
                      <SelectItem key={c} value={c}>{CHANNEL_LABELS[c] ?? c}</SelectItem>
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

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
