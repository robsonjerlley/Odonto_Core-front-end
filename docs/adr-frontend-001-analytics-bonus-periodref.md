# ADR-FE-001: Remoção do controle `periodRef` e exibição honesta do bônus mensal

**Status**: Aceito
**Data**: 2026-06-14
**Autor**: Arquiteto de Software
**Contexto do sprint**: Item A da migração analytics v1.4 (`docs/handoff-analytics-v1.4.md`)
**Relacionado**: ADR-015 (backend, contrato v1.4 §13/§15 E2)

---

## Contexto

A v1.4 removeu o endpoint `GET /analytics/bonus/{id}?periodRef=YYYY-MM`. O bônus agora chega dentro de
`UserPerformanceResultDTO.calculatedBonus`, retornado por `GET /analytics/user-performance/{id}`.

A leitura do backend (`AnalyticsServiceImpl.getUserPerformance`, linhas 252-253 e
`getCalculatedBonus`, 314-334) revelou a **semântica real** do cálculo:

```java
String periodRef = period.from().format("yyyy-MM");          // mês derivado do FROM
var yearMonth = YearMonth.parse(periodRef);
var period = new DataRangeDTO(yearMonth.atDay(1), yearMonth.atEndOfMonth()); // mês INTEIRO
long metricValue = resolveMetric(targetUser, period);
calculated = metricValue × bonusConfig.bonusPct / 100;
```

Consequências da implementação:
1. O bônus é calculado sobre o **mês-calendário inteiro do `from`** — o `to` é **ignorado**.
2. O usuário **não escolhe mais o mês de bônus de forma independente**: ele é derivado do `from` do
   range de datas.
3. As demais métricas do mesmo DTO (`totalAssigned`, `conversionPct`, `expectedCash`) usam o range
   **exato** `from..to`.

Hoje o frontend (`MyPerformancePage.tsx:61,65,112-121` e `DashboardPage.tsx:215-216,254-259`) tem um
input de texto `periodRef` (AAAA-MM) que alimentava o endpoint removido.

## Problema

- Manter o input `periodRef` cria um **controle "fantasma"**: o usuário digita um mês, mas o backend o
  ignora (deriva do `from`). Controle que não faz nada é pior que ausência — gera confusão e bug
  reports falsos.
- Há um **vazamento de semântica**: no mesmo card, "Caixa esperado" reflete o range `from..to`, mas
  "Bônus" reflete o **mês inteiro do `from`**. Sem rótulo explícito, o usuário lê os dois como se
  fossem do mesmo período.

## Decisão

1. **Remover o controle `periodRef`** (input AAAA-MM e o estado `useState`) de `MyPerformancePage` e
   de `UserPerformanceDetail` (DashboardPage). O período passa a ser **exclusivamente** o range
   `from..to` já existente.
2. **Exibir o bônus com rótulo honesto** que deixe explícita a janela mensal derivada do `from`.
   Ex.: em vez de "Bônus do período", usar **"Bônus de {from formatado como MMM/yyyy}"**
   (ex.: "Bônus de jun/2026"). O número continua vindo de `calculatedBonus`.
3. **Não** reintroduzir lógica de mês no frontend — a fonte da verdade do período de bônus é o backend
   (mês do `from`).

## Consequências positivas

- UI fiel ao backend: nenhum controle que não produz efeito.
- Menos estado para manter (`periodRef`, setter, validação de padrão `\d{4}-\d{2}` somem).
- O rótulo honesto previne interpretação errada da janela do bônus.

## Consequências negativas / riscos

- ⚠️ O usuário **perde a capacidade de consultar o bônus de um mês arbitrário** sem mexer no `from` do
  range. Mitigação: como o bônus é mensal, basta posicionar o `from` no mês desejado. Aceitável para o
  MVP.
- ⚠️ Mantém-se o vazamento de semântica de fundo (bônus mensal vs. métricas por range). O frontend o
  **mascara com rótulo**, mas não o resolve. Ver "Pendência para o backend" abaixo.

## Pendência levantada para o backend (fora do escopo do frontend)

> 📌 **A registrar com o time backend:** é intencional que `calculatedBonus` use o mês inteiro do
> `from` enquanto as outras métricas usam o range exato? Duas correções possíveis no backend, se for
> considerado inconsistente:
> (a) calcular o bônus sobre o mesmo range `from..to`; ou
> (b) reintroduzir `periodRef` como parâmetro explícito do `user-performance`.
> Enquanto não houver decisão, o frontend segue esta ADR (rótulo honesto sobre o mês do `from`).

## Alternativas consideradas

- **Manter o input `periodRef`**: descartada — vira "lying UI" (controle ignorado pelo backend),
  gerando bug reports falsos e dívida de estado morto.
- **Recoplar o input ao mês do `from` (somente leitura)**: descartada — adiciona complexidade de UI
  para exibir uma informação que o rótulo do bônus já comunica de forma mais simples.

## Impacto em arquivos (para o sprint)

| Arquivo | Mudança |
|---|---|
| `src/modules/analytics/MyPerformancePage.tsx` | Remover `periodRef` (linha 61), `useBonus` (65), input (112-121); bônus = `perf.calculatedBonus`; rótulo "Bônus de {from}" |
| `src/modules/analytics/DashboardPage.tsx` | Remover `periodRef` (215) e `useBonus` (216) de `UserPerformanceDetail`; bônus = `perf.calculatedBonus`; remover input (254-259) |
| `src/modules/analytics/analytics.service.ts` / `analytics.queries.ts` | Remover `getBonus` / `useBonus` (já previsto no Item A) |
