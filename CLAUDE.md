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
| Estilização | Tailwind CSS + shadcn/ui (a instalar) |
| Server State | TanStack Query v5 (a instalar) |
| Client State | Zustand (a instalar) |
| Formulários | React Hook Form + Zod (a instalar) |
| HTTP | Axios (a instalar) |
| Roteamento | React Router v6 (a instalar) |

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
GET    /api/v1/users/findByUsername/{username}
GET    /api/v1/users/findBySector/{sector}
GET    /api/v1/users/findBySectorAndRole/{sector}/{role}
GET    /api/v1/users/existsByUsername/{username}
PATCH  /api/v1/users/updatePassword/{username}/passwordHash
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
GET    /api/v1/contact-logs
GET    /api/v1/contact-logs/{id}
GET    /api/v1/contact-logs/findByTicketId/{id}
DELETE /api/v1/contact-logs/{id}
```

### Commercial — Deal
```
POST   /api/v1/deal/{ticketId}           criar orçamento vinculado ao ticket
PATCH  /api/v1/deal/{id}                 atualizar procedimentos/valores
PATCH  /api/v1/deal/{id}/discount        aplicar desconto (pode exigir aprovação)
PATCH  /api/v1/deal/{id}/closeDeal       fechar deal com paymentMethod
GET    /api/v1/deal/{id}/dealHistory     deal + histórico de versões
```

### Commercial — Config (ADM_SYSTEM)
```
POST   /api/v1/config/recycle            configura regra de reciclagem de tickets
POST   /api/v1/config/bonus              configura regras de bônus
POST   /api/v1/config/ads-investment     registra investimento em ads por período/canal
```

### Analytics
```
GET    /api/v1/analytics/dashboard                         GlobalDashboard
GET    /api/v1/analytics/ads-roi?channel=GOOGLE&startDate=...&endDate=...
GET    /api/v1/analytics/conversion?sector=LEADS&startDate=...&endDate=...
GET    /api/v1/analytics/dropoff?startDate=...&endDate=...
GET    /api/v1/analytics/user-performance/{targetUserId}?startDate=...&endDate=...
GET    /api/v1/analytics/bonus/{targetId}?periodRef=YYYY-MM
```

> `DataRangeDTO` = `{ startDate: LocalDate, endDate: LocalDate }` — enviado como query params.

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

### GlobalDashboard
```ts
{ period: DataRangeDTO, adsRoi: AdsRoiResultDTO[],
  stageConversion: StageConversionResultDTO,
  sectorDropOff: SectorDropOffResultDTO[],
  topPerformers: UserPerformanceResultDTO[] }
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

### Fase 1 — Fundação
- [ ] Instalar dependências: Tailwind, shadcn/ui, TanStack Query, Zustand, React Router v6, Axios, React Hook Form, Zod
- [ ] Estrutura de pastas por módulo (`src/modules/auth`, `funnel`, `commercial`, `analytics`, `identity`)
- [ ] Axios instance com interceptor JWT (inject token + redirect 401)
- [ ] Tipos TypeScript espelhando todos os enums e modelos do backend
- [ ] Providers globais: QueryClient, Router

### Fase 2 — Auth
- [ ] Página `/login` — React Hook Form + Zod
- [ ] Zustand store: `{ user, token, login(), logout() }`
- [ ] Persistência de token
- [ ] Protected route wrapper com redirect por role/sector
- [ ] Redirect pós-login por role

### Fase 3 — Identity (Usuários)
- [ ] Listagem de usuários com filtro por sector/role
- [ ] Formulário criação de usuário
- [ ] Troca de senha
- [ ] Delete com confirmação
- [ ] Componente `<RoleGuard>` para controle de visibilidade por role

### Fase 4 — Funnel
- [ ] Listagem e cadastro de clientes
- [ ] Busca por nome e CPF
- [ ] Kanban de tickets por `TicketStatus` com drag-and-drop
- [ ] Card de ticket com detalhes e ações
- [ ] Timeline de logs de contato dentro do ticket
- [ ] Formulário de novo log com `ContactChannel` + agendamento opcional

### Fase 5 — Commercial
- [ ] Criação de deal vinculado ao ticket (lista de procedimentos)
- [ ] Edição de deal
- [ ] Fluxo de desconto com estado "aguardando aprovação"
- [ ] Fechamento de deal com seleção de forma de pagamento
- [ ] Histórico de versões do deal
- [ ] Configurações admin: RecycleConfig, BonusConfig, AdsInvestment

### Fase 6 — Analytics
- [ ] Dashboard global com filtro de período
- [ ] Gráfico de ROI por canal de Ads
- [ ] Funil de conversão por estágio/setor
- [ ] Drop-off por setor
- [ ] Ranking de performance
- [ ] Tela de performance individual
- [ ] Cálculo de bônus por período

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
