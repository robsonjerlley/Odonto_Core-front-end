# ADR-Frontend-004 — Tela Installment: Gestão de parcelas

**Status:** Proposto (spec de UX pronta para implementação)
**Data:** 2026-06-30
**Autoria:** Carla (UI/UX Agent) + Robson
**Relaciona:** ADR-032 (backend `financeiro` — parcelas via 2ª escuta do DealWonEvent), ADR-030 (feed "Pagamentos pendentes" = status, não módulo).
**Master espelhada em:** `.claude/adr/ADR-034-ux-installment-gestao.md` (repo backend) — manter as duas em sincronia.

> ⚠️ **Contrato ancorado no código real** (`InstallmentController`, `InstallmentResponseDTO`, `PaymentStatus`, `PermissionSeeder` em 2026-06-30). **[IMPACTO BACKEND]** marca dependências que não existem. Não presumir.

> **Evolução da ADR-030:** lá o financeiro era "Won't-have" de tela completa — só chip pago/pendente no feed. Com a ADR-032 já implementada (parcelas reais + pay/unpay + cashflow), esta ADR promove o financeiro a **tela de gestão dedicada**. O chip no feed da home permanece; esta tela é o detalhe.

---

## 1. Problema de produto

A ADR-032 criou parcelas (`Installment`) no fechamento do Deal, com pagar/estornar e projeção de caixa. Esses dados não têm tela — hoje o dono controla recebimento numa planilha paralela. JTBD:

> *Quando reviso o financeiro, quero ver as parcelas do mês e quais estão atrasadas/pendentes, e marcar como pago quando recebo, para controlar o fluxo de caixa sem planilha paralela.*

Dispositivo primário: **desktop** (revisão financeira sentado). Mobile = consulta rápida ("recebi, marca pago").

## 2. Contrato de backend (fonte da verdade)

**Base:** `/api/v1/installments` · **Dinheiro:** `BigDecimal` → número JSON, BRL, 2 casas, `HALF_UP`. Nunca `float` no front.

### InstallmentResponseDTO
```ts
{
  id: string; dealId: string;
  customerId: string; customerName: string;      // nome pronto ✅
  sequence: number; totalInstallments: number;    // "Parcela 2/6"
  dueDate: string;            // "YYYY-MM-DD" (LocalDate)
  expectedAmount: number;     // valor esperado da parcela
  status: "EXPECTED" | "PAID";
  overdue: boolean;           // DERIVADO: vencida e ainda EXPECTED
  paidAmount: number | null;  // preenchido quando PAID
  paidAt: string | null;      // "YYYY-MM-DD"
}
```

### Endpoints
| Método | Path | Body | Resposta | Uso |
|---|---|---|---|---|
| GET | `?month=yyyy-MM&status={EXPECTED\|PAID}?` | — | `Page<Installment>` | lista do mês (status opcional) |
| GET | `?overdue=true` | — | `Page<Installment>` | atrasados **cross-month** (feed/chip global) — ver [I2] |
| GET | `?customerId={id}` | — | `Page<Installment>` | histórico do paciente (drawer) |
| GET | `/cashflow?from=yyyy-MM&to=yyyy-MM` | — | `CashflowMonthDTO[]` | faixa de KPIs / mini-gráfico |
| PATCH | `/{id}/pay` | `{paidAmount*, paidAt*}` | `Installment` | marcar pago |
| PATCH | `/{id}/unpay` | — | **200, sem corpo** | estornar |

> `month` e `overdue` são **mutuamente exclusivos** — enviar os dois retorna **400**. `?overdue=true` pagina e ordena por `dueDate ASC` (mais velha primeiro); a contagem global do chip = `page.totalElements`.

`CashflowMonthDTO = { month: "yyyy-MM", recebido: number, aReceber: number }`

### RBAC
`INSTALLMENT` só tem **READ/UPDATE**. ADM_SYSTEM: GLOBAL. ADM_COMMERCIAL: GLOBAL. USER_COMMERCIAL: SECTOR. **Clínica solo (ADM_SYSTEM) vê tudo.**

### ⚠️ Furos [IMPACTO BACKEND] — LER ANTES DE DESENHAR O FILTRO
- **[I1] "Atrasado" não é valor de enum, mas é filtrável.** `PaymentStatus` só tem `EXPECTED` e `PAID` — não existe `?status=OVERDUE`. Porém "atrasado" = `overdue` derivado (`EXPECTED AND dueDate < hoje`) **é** um predicado de query. **Dentro do mês:** faceta client-side (pedir `status=EXPECTED` e filtrar `overdue===true`) — as linhas do mês já estão na mão. **Cross-month:** vai ao servidor via `?overdue=true` (ver [I2]). O filtro de *status* segue Todos / A receber / Pago.
- **[I2] DECIDIDO (pendente implementação backend) — atrasados cross-month via `?overdue=true`.** A listagem geral segue por `?month=yyyy-MM` (tela mês-a-mês). Para o feed "Pagamentos pendentes" da home (atrasados globais, ADR-030 §4.5) e o chip "Só atrasados" global, usar `GET /installments?overdue=true` (todos os meses, paginado, `dueDate ASC`). `month`+`overdue` juntos = 400. Contagem do chip = `page.totalElements`.
- **[I3] FORA DO MVP — sem status parcial.** `/pay` grava `PAID` mesmo se `paidAmount < expectedAmount`. Não há estado "parcialmente pago". → Ver decisão §4 (MVP quita e avisa; suporte real é backend futuro).

## 3. Especificação da tela

### Estrutura
```
┌──────────────────────────────────────────────────────────────┐
│  Financeiro · Parcelas        ‹  Junho 2026  ›                │  ← navegador de mês
├──────────────────────────────────────────────────────────────┤
│  Recebido: R$ 4.200   ·   A receber: R$ 3.500   ·   ⚠️ Atrasado: R$ 900 │  ← KPI strip
├──────────────────────────────────────────────────────────────┤
│  [ Todos | A receber | Pago ]        ☐ Só atrasados          │  ← filtros
├──────────────────────────────────────────────────────────────┤
│  Paciente          Parcela   Vence      Valor     Status   Ação│
│  Maria Oliveira    2/6        05/06      R$ 300    ⚠️Atrasado [Marcar pago]│
│  João Pinto        3/6        20/06      R$ 500    A receber  [Marcar pago]│
│  Ana Souza         1/1        10/06      R$ 700    ✅ Pago    [Estornar]  │
└──────────────────────────────────────────────────────────────┘
```
- **KPI strip:** `Recebido` e `A receber` vêm do `/cashflow` (mês selecionado). `Atrasado` = soma client-side dos `overdue===true` (não há total server-side).
- **Filtro de status:** segmented `Todos / A receber / Pago` → mapeia para `status` ausente / `EXPECTED` / `PAID`.
- **Chip "Só atrasados":** filtro **client-side** sobre `overdue` (ver [I1]). Só faz sentido combinado com "A receber".
- **Navegador de mês:** default = mês atual. Troca → refetch `?month` + `/cashflow`.

### Componente `InstallmentRow`
```
Conteúdo: customerName · "Parcela {sequence}/{totalInstallments}" · dueDate · expectedAmount · status
Badge de status (com texto, nunca só cor):
  • EXPECTED + !overdue → "A receber" (neutro)
  • EXPECTED + overdue  → "Atrasado" (vermelho + ícone)   ← derivado no front
  • PAID                → "Pago" (verde) + "pago em {paidAt}"
Ação:
  • EXPECTED → [Marcar pago] → Sheet pagamento → PATCH /pay → linha vira Pago (otimista)
  • PAID     → [Estornar]    → confirm DESTRUTIVO → PATCH /unpay → volta a EXPECTED (refetch: 200 sem corpo)
Responsividade:
  < 768px: cartão empilhado (paciente + parcela em cima, valor+status, ação full-width)
  ≥ 768px: linha de tabela
A11y: ≥44×44px; contraste ≥4.5:1; status por texto; foco teclado; Enter=ação primária.
```

### Sheet "Marcar pago" ("digite uma vez")
```
Read-only:  Paciente · Parcela X/N · Vencimento · Valor esperado
Inputs:
  Valor recebido *   ← default = expectedAmount (editável)
  Data do pagamento* ← default = hoje
Aviso condicional:
  se Valor recebido < Valor esperado → "⚠️ Pagamento parcial marca a parcela como QUITADA
  (o sistema não guarda saldo parcial)."   ← ver [I3]
```
**Decisão pagamento parcial:** como o backend não tem estado parcial ([I3]), o MVP trata `/pay` como quitação. Se o valor for menor, **avisar explicitamente** que a parcela será marcada paga sem saldo residual. Suporte real a parcial = **[IMPACTO BACKEND]** futuro (status `PARTIAL` + saldo).

### Estorno = destrutivo
`Estornar` sempre pede confirmação ("Estornar o pagamento desta parcela? Ela volta para 'A receber'."). `/unpay` responde 200 sem corpo → refetch da linha/lista (update otimista: status→EXPECTED, limpa paidAmount/paidAt).

### Master-detail — histórico do paciente
Clicar no nome do paciente abre **drawer lateral** com `GET ?customerId` — todas as parcelas daquele paciente (todos os meses), pra ver o plano de pagamento completo. Reusa `InstallmentRow` em modo leitura.

### Fluxo de caixa (secundário)
Aba/segmento "Fluxo de caixa": mini-gráfico de barras `recebido` × `aReceber` por mês (`/cashflow?from&to`, default últimos 6 meses). **Manter simples** — esta é a única tela do produto que pode ter gráfico (a home não é dashboard, ADR-030); ainda assim, 1 gráfico, sem virar BI.

### Estados da tela
- **Mês sem parcelas:** "Nenhuma parcela vence em {mês}."
- **Carregando:** skeleton de 4 linhas + KPI em shimmer.
- **Pagando/Estornando:** botão → spinner; sucesso = toast + linha atualizada.
- **Erro:** card de erro por seção, não derruba o navegador de mês.

## 4. Decisões registradas
- Financeiro **promovido a tela de gestão** (evolui o "Won't-have" da ADR-030); chip no feed permanece.
- Filtro de status = Todos/A receber/Pago; "Atrasado" não é status, dentro do mês é faceta client-side sobre `overdue` ([I1]).
- Tela é **mês-a-mês** ([I2]); atrasados globais via `?overdue=true` cross-month (decidido).
- Pagamento parcial **fora do MVP** ([I3]): MVP quita e **avisa**; saldo parcial é impacto backend futuro.
- Estorno = destrutivo com confirmação. Histórico por paciente = drawer (`?customerId`). Cashflow = 1 gráfico simples.

## 5. Próximos passos
1. Backend: implementar `?overdue=true` (Specification + validação mútua com `month`) — habilita o feed da home e o chip "Só atrasados" global.
2. Implementar `InstallmentRow` + KPI strip + Sheet pagamento; drawer de histórico depois; cashflow por último.
