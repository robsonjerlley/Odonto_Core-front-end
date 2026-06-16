import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Sector, Role, AdsChannel } from '@/types/enums'
import { SECTOR_LABELS, ROLE_LABELS, ADS_CHANNEL_LABELS } from '@/lib/labels'
import { configService, type RecycleConfigDTO, type BonusConfigDTO, type AdsInvestmentDTO } from './config.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// ─── Recycle Config ────────────────────────────────────────────────────────────

const recycleSchema = z.object({
  afterDays: z.coerce.number().int().min(1, 'Mínimo 1 dia'),
})
type RecycleFormInput = z.input<typeof recycleSchema>
type RecycleForm = z.output<typeof recycleSchema>

function RecycleConfigCard() {
  const [success, setSuccess] = useState(false)
  const qc = useQueryClient()

  // Backend retorna 200 + null quando nenhuma config ativa existe (ADR v1.7/bug #18).
  const { data: current } = useQuery({
    queryKey: ['config-recycle'],
    queryFn: () => configService.getRecycleConfig(),
    retry: false,
  })

  const form = useForm<RecycleFormInput, unknown, RecycleForm>({
    resolver: zodResolver(recycleSchema),
    defaultValues: { afterDays: 7 },
  })

  // Pré-preenche com o valor vigente assim que a config é carregada.
  useEffect(() => {
    if (current) form.reset({ afterDays: current.afterDays })
  }, [current, form])

  async function onSubmit(data: RecycleForm) {
    try {
      const dto: RecycleConfigDTO = { afterDays: data.afterDays }
      await configService.setRecycleConfig(dto)
      await qc.invalidateQueries({ queryKey: ['config-recycle'] })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      form.setError('root', { message: 'Erro ao salvar configuração.' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reciclagem de leads</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Tickets em <strong>Pendente</strong> que ultrapassarem o prazo serão reciclados automaticamente.
        </p>
        {current ? (
          <p className="text-sm mb-4 rounded-md bg-muted/40 px-3 py-2">
            Prazo vigente: <strong>{current.afterDays} dia(s)</strong>
          </p>
        ) : (
          <p className="text-sm mb-4 rounded-md bg-amber-50 text-amber-800 px-3 py-2">
            Nenhuma configuração de reciclagem ativa. Defina um prazo abaixo.
          </p>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="afterDays" render={({ field }) => (
              <FormItem>
                <FormLabel>Prazo para reciclagem (dias)</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} value={(field.value as string | number | undefined) ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}
            {success && <p className="text-sm text-green-600">Configuração salva com sucesso.</p>}

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Salvando...' : 'Salvar configuração'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// ─── Bonus Config ──────────────────────────────────────────────────────────────

const bonusSchema = z.object({
  sector: z.enum(Object.values(Sector) as [Sector, ...Sector[]]),
  role: z.enum(Object.values(Role) as [Role, ...Role[]]),
  metricKey: z.string().min(1, 'Informe a métrica'),
  bonusPct: z.coerce.number().min(0.01, 'Mínimo 0,01%').max(100, 'Máximo 100%'),
  // Aceita formato BR ("100.000,00") e numérico puro ("100000").
  targetValue: z.preprocess(
    (v) => {
      if (v === '' || v == null) return undefined
      const s = String(v).trim()
      if (!s) return undefined
      const normalized = s.includes(',')
        ? s.replace(/\./g, '').replace(',', '.')
        : s
      const n = parseFloat(normalized)
      return Number.isNaN(n) ? v : n
    },
    z.number({ error: 'Informe um número válido' }).positive('Valor deve ser positivo').optional(),
  ),
  periodRef: z.string().regex(/^\d{4}-\d{2}$/, 'Formato: AAAA-MM'),
})
type BonusFormInput = z.input<typeof bonusSchema>
type BonusForm = z.output<typeof bonusSchema>

const METRIC_OPTIONS = [
  { value: 'SCHEDULED_COUNT', label: 'Agendamentos' },
  { value: 'ACCEPTED_TREATMENT', label: 'Aceite de tratamento' },
  { value: 'CLOSED_DEALS', label: 'Fechamentos' },
  { value: 'AVG_TICKET', label: 'Ticket médio' },
]

function BonusConfigCard() {
  const [success, setSuccess] = useState(false)
  const form = useForm<BonusFormInput, unknown, BonusForm>({
    resolver: zodResolver(bonusSchema),
    defaultValues: {
      metricKey: '',
      bonusPct: undefined,
      periodRef: new Date().toISOString().slice(0, 7),
    },
  })

  async function onSubmit(data: BonusForm) {
    try {
      const dto: BonusConfigDTO = {
        sector: data.sector,
        role: data.role,
        metricKey: data.metricKey,
        bonusPct: data.bonusPct,
        targetValue: data.targetValue,
        periodRef: data.periodRef,
      }
      await configService.setBonusConfig(dto)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      form.setError('root', { message: 'Erro ao salvar configuração de bônus.' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Configuração de bônus</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Define a meta e o percentual de bônus por setor e perfil para um período de referência.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="sector" render={({ field }) => (
                <FormItem>
                  <FormLabel>Setor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(Sector).map((s) => (
                        <SelectItem key={s} value={s}>{SECTOR_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(Role).map((r) => (
                        <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="metricKey" render={({ field }) => (
              <FormItem>
                <FormLabel>Métrica de apuração</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecione a métrica" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {METRIC_OPTIONS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="bonusPct" render={({ field }) => (
                <FormItem>
                  <FormLabel>Percentual de bônus (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0.01} max={100} step={0.01} placeholder="Ex: 5" {...field} value={(field.value as string | number | undefined) ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="targetValue" render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ex: 100.000,00"
                      {...field}
                      value={field.value != null ? String(field.value) : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="periodRef" render={({ field }) => (
              <FormItem>
                <FormLabel>Período de referência</FormLabel>
                <FormControl>
                  <Input placeholder="AAAA-MM" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}
            {success && <p className="text-sm text-green-600">Bônus configurado com sucesso.</p>}

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Salvando...' : 'Salvar configuração'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// ─── Ads Investment ────────────────────────────────────────────────────────────

const adsSchema = z.object({
  channel: z.enum(Object.values(AdsChannel) as [AdsChannel, ...AdsChannel[]]),
  campaign: z.string().optional(),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  periodStart: z.string().min(1, 'Informe a data inicial'),
  periodEnd: z.string().min(1, 'Informe a data final'),
})
type AdsFormInput = z.input<typeof adsSchema>
type AdsForm = z.output<typeof adsSchema>

function AdsInvestmentCard() {
  const [success, setSuccess] = useState(false)
  const form = useForm<AdsFormInput, unknown, AdsForm>({
    resolver: zodResolver(adsSchema),
    defaultValues: { campaign: '', amount: undefined },
  })

  async function onSubmit(data: AdsForm) {
    try {
      const dto: AdsInvestmentDTO = {
        channel: data.channel,
        amount: data.amount,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        campaign: data.campaign || undefined,
      }
      await configService.registerAdsInvestment(dto)
      setSuccess(true)
      form.reset({ campaign: '', amount: undefined })
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      form.setError('root', { message: 'Erro ao registrar investimento.' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Investimento em Ads</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Registre o valor investido por canal e período para calcular o ROI de mídia paga.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="channel" render={({ field }) => (
                <FormItem>
                  <FormLabel>Canal</FormLabel>
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

              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor investido (R$)</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      placeholder="0,00"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value as number | undefined}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="campaign" render={({ field }) => (
              <FormItem>
                <FormLabel>Campanha (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Nome da campanha" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="periodStart" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data inicial</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="periodEnd" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data final</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}
            {success && <p className="text-sm text-green-600">Investimento registrado com sucesso.</p>}

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Registrando...' : 'Registrar investimento'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// ─── ConfigPage ────────────────────────────────────────────────────────────────

export default function ConfigPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Configurações</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecycleConfigCard />
        <AdsInvestmentCard />
      </div>
      <BonusConfigCard />
    </div>
  )
}
