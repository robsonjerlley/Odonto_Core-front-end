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
  NEGOTIATION, WIN, PENDING, RECYCLED, LOSS
}

enum AdsChannel   { GOOGLE, META, INSTAGRAM, TIKTOK, OUTER }
enum ContactChannel { ORGANIC, REFERRAL, FACEBOOK, INSTAGRAM, WHATSAPP, PHONE_CALL, WEBSITE_FROM, OTHER }
enum CustomerSource { ADS_PAID, ORGANIC, INDICATION }
```

---

## API — Endpoints completos

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
{ id, name, cpf, phone, email, source: CustomerSource,
  adChannel?: AdsChannel, adCampaign?: string,
  createdAt, updatedAt, createdBy, referredBy? }
```

### LeadTicket
```ts
{ id, customerId, status: TicketStatus, currentSector: Sector,
  assignedTo?, scheduledAt?, pendingAt?, closedAt?,
  createdBy, previousTicketId?, createdAt, updatedAt, recycledAt? }
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
{ id, name, username, sector: Sector, role: Role,
  active, createdBy?, createdAt, updatedAt }
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
  topPerformers: UserPerformanceResultDTO[] }
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
  conversionPct: number, avgTicketValue: number, calculatedBonus: number }
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
  fieldChanged, valueBefore, valueAfter, occurredAt }
```

---

## Funil — fluxo de status do ticket

```
NEW → IN_CONTACT → SCHEDULED → IN_EVALUATION → NEGOTIATION → WIN
                                                           ↘ LOSS
                                              ↘ PENDING → RECYCLED → (novo ticket)
```

---

## Plano de implementação — Fases

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
- [x] Formulário criação de usuário
- [x] Troca de senha
- [x] Delete com confirmação
- [x] Componente `<RoleGuard>` para controle de visibilidade por role

### Fase 4 — Funnel ✅
- [x] Listagem e cadastro de clientes
- [x] Busca por nome e CPF (client-side)
- [x] Kanban de tickets por `TicketStatus` com drag-and-drop (`@dnd-kit`)
- [x] Card de ticket com detalhes e ações
- [x] Timeline de logs de contato dentro do ticket
- [x] Formulário de novo log com `ContactChannel` + data/hora

### Fase 5 — Commercial
- [ ] Criação de deal vinculado ao ticket (lista de procedimentos)
- [ ] Edição de deal
- [ ] Fluxo de desconto
- [ ] Fechamento de deal com seleção de forma de pagamento
- [ ] Histórico de versões do deal
- [ ] Configurações admin: RecycleConfig, BonusConfig, AdsInvestment

### Fase 6 — Analytics
- [ ] Dashboard global com filtro de período (`from`/`to`)
- [ ] Gráfico de ROI por canal de Ads (um canal por vez)
- [ ] Funil de conversão por estágio/setor
- [ ] Drop-off por setor
- [ ] Ranking de performance
- [ ] Tela de performance individual
- [ ] Cálculo de bônus por período (`periodRef: YYYY-MM`)

---

## Decisões de arquitetura

- **SPA com Vite**, não Next.js — não introduzir SSR/RSC.
- **Auth via JWT** no header `Authorization: Bearer <token>`. Token salvo em `localStorage` no MVP (reavaliado para produção).
- **TanStack Query** para todo estado de servidor. Zustand apenas para estado de cliente (auth, UI global).
- **shadcn/ui** como base de componentes — acessibilidade via Radix primitives.
- **Kanban drag-and-drop:** `@dnd-kit/core` (mais acessível que `react-beautiful-dnd`).
- **Gráficos:** Recharts (mais React-friendly, sem dependências extras).
- **Validação de formulários** com Zod — schemas espelham os DTOs do backend.
- **Sem mocks de dados** — o backend roda localmente desde o início.

---

## Arquivos-chave do backend para consulta

| O quê | Arquivo |
|---|---|
| Todos os controllers | `B:\projects\odontocore.crm\odontocore.crm\src\main\java\io\sertaoBit\odontocore\crm\modules\` |
| Enums | `B:\projects\odontocore.crm\odontocore.crm\src\main\java\io\sertaoBit\odontocore\crm\core\enums\` |
| DTOs request | `**/api/dto/request/` em cada módulo |
| DTOs response | `**/api/dto/response/` em cada módulo |
| Auth/JWT | `B:\projects\odontocore.crm\odontocore.crm\src\main\java\io\sertaoBit\odontocore\crm\config\security\` |
