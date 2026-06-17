import { useMemo, useState } from 'react'
import { useConversion, useDropOff, useUserPerformance } from './analytics.queries'
import { MonthFilter } from './MonthFilter'
import { currentMonth, monthToPeriod, formatMonthLabel } from './period'
import { useAuthStore } from '@/store/auth.store'
import { SECTOR_LABELS } from '@/lib/labels'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function currency(v: number | null | undefined) {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function pct(v: number | null | undefined) {
  if (v == null) return '—'
  return `${Number(v).toFixed(1)}%`
}

/**
 * Analytics de SETOR — para os ADMs de setor (leads/evaluator/commercial).
 * O backend aplica o escopo SECTOR a partir do papel: `conversion` ignora o
 * param `sector` e usa o do usuário; `dropoff` devolve só o setor do usuário.
 * Mostra o funil de conversão e o drop-off do próprio setor + o desempenho
 * pessoal do ADM (métricas completas, sem a restrição N4 dos papéis USER).
 */
export default function SectorAnalyticsPage() {
  const user = useAuthStore((s) => s.user)
  const [month, setMonth] = useState(currentMonth)
  const period = useMemo(() => monthToPeriod(month), [month])

  const sector = user?.sector
  const userId = user?.id ?? ''

  const { data: conversion, isLoading: loadingConv } = useConversion(sector ?? '', period)
  const { data: dropOffList, isLoading: loadingDrop } = useDropOff(period)
  const { data: perf, isLoading: loadingPerf } = useUserPerformance(userId, period)

  // Em escopo SECTOR o backend devolve só o setor do usuário (array de 1 elemento).
  const dropOff = dropOffList?.find((d) => d.sector === sector) ?? dropOffList?.[0]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics do setor</h1>
          <p className="text-sm text-muted-foreground">
            Conversão, drop-off e seu desempenho no mês
            {sector ? ` · ${SECTOR_LABELS[sector]}` : ''}.
          </p>
        </div>
        <MonthFilter month={month} onApply={setMonth} />
      </div>

      {/* ── Conversão do setor ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Conversão do setor</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingConv && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!loadingConv && !conversion && (
            <p className="text-sm text-muted-foreground">Sem dados de conversão para o período.</p>
          )}
          {conversion && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Captados',      value: conversion.captureCount,     accent: 'text-sky-700 dark:text-sky-400' },
                  { label: 'Agendados',     value: conversion.scheduledCount,   accent: 'text-amber-700 dark:text-amber-400' },
                  { label: 'Com orçamento', value: conversion.dealCreatedCount, accent: 'text-teal-700 dark:text-teal-400' },
                  { label: 'Fechados',      value: conversion.closedCount,      accent: 'text-emerald-700 dark:text-emerald-400' },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className={`text-2xl font-bold ${item.accent}`}>{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="flex justify-between border rounded-md p-2">
                  <span className="text-muted-foreground">Leads → Agenda</span>
                  <span className="font-medium text-teal-700 dark:text-teal-400">{pct(conversion.leadsConversionPct)}</span>
                </div>
                <div className="flex justify-between border rounded-md p-2">
                  <span className="text-muted-foreground">Agenda → Orçamento</span>
                  <span className="font-medium text-teal-700 dark:text-teal-400">{pct(conversion.evaluationConversionPct)}</span>
                </div>
                <div className="flex justify-between border rounded-md p-2">
                  <span className="text-muted-foreground">Orçamento → Fechado</span>
                  <span className="font-medium text-teal-700 dark:text-teal-400">{pct(conversion.commercialConversionPct)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Drop-off do setor ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Drop-off do setor</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDrop && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!loadingDrop && !dropOff && (
            <p className="text-sm text-muted-foreground">Sem dados de drop-off para o período.</p>
          )}
          {dropOff && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Entradas', value: String(dropOff.entryCount),   accent: 'text-sky-700 dark:text-sky-400' },
                { label: 'Saídas',   value: String(dropOff.exitCount),    accent: '' },
                { label: 'Perdas',   value: String(dropOff.lossCount),    accent: 'text-destructive' },
                { label: 'Drop-off', value: pct(dropOff.dropOffPct),      accent: 'text-destructive' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-muted/40 p-3 text-center">
                  <p className={`text-2xl font-bold ${item.accent}`}>{item.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Meu desempenho (pessoal, métricas completas) ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Meu desempenho</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingPerf && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {perf && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Atribuídos',    value: String(perf.totalAssigned),       accent: '' },
                  { label: 'Convertidos',   value: String(perf.totalConverted),      accent: 'text-emerald-700 dark:text-emerald-400' },
                  { label: 'Conversão',     value: pct(perf.conversionPct),          accent: 'text-teal-700 dark:text-teal-400' },
                  { label: 'Ticket médio',  value: currency(perf.avgTicketValue),    accent: 'text-teal-700 dark:text-teal-400' },
                  { label: 'Caixa esperado',value: currency(perf.expectedCash),      accent: 'text-teal-700 dark:text-teal-400' },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-muted/40 p-3">
                    <p className={`text-lg font-bold ${item.accent}`}>{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center rounded-lg bg-muted/40 p-3 max-w-xs">
                <span className="text-sm text-muted-foreground">
                  Bônus de {formatMonthLabel(perf.bonusPeriodRef)}
                </span>
                <span className="font-bold text-lg text-emerald-700 dark:text-emerald-400">{currency(perf.calculatedBonus)}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
