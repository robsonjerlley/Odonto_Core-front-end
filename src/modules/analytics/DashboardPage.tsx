import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { useDashboard, useConversion, useUserPerformance } from './analytics.queries'
import { MonthFilter } from './MonthFilter'
import { currentMonth, monthToPeriod, formatMonthLabel } from './period'
import { SECTOR_LABELS, ADS_CHANNEL_LABELS } from '@/lib/labels'
import { Sector } from '@/types/enums'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { UserPerformanceResultDTO, PostProcedureResultDTO } from '@/types/models'
import type { AnalyticsPeriod } from './analytics.service'

// ─── paleta dos gráficos (alinhada aos tokens de marca) ───────────────────────
const CHART = {
  brand: '#0d9488',   // teal — receita / positivo
  neutral: '#94a3b8', // slate — investimento / base
  danger: '#f43f5e',  // rose — drop-off / perdas
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function currency(v: number | null | undefined) {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function pct(v: number | null | undefined) {
  if (v == null) return '—'
  return `${Number(v).toFixed(1)}%`
}

// ─── ROI chart ────────────────────────────────────────────────────────────────

function AdsRoiChart({ data }: { data: { channel: string; totalInvestment: number; totalRevenue: number; roiMultiplier: number }[] }) {
  const chartData = data.map((d) => ({
    canal: ADS_CHANNEL_LABELS[d.channel as keyof typeof ADS_CHANNEL_LABELS] ?? d.channel,
    Investimento: Number(d.totalInvestment),
    Receita: Number(d.totalRevenue),
    roi: Number(d.roiMultiplier).toFixed(2),
  }))

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Sem dados de ROI para o período.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="canal" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value, name) => [currency(Number(value)), name]}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Investimento" fill={CHART.neutral} radius={[4, 4, 0, 0]} />
        <Bar dataKey="Receita" fill={CHART.brand} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Drop-off chart ───────────────────────────────────────────────────────────

function DropOffChart({ data }: { data: { sector: string; dropOffPct: number; entryCount: number; lossCount: number }[] }) {
  const chartData = data.map((d) => ({
    setor: SECTOR_LABELS[d.sector as keyof typeof SECTOR_LABELS] ?? d.sector,
    'Drop-off (%)': Number(d.dropOffPct),
    Perdas: d.lossCount,
  }))

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Sem dados de drop-off para o período.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="setor" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
        <Tooltip contentStyle={{ fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Drop-off (%)" fill={CHART.danger} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Stage conversion card ────────────────────────────────────────────────────

function ConversionCard({ period }: { period: AnalyticsPeriod }) {
  const [sector, setSector] = useState<Sector | ''>('')
  const { data, isLoading } = useConversion(sector, period)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">Conversão por setor</CardTitle>
          <Select value={sector} onValueChange={(v) => setSector(v as Sector)}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue placeholder="Selecione o setor" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(Sector).map((s) => (
                <SelectItem key={s} value={s}>{SECTOR_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {!sector && (
          <p className="text-sm text-muted-foreground">Selecione um setor para ver os dados.</p>
        )}
        {sector && isLoading && (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        )}
        {data && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Captados', value: data.captureCount },
                { label: 'Agendados', value: data.scheduledCount },
                { label: 'Com orçamento', value: data.dealCreatedCount },
                { label: 'Fechados', value: data.closedCount },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-muted/40 p-3 text-center">
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="flex justify-between border rounded-md p-2">
                <span className="text-muted-foreground">Leads → Agenda</span>
                <span className="font-medium">{pct(data.leadsConversionPct)}</span>
              </div>
              <div className="flex justify-between border rounded-md p-2">
                <span className="text-muted-foreground">Agenda → Orçamento</span>
                <span className="font-medium">{pct(data.evaluationConversionPct)}</span>
              </div>
              <div className="flex justify-between border rounded-md p-2">
                <span className="text-muted-foreground">Orçamento → Fechado</span>
                <span className="font-medium">{pct(data.commercialConversionPct)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── User performance sheet (inline dialog) ───────────────────────────────────

interface UserPerformanceDetailProps {
  performer: UserPerformanceResultDTO
  period: AnalyticsPeriod
  onClose: () => void
}

function UserPerformanceDetail({ performer, period, onClose }: UserPerformanceDetailProps) {
  const { data: perf } = useUserPerformance(performer.userId, period)

  const data = perf ?? performer

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-md space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">{data.name}</h2>
            <p className="text-sm text-muted-foreground">{SECTOR_LABELS[data.sector]}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Atribuídos', value: data.totalAssigned },
            { label: 'Convertidos', value: data.totalConverted },
            { label: 'Conversão', value: pct(data.conversionPct) },
            { label: 'Ticket médio', value: currency(data.avgTicketValue) },
            { label: 'Caixa esperado', value: currency(data.expectedCash) },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-muted/40 p-3">
              <p className="text-lg font-bold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="border-t pt-3 space-y-2">
          <p className="text-sm font-medium">Cálculo de bônus</p>
          <div className="flex justify-between items-center rounded-lg bg-muted/40 p-3">
            <span className="text-sm text-muted-foreground">
              Bônus de {formatMonthLabel(data.bonusPeriodRef)}
            </span>
            <span className="font-bold text-lg">{currency(data.calculatedBonus)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Top performers table ─────────────────────────────────────────────────────

function TopPerformersTable({
  performers,
  period,
}: {
  performers: UserPerformanceResultDTO[]
  period: AnalyticsPeriod
}) {
  const [selected, setSelected] = useState<UserPerformanceResultDTO | null>(null)

  if (performers.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados de performance para o período.</p>
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Nome</th>
              <th className="text-left p-3 font-medium">Setor</th>
              <th className="text-right p-3 font-medium">Atribuídos</th>
              <th className="text-right p-3 font-medium">Convertidos</th>
              <th className="text-right p-3 font-medium">Conversão</th>
              <th className="text-right p-3 font-medium">Ticket médio</th>
              <th className="text-right p-3 font-medium">Caixa esperado</th>
              <th className="p-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {performers.map((p) => (
              <tr key={p.userId} className="border-t hover:bg-muted/20 transition-colors">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">
                  <Badge variant="outline">{SECTOR_LABELS[p.sector]}</Badge>
                </td>
                <td className="p-3 text-right">{p.totalAssigned}</td>
                <td className="p-3 text-right">{p.totalConverted}</td>
                <td className="p-3 text-right font-medium">{pct(p.conversionPct)}</td>
                <td className="p-3 text-right">{currency(p.avgTicketValue)}</td>
                <td className="p-3 text-right">{currency(p.expectedCash)}</td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setSelected(p)}>
                    Ver detalhes
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <UserPerformanceDetail
          performer={selected}
          period={period}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight mt-1">{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Post-procedure card ──────────────────────────────────────────────────────

function PostProcedureCard({ data }: { data: PostProcedureResultDTO }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Acompanhamento pós-procedimento</CardTitle>
      </CardHeader>
      <CardContent>
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total', value: String(data.totalPostProcedure) },
              { label: 'Retornaram', value: String(data.returnedCount) },
              { label: 'Em aberto', value: String(data.pendingCount) },
              { label: 'Perdidos', value: String(data.lostCount) },
              { label: 'Taxa de retorno', value: pct(data.returnRate) },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-muted/40 p-3 text-center">
                <p className="text-xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main DashboardPage ───────────────────────────────────────────────────────

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth)
  const period = useMemo(() => monthToPeriod(month), [month])
  const { data: dashboard, isLoading } = useDashboard(period)
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Métricas de captação, conversão e performance do mês.
          </p>
        </div>
        <MonthFilter month={month} onApply={setMonth} />
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Carregando dados...</p>
      )}

      {dashboard && (
        <>
          {/* KPIs do período */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Caixa esperado"
              value={currency(dashboard.totalExpectedCash)}
              hint="Receita líquida estimada (após taxas)"
            />
            <KpiCard
              label="Fechamentos"
              value={String(dashboard.stageConversion?.closedCount ?? 0)}
              hint="Negócios ganhos no período"
            />
            <KpiCard
              label="Captados"
              value={String(dashboard.stageConversion?.captureCount ?? 0)}
              hint="Leads que entraram no funil"
            />
            <KpiCard
              label="Canais de Ads"
              value={String(dashboard.adsRoi?.length ?? 0)}
              hint="Canais com investimento no período"
            />
          </div>

          {/* ROI e Drop-off lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">ROI por canal de Ads</CardTitle>
              </CardHeader>
              <CardContent>
                <AdsRoiChart data={dashboard.adsRoi} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Drop-off por setor</CardTitle>
              </CardHeader>
              <CardContent>
                <DropOffChart data={dashboard.sectorDropOff} />
              </CardContent>
            </Card>
          </div>

          {/* Conversão */}
          <ConversionCard period={period} />

          {/* Pós-procedimento */}
          <PostProcedureCard data={dashboard.postProcedures} />

          {/* Top performers */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ranking de performance</CardTitle>
            </CardHeader>
            <CardContent>
              <TopPerformersTable performers={dashboard.topPerformers} period={period} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
