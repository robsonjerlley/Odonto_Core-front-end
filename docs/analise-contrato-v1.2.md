# Análise de Divergências — Contrato v1.2 vs Frontend

**Data da análise:** 2026-06-08  
**Contrato analisado:** `frontend-integration-contract.md` v1.2 (2026-06-08)  
**Branch:** main  
**Revisão solicitada:** Arquiteto de Software ← **MARCAR PARA REVISÃO**

---

## Resultado Geral

O frontend está amplamente alinhado ao contrato v1.2. A maior parte das correções do backend (B1–B5) foi transparente ao frontend. Foram identificadas **2 divergências obrigatórias** e **3 decisões que requerem input do arquiteto**.

---

## 1. Divergências com Correção Obrigatória

### DIV-01 — `CUSTOMER:READ` ausente para roles comerciais

**Arquivo:** `src/lib/permissions.ts`  
**Correção do backend:** B1 — "CUSTOMER:READ:SECTOR adicionadas para ADM_COMMERCIAL e USER_COMMERCIAL"

**Situação atual (frontend):**
```ts
// permissions.ts — linha 79-89
[Role.ADM_COMMERCIAL]: [
  'DEAL:READ', 'DEAL:UPDATE', 'DEAL:CLOSE',
  'TICKET:READ', 'TICKET:UPDATE', 'TICKET:CLOSE',
  'CONTACT_LOG:READ',
  // ← CUSTOMER:READ AUSENTE
],
[Role.USER_COMMERCIAL]: [
  'DEAL:READ', 'DEAL:UPDATE', 'DEAL:CLOSE',
  'TICKET:READ', 'TICKET:UPDATE', 'TICKET:CLOSE',
  'CONTACT_LOG:READ',
  // ← CUSTOMER:READ AUSENTE
],
```

**O que o contrato exige (§8):**
```
ADM_COMMERCIAL  | CUSTOMER | READ | SECTOR
USER_COMMERCIAL | CUSTOMER | READ | SECTOR
```

**Impacto no frontend:**
- A rota `/customers` exige `CUSTOMER:READ` (ver `ROUTE_PERMISSION` em permissions.ts linha 129).
- Como os roles comerciais não têm `CUSTOMER:READ`, o item "Pacientes" some do menu para eles.
- O contrato §9 é explícito: *"ADM_COMMERCIAL / USER_COMMERCIAL — Telas visíveis: Negociações, Deals, Clientes (somente leitura do setor)"*.
- O backend já permite a leitura — o frontend apenas esconde a UI desnecessariamente.

**Correção:**
```ts
[Role.ADM_COMMERCIAL]: [
  'DEAL:READ', 'DEAL:UPDATE', 'DEAL:CLOSE',
  'TICKET:READ', 'TICKET:UPDATE', 'TICKET:CLOSE',
  'CUSTOMER:READ',  // ← adicionar
  'CONTACT_LOG:READ',
],
[Role.USER_COMMERCIAL]: [
  'DEAL:READ', 'DEAL:UPDATE', 'DEAL:CLOSE',
  'TICKET:READ', 'TICKET:UPDATE', 'TICKET:CLOSE',
  'CUSTOMER:READ',  // ← adicionar
  'CONTACT_LOG:READ',
],
```

---

### DIV-02 — Tipos `null` incorretos em `models.ts`

**Arquivo:** `src/types/models.ts`

Dois campos estão marcados como não-nulos no TypeScript, mas o contrato os define como nullable:

**a) `Customer.phone`**
```ts
// Atual (linha 44):
phone: string

// Contrato §6:
phone: string | null  // "NULL" (string) quando anonimizado; null em outros cenários
```

Nota: o runtime já trata corretamente (`CustomerListPage.tsx:40` e `TicketDetailSheet.tsx:311` verificam `phone === 'NULL'`). O problema é apenas de tipagem — TypeScript não impede acesso sem null-check.

**b) `DealHistory.fieldChanged`**
```ts
// Atual (linha 118):
fieldChanged: string

// Contrato §6 — DealHistory:
fieldChanged: string | null  // "Nullable" explícito
```

**Correção:**
```ts
// models.ts
interface Customer {
  // ...
  phone: string | null
  // ...
}

interface DealHistory {
  // ...
  fieldChanged: string | null
  // ...
}
```

---

## 2. Decisões para o Arquiteto

### DEC-01 — `CUSTOMER:READ` nos roles de avaliação (ADR pendente)

**⚠️ MARCAR PARA REVISÃO DO ARQUITETO**

**Situação atual (frontend):**
```ts
// permissions.ts — linha 65-77
[Role.ADM_EVALUATOR]: [
  'CUSTOMER:READ',  // ← presente
  'DEAL:CREATE', 'DEAL:READ', 'DEAL:UPDATE',
  'TICKET:READ', 'TICKET:UPDATE',
  'CONTACT_LOG:READ',
],
[Role.USER_EVALUATOR]: [
  'CUSTOMER:READ',  // ← presente
  'DEAL:CREATE', 'DEAL:READ', 'DEAL:UPDATE',
  'TICKET:READ', 'TICKET:UPDATE',
  'CONTACT_LOG:READ',
],
```

**O que o contrato §8 diz:**
```
ADM_EVALUATOR | DEAL | CREATE, READ, UPDATE | SECTOR
ADM_EVALUATOR | TICKET | READ, UPDATE | SECTOR
ADM_EVALUATOR | CONTACT_LOG | READ | SECTOR
USER_EVALUATOR | DEAL | CREATE, READ, UPDATE | OWN
USER_EVALUATOR | TICKET | READ, UPDATE | OWN
USER_EVALUATOR | CONTACT_LOG | READ | GLOBAL
```
→ **Nenhuma linha de `CUSTOMER` para avaliadores no §8.**

**O problema:**
- O frontend concede `CUSTOMER:READ` a avaliadores, o que faz o item "Pacientes" aparecer no menu para eles.
- Chamar `GET /customers` como avaliador resultará em **403** (o backend não tem essa regra semeada).
- Contudo, para criar um deal em `EvaluationsPage`, o avaliador precisa ver dados do cliente (nome, CPF). Esses dados chegam hoje via `LeadTicket.customerId` + chamada de customer.

**Opções — decisão do arquiteto:**
1. **Remover `CUSTOMER:READ` do frontend para avaliadores** → hide o menu "Pacientes", exibir dados do cliente apenas dentro do contexto do ticket (pelo `customerId`). O backend 403 fica como proteção. Exige que a `EvaluationsPage` carregue o customer por `id` (não via listagem).
2. **Adicionar `CUSTOMER:READ` no backend para avaliadores** → seed `CUSTOMER:READ:SECTOR` para `ADM_EVALUATOR` e `USER_EVALUATOR`. Faz sentido se avaliadores precisam buscar histórico de outros tickets do paciente.
3. **Manter o status quo (risco aceito)** → UI mostra "Pacientes" mas a tela retorna 403, gerando confusão ao usuário.

---

### DEC-02 — `scheduledAt` em transição `IN_CONTACT → SCHEDULED`

**⚠️ MARCAR PARA REVISÃO DO ARQUITETO**

**Situação no frontend (`TicketDetailSheet.tsx` linha 380):**
```ts
// Para qualquer transição → SCHEDULED:
markStatus(activeForm, { returnScheduledAt: scheduleDate })
```

**O que o contrato §10 diz:**

| Transição | Efeito no ticket |
|-----------|------------------|
| `POST_PROCEDURE → SCHEDULED` | `scheduledAt = returnScheduledAt` |
| `IN_CONTACT → SCHEDULED` | — (sem entrada explícita em efeitos colaterais) |

O campo `returnScheduledAt` é definido como obrigatório **apenas** para `POST_PROCEDURE → SCHEDULED`. Para `IN_CONTACT → SCHEDULED`, o contrato não documenta como `scheduledAt` do ticket é preenchido.

**O problema:**
- O frontend coleta uma data/hora e envia como `returnScheduledAt` para AMBAS as transições.
- Se o backend não mapeia `returnScheduledAt` para `scheduledAt` em `IN_CONTACT → SCHEDULED`, o campo `ticket.scheduledAt` nunca é preenchido para a consulta inicial — apenas para o retorno pós-procedimento.

**Verificação necessária:** Ler `LeadTicketServiceImpl.changeStatus()` no backend para confirmar se `scheduledAt` é atualizado em `IN_CONTACT → SCHEDULED` via `returnScheduledAt` ou via outro mecanismo.

**Se `scheduledAt` NÃO é atualizado:** a data da consulta inicial fica null no ticket, e `TicketDetailSheet.tsx` linha 291 (`{ticket.scheduledAt && ...}`) nunca exibe a data agendada. Impacto UX relevante.

---

### DEC-03 — Discriminador de logs automáticos vs manuais na timeline

**Prioridade: baixa — decidir antes da próxima sprint de timeline**

**Situação atual (`TicketDetailSheet.tsx` linha 473):**
```ts
const isAutoStatusNote = /^status changed:/i.test(log.note ?? '')
```

**O que o contrato §12 especifica:**
```
Log manual  → statusBefore = null, statusAfter = null
Log auto    → statusBefore != null, statusAfter != null, channel = OTHER
```

**O problema:** a regex cobre os logs genéricos "Status changed: X → Y" mas falha para logs automáticos com notas específicas:
- `WIN → POST_PROCEDURE`: note = "Procedimento realizado. Início do acompanhamento pós-procedimento." → `isAutoStatusNote = false` → nota exibida (OK — contexto útil)
- `POST_PROCEDURE → SCHEDULED`: note = "Retorno agendado para {data}." → `isAutoStatusNote = false` → nota exibida (OK)
- `POST_PROCEDURE → LOSS`: note = `lossReason` → `isAutoStatusNote = false` → nota exibida (OK)

Na prática o comportamento atual é aceitável — a regex apenas esconde o ruído puro de "Status changed". Os logs com contexto real (Procedimento realizado, Retorno agendado, motivo de perda) são sempre exibidos.

**Risco:** se o backend mudar o formato das notas automáticas, a regex quebrará silenciosamente.

**Opção mais robusta (contrato §12):**
```ts
const isManualLog = log.statusBefore == null && log.statusAfter == null
// Mostrar nota apenas se for log manual
{isManualLog && <p className="text-sm mt-1">{log.note}</p>}
```

**Trade-off UX:** com o discriminador correto, as notas contextuais dos logs automáticos (Procedimento realizado, Retorno agendado) NÃO seriam exibidas como texto — apenas o badge de transição apareceria. Isso pode ser bom (menos ruído) ou ruim (perde contexto). Decisão de design.

---

## 3. Verificado — Sem Alteração Necessária

| Item | Status |
|------|--------|
| Enums (`enums.ts`) — todos os valores conferem com §5 | ✅ |
| `PaymentMethod` com `DENTAL_INSURANCE` e `PAYMENT_METHOD_CONVERSION_FACTOR` | ✅ |
| Máquina de estados (`transitions.ts`) — espelho exato de §10 | ✅ |
| `TRANSITION_ROLES` — WIN/LOSS/POST_PROCEDURE corretos | ✅ |
| Endpoints de deals (`/api/v1/deals` plural, `/discount`, `/status`) | ✅ |
| `UserPerformanceResultDTO.expectedCash` — campo presente em `models.ts` | ✅ |
| `GlobalDashBoardResultDTO.totalExpectedCash` — campo presente | ✅ |
| Refresh token com promise compartilhada (`lib/api/index.ts`) | ✅ |
| `BonusResultDTO { value: number }` — shape correto | ✅ |
| `anonymized` — verificado via flag (não via nome string) em `CustomerListPage.tsx` | ✅ |
| `phone === 'NULL'` — tratado corretamente em `CustomerListPage.tsx` e `TicketDetailSheet.tsx` | ✅ |
| `lossReason` — obrigatório em `POST_PROCEDURE → LOSS` (TicketDetailSheet.tsx linha 408) | ✅ |
| `returnScheduledAt` enviado em `POST_PROCEDURE → SCHEDULED` | ✅ |
| CPF obrigatório antes de `→ SCHEDULED` — coletado inline em `TicketDetailSheet.tsx` | ✅ |
| `ADR-013` — filtros cumulativos: frontend usa parâmetros isolados (sem conflito) | ✅ |
| B2 (`applyDiscount` usa `DEAL:UPDATE`) — já correto no frontend | ✅ |
| B3 (`USER_COMMERCIAL DEAL:UPDATE` scope SECTOR) — mudança transparente, backend enforce | ✅ |
| B4 (`getUserPerformance` OWN fix) — chamada `analytics/user-performance/{id}` já correta | ✅ |
| B5 (`phone2` em PATCH) — frontend já enviava `phone2`; backend fix é transparente | ✅ |
| Timezone — `nowBrasiliaISO` em `lib/utils.ts`; exibição naïve sem conversão UTC | ✅ |
| Anonimização — botão "Anonimizar" visível apenas para `CUSTOMER:DELETE` | ✅ |

---

## 4. Resumo de Ações

### Implementar imediatamente (sem decisão pendente)

| # | Arquivo | Mudança |
|---|---------|---------|
| DIV-01 | `src/lib/permissions.ts` | Adicionar `'CUSTOMER:READ'` para `ADM_COMMERCIAL` e `USER_COMMERCIAL` |
| DIV-02a | `src/types/models.ts` | `Customer.phone: string → string \| null` |
| DIV-02b | `src/types/models.ts` | `DealHistory.fieldChanged: string → string \| null` |

### Aguardar decisão do arquiteto

| # | Decisão | Impacto |
|---|---------|---------|
| DEC-01 | `CUSTOMER:READ` para avaliadores — manter, remover ou adicionar no backend | Menu "Pacientes" para avaliadores; possíveis 403 em produção |
| DEC-02 | `scheduledAt` em `IN_CONTACT → SCHEDULED` — verificar backend | Data da consulta inicial pode não ser persistida |
| DEC-03 | Discriminador de logs automáticos — regex vs `statusBefore/statusAfter` | UX da timeline de contatos |

---

*Gerado em 2026-06-08 por análise direta do contrato v1.2 e código-fonte frontend.*
