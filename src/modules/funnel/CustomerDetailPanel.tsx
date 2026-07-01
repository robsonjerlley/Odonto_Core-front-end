import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Customer } from '@/types/models'
import {
  ADS_CHANNEL_LABELS, CUSTOMER_SOURCE_LABELS,
  CONTACT_CHANNEL_LABELS, TICKET_STATUS_LABELS,
} from '@/lib/labels'
import { useCustomerContactLogs } from './funnel.queries'
import { Badge } from '@/components/ui/badge'

interface CustomerDetailPanelProps {
  customer: Customer
}

function formatCpf(cpf?: string) {
  if (!cpf) return '—'
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatPhone(phone?: string | null) {
  if (!phone || phone === 'NULL') return '—'
  return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}

function formatDate(value?: string) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

/** Linha rótulo → valor. Oculta quando o valor é vazio (a não ser que `always`). */
function Field({ label, value, always }: { label: string; value?: string | null; always?: boolean }) {
  const display = value && value !== 'NULL' ? value : '—'
  if (!always && display === '—') return null
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-words">{display}</span>
    </div>
  )
}

// ─── Timeline de contatos/notas ─────────────────────────────────────────────────

function ContactTimeline({ customerId }: { customerId: string }) {
  const { data: logs = [], isLoading } = useCustomerContactLogs(customerId)

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando contatos...</p>
  if (logs.length === 0) return <p className="text-sm text-muted-foreground">Nenhum contato registrado.</p>

  const sorted = [...logs].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )

  return (
    <ol className="relative ml-3 space-y-4 border-l border-border">
      {sorted.map((log) => {
        // Discriminador contrato §12: logs automáticos têm statusBefore/After preenchidos.
        const isAutoLog = log.statusBefore != null && log.statusAfter != null
        const isGenericNote = /^status changed:/i.test(log.note ?? '')
        const showNote = !isAutoLog || !isGenericNote
        return (
          <li key={log.id} className="ml-4">
            <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-background bg-primary" />
            <p className="text-xs text-muted-foreground">
              {formatDate(log.occurredAt)}
              {log.username && <> {' · '}<span className="font-medium">{log.username}</span></>}
              {log.channel !== 'OTHER' && <> {' · '}<span className="font-medium">{CONTACT_CHANNEL_LABELS[log.channel]}</span></>}
            </p>
            {log.statusBefore && log.statusAfter && log.statusBefore !== log.statusAfter && (
              <p className="mt-1">
                <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {TICKET_STATUS_LABELS[log.statusBefore]} → {TICKET_STATUS_LABELS[log.statusAfter]}
                </span>
              </p>
            )}
            {showNote && <p className="mt-1 text-sm">{log.note}</p>}
          </li>
        )
      })}
    </ol>
  )
}

// ─── Painel ─────────────────────────────────────────────────────────────────────

export default function CustomerDetailPanel({ customer }: CustomerDetailPanelProps) {
  const anon = customer.anonymized

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          {customer.name}
          {anon && <Badge variant="outline" className="text-[10px] font-normal">Anonimizado</Badge>}
        </h2>
        <p className="text-sm text-muted-foreground">Dados cadastrais e histórico de contatos.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <section>
          <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Contato</h3>
          {anon ? (
            <p className="py-1 text-sm text-muted-foreground">Dados pessoais removidos (LGPD).</p>
          ) : (
            <>
              <Field label="CPF" value={formatCpf(customer.cpf)} always />
              <Field label="Telefone" value={formatPhone(customer.phone)} always />
              <Field label="Telefone 2" value={formatPhone(customer.phone2)} />
              <Field label="E-mail" value={customer.email} />
            </>
          )}
        </section>

        <section>
          <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Origem</h3>
          <Field label="Origem" value={CUSTOMER_SOURCE_LABELS[customer.source]} always />
          <Field label="Canal Ads" value={customer.adsChannel ? ADS_CHANNEL_LABELS[customer.adsChannel] : undefined} />
          <Field label="Campanha" value={customer.adCampaign} />
          <Field label="Indicado por" value={customer.referredBy} />
          <Field label="Criado em" value={formatDate(customer.createdAt)} always />
        </section>
      </div>

      {!anon && customer.initialNote && (
        <section>
          <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Observação inicial</h3>
          <p className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm">{customer.initialNote}</p>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Contatos e notas</h3>
        <ContactTimeline customerId={customer.id} />
      </section>
    </div>
  )
}
