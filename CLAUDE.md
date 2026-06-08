# OdontoCore CRM — Frontend

## Contexto do projeto

CRM odontológico desenvolvido para clínicas. Rastreia o ciclo completo do cliente: contato inicial → funil de leads → avaliação → negociação → fechamento. O projeto é um **MVP com destino a produção**.

**Backend:** `B:\projects\odontocore.crm\odontocore.crm` — Spring Boot 4.0.5, Java 21, PostgreSQL. Roda localmente. Leia os fontes antes de começar qualquer módulo se precisar de detalhes.

---

## Stack atual e planejada

| Camada | Tecnologia |
|---|---|
| Build | Vite 8 |
| Framework | React 19 + TypeScript 6 strict |
| Estilização | Tailwind CSS + shadcn/ui |
| Server State | TanStack Query v5 |
| Client State | Zustand |
| Formulários | React Hook Form + Zod |
| HTTP | Axios |
| Roteamento | React Router v6 |

> **Não usar Next.js.** O projeto foi iniciado com Vite e SPA pura. Manter essa decisão.

---

## Domínio — Roles e Sectors

```ts
enum Role {
  ADM_SYSTEM, ADM_LEADS, USER_LEADS, USER_ATTENDANT,
  ADM_EVALUATOR, USER_EVALUATOR, ADM_COMMERCIAL, USER_COMMERCIAL
}

enum Sector {
  LEADS, ATTENDANT, EVALUATOR, COMMERCIAL, ADM, MANAGER
}
```

**Hierarquia de acesso:**
- `ADM_SYSTEM` — acesso total, gestão de usuários, métricas globais, configurações
- `ADM_LEADS / USER_LEADS` — funil de leads, tickets, logs de contato
- `USER_ATTENDANT` — cadastro de clientes, tickets
- `ADM_EVALUATOR / USER_EVALUATOR` — avaliação, orçamento
- `ADM_COMMERCIAL / USER_COMMERCIAL` — negociação, fechamento de deal, edição de orçamento

---

## Enums do backend

```ts
enum TicketStatus {
  NEW, IN_CONTACT, SCHEDULED, IN_EVALUATION,
  NEGOTIATION, WIN, PENDING, RECYCLED, LOSS,
  POST_PROCEDURE  // ← adicionado após análise do backend (2026-06-02)
}

enum AdsChannel   { GOOGLE, META, INSTAGRAM, TIKTOK, OUTER }
enum ContactChannel { ORGANIC, REFERRAL, FACEBOOK, INSTAGRAM, WHATSAPP, PHONE_CALL, WEBSITE_FROM, OTHER }
enum CustomerSource { ADS_PAID, ORGANIC, INDICATION }
```

---

## API — Endpoints completos

> **⚠ FONTE DA VERDADE:** o contrato oficial de integração está em
> `B:\projects\odontocore.crm.frontend\frontend-integration-contract.md`
> (v1.2, 2026-06-08). Ele descreve endpoints, DTOs, enums, modelo de erro, RBAC,
> máquina de estados, paginação `Page<T>`, refresh token e traz um apêndice
> TypeScript pronto. O bloco abaixo é histórico e **defasado** — em caso
> de divergência, **o contrato vence**. O frontend foi alinhado ao v1.2 em 2026-06-08.
> Análise completa de divergências em `docs/analise-contrato-v1.2.md`.

**Base URL:** `http://localhost:8080` (dev local)

### Auth
```
POST  /api/v1/authentication/login
      body: { username, password }
      response: { token, ... }   ← JWT
```

### Identity — Usuários
```
POST   /api/v1/users/create
       body: { name, username, passwordHash, sector, role }
GET    /api/v1/users
GET    /api/v1/users/findByUsername/{username}
GET    /api/v1/users/findBySector/{sector}
GET    /api/v1/users/findBySectorAndRole/{sector}/{role}
GET    /api/v1/users/existsByUsername/{username}
PATCH  /api/v1/users/updatePassword/{username}/passwordHash
       body: { username, oldPassword, newPasswordHash }
       ⚠ o backend usa apenas newPasswordHash; oldPassword é validado mas ignorado no service
DELETE /api/v1/users/{id}
```

### Funnel — Clientes
```
POST   /api/v1/customers
GET    /api/v1/customers
GET    /api/v1/customers/{id}
GET    /api/v1/customers/cpf/{cpf}
GET    /api/v1/customers/username/{username}
PATCH  /api/v1/customers/{id}
DELETE /api/v1/customers/{id}
```

### Funnel — Tickets
```
POST   /api/v1/tickets
GET    /api/v1/tickets
GET    /api/v1/tickets/{id}
GET    /api/v1/tickets/findByCustomer/{customerId}
GET    /api/v1/tickets/ticketStatus/{status}
GET    /api/v1/tickets/assignedToUser/{userId}
PATCH  /api/v1/tickets/{id}/status     body: { status: TicketStatus }
DELETE /api/v1/tickets/{id}
```

### Funnel — Logs de contato
```
POST   /api/v1/contact-logs
       body: { ticketId: UUID, channel: ContactChannel, note, occurredAt: LocalDateTime }
GET    /api/v1/contact-logs
GET    /api/v1/contact-logs/{id}
GET    /api/v1/contact-logs/findByTicketId/{ticketId}
DELETE /api/v1/contact-logs/{id}
```

### Commercial — Deal
```
POST   /api/v1/deal/{ticketId}
       body: { procedures: DealProcedureDTO[] }
GET    /api/v1/deal/findByTicket/{ticketId}
       → 200 + DealResponseDTO  (deal ativo encontrado)
       → 204 No Content         (ticket ainda não tem deal)
PATCH  /api/v1/deal/{id}
       body: { procedures: DealProcedureDTO[] }
PATCH  /api/v1/deal/{id}/discount
       body: { discountPct: BigDecimal }
PATCH  /api/v1/deal/{id}/closeDeal
       body: { paymentMethod: string }
GET    /api/v1/deal/{id}/dealHistory     → DealDetailResponseDTO { deal, history[] }
```

`DealProcedureDTO` = `{ name, code?, tableValue: BigDecimal, quantity: int, note? }`

### Commercial — Config (ADM_SYSTEM)
```
POST   /api/v1/config/recycle
       body: { sector: Sector, afterDays: int }
POST   /api/v1/config/bonus
       body: { sector, role, metricKey, bonusPct, targetValue?, periodRef: "YYYY-MM" }
POST   /api/v1/config/ads-investment
       body: { channel: AdsChannel, campaign?, amount, periodStart: LocalDate, periodEnd: LocalDate }
```

### Analytics
```
GET    /api/v1/analytics/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD
       → GlobalDashBoardResultDTO

GET    /api/v1/analytics/ads-roi?channel=GOOGLE&from=YYYY-MM-DD&to=YYYY-MM-DD
       → AdsRoiResultDTO  (único objeto, não lista — filtra por canal)

GET    /api/v1/analytics/conversion?sector=LEADS&from=YYYY-MM-DD&to=YYYY-MM-DD
       → StageConversionResultDTO

GET    /api/v1/analytics/dropoff?from=YYYY-MM-DD&to=YYYY-MM-DD
       → SectorDropOffResultDTO[]

GET    /api/v1/analytics/user-performance/{targetUserId}?from=YYYY-MM-DD&to=YYYY-MM-DD
       → UserPerformanceResultDTO

GET    /api/v1/analytics/bonus/{targetId}?periodRef=YYYY-MM
       → BigDecimal (número puro)
```

> `DataRangeDTO` = `{ from: LocalDate, to: LocalDate }` — enviado como query params `?from=&to=`.

---

## Modelos principais

### Customer
```ts
{ id, name,
  cpf?: string,           // nullable — obrigatório apenas em → SCHEDULED
  phone: string | null,   // "NULL" (string literal) após anonimização LGPD
  phone2?: string,
  email?: string,
  initialNote?: string,
  source: CustomerSource,
  adChannel?: AdsChannel, adCampaign?: string,
  referredBy?: string,    // UUID de outro Customer
  createdBy: string,
  createdAt, updatedAt,
  anonymized: boolean     // ADR-006; verificar antes de exibir dados pessoais
}
```

### LeadTicket
```ts
{ id, customerId, status: TicketStatus, currentSector: Sector,
  assignedTo?, scheduledAt?, pendingAt?, closedAt?,
  createdBy, previousTicketId?, createdAt, updatedAt, recycledAt?,
  procedurePerformedAt?: string,  // ← backend retorna, frontend deve mapear
  returnScheduledAt?: string      // ← backend retorna, frontend deve mapear
}
```

### Deal
```ts
{ id, ticketId, createdBySector: Sector, createdBy,
  procedures: DealProcedure[],   // jsonb
  totalValue, discountPct?, discountApprovedBy?,
  finalValue?, paymentMethod?, closedBy?, closedAt?,
  archived, createdAt, updatedAt }
```

### User
```ts
// UserResponseDTO retorna apenas estes 5 campos — active/createdAt/updatedAt NÃO são expostos
{ id, name, username, sector: Sector, role: Role }
```

### DataRangeDTO
```ts
{ from: string, to: string }   // LocalDate → "YYYY-MM-DD"
```

### GlobalDashBoardResultDTO
```ts
{ period: DataRangeDTO,
  adsRoi: AdsRoiResultDTO[],
  stageConversion: StageConversionResultDTO,
  sectorDropOff: SectorDropOffResultDTO[],
  topPerformers: UserPerformanceResultDTO[],
  totalExpectedCash: number }   // caixa esperado consolidado do período
```

### AdsRoiResultDTO
```ts
{ channel: AdsChannel, totalInvestment: number, totalRevenue: number,
  roiMultiplier: number, leadsCount: number, closedCount: number }
```

### StageConversionResultDTO
```ts
{ sector: Sector, captureCount: number, scheduledCount: number,
  dealCreatedCount: number, closedCount: number,
  leadsConversionPct: number, evaluationConversionPct: number, commercialConversionPct: number }
```

### SectorDropOffResultDTO
```ts
{ sector: Sector, entryCount: number, exitCount: number,
  lossCount: number, dropOffPct: number }
```

### UserPerformanceResultDTO
```ts
{ userId: string, name: string, sector: Sector,
  totalAssigned: number, totalConverted: number,
  conversionPct: number, avgTicketValue: number,
  expectedCash: number,      // avgTicketValue × paymentMethod.conversionFactor
  calculatedBonus: number }
```

### DealResponseDTO
```ts
{ id, ticketId, createdBy, createdBySector: Sector,
  procedures: DealProcedureDTO[],
  totalValue: number, discountPct?: number, discountApprovedBy?: string,
  finalValue?: number, paymentMethod?: string,
  closedBy?: string, closedAt?: string,
  archived: boolean, createdAt, updatedAt }
```

### DealHistoryResponseDTO
```ts
{ dealId, changedBy, changedBySector: Sector,
  fieldChanged: string | null,   // nullable — contrato §6
  valueBefore, valueAfter, occurredAt }
```

---

## Funil — fluxo de status do ticket

```
NEW → IN_CONTACT → SCHEDULED → IN_EVALUATION → NEGOTIATION → WIN → POST_PROCEDURE
                                                           ↘ LOSS
                                              ↘ PENDING → RECYCLED → (novo ticket)
```

---

## Plano de implementação — Fases

> Estado auditado em 2026-06-02 com varredura completa de frontend + backend.

### Fase 1 — Fundação ✅
- [x] Instalar dependências: Tailwind, shadcn/ui, TanStack Query, Zustand, React Router v6, Axios, React Hook Form, Zod
- [x] Estrutura de pastas por módulo (`src/modules/auth`, `funnel`, `commercial`, `analytics`, `identity`)
- [x] Axios instance com interceptor JWT (inject token + redirect 401)
- [x] Tipos TypeScript espelhando todos os enums e modelos do backend
- [x] Providers globais: QueryClient, Router

### Fase 2 — Auth ✅
- [x] Página `/login` — React Hook Form + Zod
- [x] Zustand store: `{ user, token, login(), logout() }`
- [x] Persistência de token em localStorage
- [x] Protected route wrapper com redirect por role/sector
- [x] Redirect pós-login por role

### Fase 3 — Identity (Usuários) ✅
- [x] Listagem de usuários com filtro por sector/role
- [x] Formulário criação de usuário — `POST /api/v1/users`
- [x] Troca de senha — `PATCH /api/v1/users/{username}/newPassword`
- [x] Delete com confirmação
- [x] Componente `<RoleGuard>` para controle de visibilidade por role

### Fase 4 — Funnel ⚠️ PARCIAL
- [x] Listagem e cadastro de clientes
- [x] Busca por nome e CPF (client-side)
- [x] Kanban de tickets por `TicketStatus` com drag-and-drop (`@dnd-kit`)
- [x] Card de ticket com detalhes e ações
- [x] Timeline de logs de contato dentro do ticket
- [x] Formulário de novo log com `ContactChannel` + data/hora
- [x] Tipo `LeadTicket` completo — `procedurePerformedAt`, `returnScheduledAt` em `src/types/models.ts`
- [x] Tipo `ContactLog` completo — `statusBefore`, `statusAfter` em `src/types/models.ts`
- [x] Enum `POST_PROCEDURE` presente em `src/types/enums.ts`

### Fase 5 — Commercial ✅
- [x] Arquivos criados: `commercial.service.ts`, `commercial.queries.ts`, `deal.schema.ts`, `DealsPage.tsx`, `DealSheet.tsx`, `ProcedureListEditor.tsx`
- [x] Rotas de deal alinhadas ao contrato (`/api/v1/deals`, `findByTicket` via `ticketId/{}` com 204, fechamento via `/{id}/status`)
- [x] Tipos monetários `number` confirmados (Jackson serializa `BigDecimal` como número JSON — ver Divergências D5)
- [x] Fluxo de desconto — `ApplyDiscountDialog` em `DealSheet.tsx`
- [x] Fechamento de deal com seleção de forma de pagamento — `CloseDealDialog`
- [x] Histórico de versões do deal — `HistoryTimeline` (GET `/deals/{id}/dealHistory`)
- [x] Config (ADM_SYSTEM): GET implementado no `config.service.ts`; `RecycleConfig` lido/prefill na `ConfigPage`; `getBonusConfigs`/`getAdsInvestments` disponíveis no service

### Fase 6 — Analytics ✅ (implementado fora do plano original)
- [x] Dashboard global com filtro de período (`from`/`to`)
- [x] Gráfico de ROI por canal de Ads (um canal por vez)
- [x] Funil de conversão por estágio/setor
- [x] Drop-off por setor
- [x] Ranking de performance
- [x] Tela de performance individual
- [x] `/analytics/bonus/{id}` — lê `BonusResultDTO { value }` (ver Divergências D6)
- [x] Cálculo de bônus por período (`periodRef: YYYY-MM`)
- [x] KPIs no Overview (`totalExpectedCash`, fechamentos, captados, canais) + coluna `expectedCash` na performance
- [x] Card de acompanhamento pós-procedimento (GET `/analytics/post-procedure`)
- [x] View de desempenho pessoal `/meu-desempenho` (`MyPerformancePage`) — escopo OWN para `USER_ATTENDANT`; usa `user-performance/{id}` + `bonus/{id}`. Analytics agora é scope-aware: `ANALYTICS_SCOPE` (GLOBAL=ADM_SYSTEM → `/`; OWN=atendente → `/meu-desempenho`), guarda de rota unificada `RequireRoute` + `canAccessRoute`.

---

## Divergências conhecidas frontend ↔ backend

> Levantadas em 2026-06-02. Resolvidas progressivamente até 2026-06-08.
> Análise completa em `docs/analise-contrato-v1.2.md`.

### D0 — Listagens paginadas (`Page<T>`) ✅ RESOLVIDO — *causa principal do app quebrado*
- **Backend real:** `GET /users`, `/customers`, `/tickets`, `/contact-logs` retornam **`Page<T>` do Spring Data** (`{ content: [], totalElements, ... }`), **não arrays**. Os filtros viraram **query params** (`?sector=&role=`, `?customerId=&status=&assignedTo=`, `?name=&phone=&adChannel=`, `?ticketId=`).
- **Sintoma:** o frontend tratava `r.data` como array → `.map`/`.filter` quebravam todas as telas principais.
- **Correção:** tipo `Page<T>` em `src/types/models.ts`; services desempacotam `r.data.content`; filtros antigos por path (`findBySector/{}`, `findByCustomer/{}`, `findByTicketId/{}`) trocados por query params.

### D1 — Rotas de Deal ✅ RESOLVIDO
- **Backend real:** base **`/api/v1/deals`** (plural); `findByTicket` = `GET /deals/ticketId/{ticketId}` (204 quando não há deal); fechamento = **`PATCH /deals/{id}/status`** (não `/closeDeal`).
- **Correção:** `closeDeal` aponta para `/{id}/status` em `commercial.service.ts`.

### D2 — Rota de criação de usuário ✅ RESOLVIDO
- **Backend real:** `POST /api/v1/users` com body `{ name, username, passwordHash, sector, role }`. Frontend já alinhado.

### D3 — Rota de troca de senha ✅ RESOLVIDO
- **Backend real:** `PATCH /api/v1/users/{username}/newPassword` com body `{ username, oldPassword, newPassword }` (todos `@NotBlank`). Frontend já alinhado.
- **Login:** busca do usuário pós-login usa `GET /api/v1/users/username/{username}` (não `findByUsername/{}`).

### D4 — Enum `POST_PROCEDURE` ✅ RESOLVIDO — presente em `src/types/enums.ts`.

### D5 — Tipos monetários (`number`) ✅ MANTIDO
- Backend serializa `BigDecimal` como número JSON (Jackson padrão). Mantido `number` no TS; aritmética no frontend é só para exibição — totais/finais vêm calculados do backend.

### D6 — Analytics bonus ✅ RESOLVIDO
- **Backend real:** `GET /api/v1/analytics/bonus/{id}?periodRef=YYYY-MM` → **`BonusResultDTO { value: BigDecimal }`** (objeto, não número puro). Frontend lê `r.data.value`.

### D7 — Campos de ContactLog ✅ RESOLVIDO — `statusBefore`/`statusAfter` mapeados em `models.ts` e exibidos na timeline.

### D8 — `UserResponseDTO` enxuto ✅ RESOLVIDO
- **Backend real:** retorna só `{ id, name, username, sector, role }` — **sem `active`/`createdAt`/`updatedAt`**. Tipo `User` ajustado e coluna "Status" removida da `UserListPage`.

### D9 — Endpoints inexistentes removidos do frontend ✅ RESOLVIDO
- Backend **não tem** `DELETE /tickets/{id}` nem `DELETE /contact-logs/{id}`. Removidos `removeTicket`/`removeContactLog` e o botão de excluir log na `TicketDetailSheet`.
- `RecycleConfigRequestDTO` aceita **apenas `afterDays`** (sem `sector`) — campo de setor removido do form de reciclagem.

> A seção "API — Endpoints completos" acima descreve as rotas antigas (path-based, sem paginação) — está defasada. O contrato v1.2 e os controllers em `B:\projects\odontocore.crm` são a fonte da verdade; ao mexer num módulo, confira o controller correspondente.

### Correções contrato v1.1 — ADR-013 (2026-06-07) ✅ RESOLVIDAS NO BACKEND

- **M1/F1** — `LeadTicketServiceImpl.search()`: filtros `customerId`/`status`/`assignedTo` ignorados. Corrigido — filtros cumulativos AND via JPA Specifications.
- **M2/F2** — `CustomerServiceImpl`/`ContactLogServiceImpl` `search()`: scope OWN/SECTOR/INTAKE não recortava. Corrigido — scope aplicado no SQL via subquery `EXISTS`.
- **Mudança de semântica para o frontend:** filtros de listagem passaram de "mutuamente exclusivos por prioridade" para **cumulativos (AND)**. O frontend usa parâmetros isolados — sem impacto.

### Correções contrato v1.2 (2026-06-08) ✅ RESOLVIDAS

#### No backend:
- **B1** — `CUSTOMER:READ` ausente para `ADM_COMMERCIAL` e `USER_COMMERCIAL` no `PermissionSeeder` → 403 em toda leitura de cliente por esses roles. Corrigido: `CUSTOMER:READ:SECTOR` adicionado para ambos.
- **B2** — `DealServiceImpl.applyDiscount()` usava `Action.CONFIGURE` → 403 ao aplicar desconto. Corrigido para `Action.UPDATE`.
- **B3** — `USER_COMMERCIAL, DEAL:UPDATE` com scope `OWN` → vendedor não atualizava deals do setor. Corrigido para `SECTOR`.
- **B4** — `AnalyticsServiceImpl.getUserPerformance()` passava `null` no lugar do `userId` → `USER_ATTENDANT` recebia 403 ao consultar própria performance. Corrigido.
- **B5** — `CustomerServiceImpl.update()` não persistia `phone2`. Corrigido.

#### No frontend (commit `856e4a0`, 2026-06-08):
- **DIV-01** — `permissions.ts`: adicionado `CUSTOMER:READ` para `ADM_COMMERCIAL` e `USER_COMMERCIAL` (menu Pacientes agora aparece para roles comerciais).
- **DIV-02** — `models.ts`: corrigidos tipos nullable — `Customer.phone: string | null` e `DealHistory.fieldChanged: string | null`.
- **DEC-03** — `TicketDetailSheet.tsx`: discriminador de logs automáticos corrigido de regex no texto para `statusBefore != null && statusAfter != null` (contrato §12), preservando notas contextuais (lossReason, pós-procedimento).

### Nota sobre escopos no PermissionSeeder vs contrato §8

O `PermissionSeeder.java` diverge do contrato §8 em alguns escopos (não afeta o frontend — o frontend só verifica capacidade, não escopo):

| Role | Resource:Action | Contrato §8 diz | Seeder real |
|------|----------------|-----------------|-------------|
| `ADM_LEADS` | `CUSTOMER:READ` | `SECTOR` | `INTAKE` |
| `USER_LEADS` | `CUSTOMER:READ` | `OWN` | `INTAKE` |
| `USER_ATTENDANT` | `CUSTOMER:UPDATE` | `OWN` | `INTAKE` |
| `USER_EVALUATOR` | `CUSTOMER:READ` | não listado | `GLOBAL` |

O backend (seeder) é a fonte da verdade para comportamento em produção. O contrato §8 deve ser corrigido pelo time.

---

## Decisões de arquitetura

- **SPA com Vite**, não Next.js — não introduzir SSR/RSC.
- **Auth via JWT** no header `Authorization: Bearer <token>`. Token salvo em `localStorage` no MVP (reavaliado para produção). Em 401 (fora de `/authentication/*`), o interceptor tenta `POST /authentication/refresh` com o token atual uma única vez e refaz a requisição; se o refresh falhar, encerra a sessão (`auth.service.ts` + `lib/api/index.ts`). Refreshs concorrentes compartilham uma única promise.
- **TanStack Query** para todo estado de servidor. Zustand apenas para estado de cliente (auth, UI global).
- **shadcn/ui** como base de componentes — acessibilidade via Radix primitives.
- **Kanban drag-and-drop:** `@dnd-kit/core` (mais acessível que `react-beautiful-dnd`).
- **Gráficos:** Recharts (mais React-friendly, sem dependências extras).
- **Validação de formulários** com Zod — schemas espelham os DTOs do backend.
- **Sem mocks de dados** — o backend roda localmente desde o início.
- **Timezone** — backend fixado em America/Sao_Paulo (ADR-009 no backend). `LocalDateTime` é horário de Brasília; exibir naïve, **sem** conversão UTC. O envio usa `nowBrasiliaISO` (`lib/utils.ts`) — ida e volta simétricas.
- **Guardas de rota** — `RequireRoute path=...` + `canAccessRoute` em `lib/permissions.ts`. Rotas por capacidade (`can`) e analytics por escopo (`analyticsScope`: GLOBAL=Overview `/`, OWN=`/meu-desempenho`).
- **Toast** — store + função `toast()` em `lib/toast.ts`; `components/Toaster.tsx` só exporta o componente (Fast Refresh). Variantes cva do shadcn extraídas para `*-variants.ts` (`button-variants.ts`, `badge-variants.ts`).
- **Discriminador de logs na timeline** — `TicketDetailSheet.tsx` usa `statusBefore != null && statusAfter != null` para identificar logs automáticos de transição (contrato §12). Notas genéricas "Status changed: X → Y" são ocultadas (redundantes com o badge); notas contextuais de logs automáticos (lossReason, "Procedimento realizado", "Retorno agendado") são exibidas. Evolução futura: campo `logType: 'MANUAL' | 'SYSTEM'` no backend tornará a distinção explícita.

---

## Arquivos-chave do backend para consulta

| O quê | Arquivo |
|---|---|
| Todos os controllers | `B:\projects\odontocore.crm\odontocore.crm\src\main\java\io\sertaoBit\odontocore\crm\modules\` |
| Enums | `B:\projects\odontocore.crm\odontocore.crm\src\main\java\io\sertaoBit\odontocore\crm\core\enums\` |
| DTOs request | `**/api/dto/request/` em cada módulo |
| DTOs response | `**/api/dto/response/` em cada módulo |
| Auth/JWT | `B:\projects\odontocore.crm\odontocore.crm\src\main\java\io\sertaoBit\odontocore\crm\config\security\` |
