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

### DEC-01 — `CUSTOMER:READ` nos roles de avaliação ✅ RESOLVIDO

**Resolução (2026-06-08):** leitura do `PermissionSeeder.java` confirmou que o backend **já tem** `CUSTOMER:READ` para avaliadores:
- `ADM_EVALUATOR | CUSTOMER | READ | SECTOR` (linha 122)
- `USER_EVALUATOR | CUSTOMER | READ | GLOBAL` (linha 135)

O contrato §8 estava incompleto — não listava essas linhas. O frontend estava correto ao conceder `CUSTOMER:READ` para os dois roles. **Nenhuma alteração necessária no frontend ou no backend.**

A nota do contrato §8 sobre escopos divergentes (USER_EVALUATOR com GLOBAL, não OWN) não afeta o frontend — o scope é aplicado e enforçado exclusivamente pelo backend.

---

### DEC-02 — `scheduledAt` em transição `IN_CONTACT → SCHEDULED` ✅ RESOLVIDO

**Resolução (2026-06-08):** leitura de `LeadTicketServiceImpl.changeStatus()` (linhas 191-200) confirmou o comportamento:

```java
if (dto.status() == SCHEDULED && currentStatus != POST_PROCEDURE) {
    leadTicket.setCurrentSector(EVALUATOR);
    if (dto.returnScheduledAt() != null) {
        leadTicket.setScheduledAt(dto.returnScheduledAt());  // ← usa o campo
    }
}
```

O backend **usa `returnScheduledAt` para setar `scheduledAt`** em `IN_CONTACT → SCHEDULED` (e qualquer outra origem → SCHEDULED exceto POST_PROCEDURE, que tem caminho próprio via `applyScheduledReturn`). O frontend já enviava o campo corretamente. **Nenhuma alteração necessária.**

O contrato §10 estava incompleto — não documentava este efeito colateral para transições que não partem de POST_PROCEDURE.

---

### DEC-03 — Discriminador de logs automáticos vs manuais na timeline ✅ RESOLVIDO

**Resolução (commit `856e4a0`, 2026-06-08):** discriminador corrigido em `TicketDetailSheet.tsx`:

```ts
// Antes (regex frágil — não cobre todos os logs automáticos):
const isAutoStatusNote = /^status changed:/i.test(log.note ?? '')

// Depois (discriminador do contrato §12):
const isAutoLog = log.statusBefore != null && log.statusAfter != null
const isGenericNote = /^status changed:/i.test(log.note ?? '')
const showNote = !isAutoLog || !isGenericNote
```

**Decisão de design adotada:** notas genéricas "Status changed: X → Y" são ocultadas (redundantes com o badge de transição). Notas contextuais de logs automáticos — `lossReason` em `POST_PROCEDURE → LOSS`, "Procedimento realizado" em `WIN → POST_PROCEDURE`, "Retorno agendado para…" em `POST_PROCEDURE → SCHEDULED` — continuam visíveis por agregar contexto útil ao usuário.

Esta abordagem segue o discriminador do contrato §12 (`statusBefore/statusAfter`) e é mais robusta que a regex original, que falharia silenciosamente se o backend alterasse o formato das notas automáticas.

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

### Decisões investigadas e encerradas

| # | Decisão | Resolução |
|---|---------|-----------|
| DEC-01 | `CUSTOMER:READ` para avaliadores | ✅ Backend já tinha — `PermissionSeeder.java` linhas 122/135. Frontend correto. |
| DEC-02 | `scheduledAt` em `IN_CONTACT → SCHEDULED` | ✅ Backend usa `returnScheduledAt` para setar `scheduledAt` — `LeadTicketServiceImpl.java` linhas 195-199. Frontend correto. |
| DEC-03 | Discriminador de logs automáticos | ✅ Corrigido em `TicketDetailSheet.tsx` (commit `856e4a0`). |

---

*Gerado em 2026-06-08 — todas as divergências e decisões encerradas em 2026-06-08.*
