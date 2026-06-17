# Contrato de Integração Frontend ↔ Backend — OdontoCore CRM

**Versão:** 1.9  
**Data:** 2026-06-17  
**Branch:** main  
**Commit de referência:** HEAD  
**Fonte da verdade:** código Java (controllers, DTOs, services, enums, `PermissionSeeder`, `GlobalExceptionHandler`)

> **Changelog 1.9 (2026-06-17) — bug M1: GET /config/recycle retornava 500.**
> `GET /api/v1/config/recycle` retornava **500** em produção porque o endpoint nunca foi adicionado
> ao `ConfigController` — o service `getRecycle()` existia, mas sem mapeamento `@GetMapping("/recycle")`
> o Spring não encontrava handler e o `GlobalExceptionHandler` genérico retornava 500. Endpoint
> adicionado com `ResponseEntity<RecycleConfigResponseDTO>` e `orElse(null)`. Comportamento de
> resposta inalterado: `200 + body` quando config existe, `200 + null` quando não existe. Ver §15 M1.

> **Changelog 1.8 (2026-06-16) — analytics POST_PROCEDURE + scope USER_COMMERCIAL.**
> `GET /analytics/conversion`: `POST_PROCEDURE` adicionado a `dealStatuses` (tickets em
> acompanhamento pós-venda não desapareciam mais do `dealCreatedCount`); `closedCount` corrigido
> de `status == WIN` para `closedAt != null`, capturando também tickets que avançaram para
> `POST_PROCEDURE` (cujo `closedAt` persiste da transição WIN); filtro de setor `COMMERCIAL`
> expandido para incluir tickets em `POST_PROCEDURE` (apesar de `currentSector` mudar para `LEADS`
> na transição `WIN→POST_PROCEDURE`, esses tickets pertencem ao funil comercial).
> `USER_COMMERCIAL.TICKET:READ` corrigido de `OWN` para `SECTOR` — vendedor agora enxerga todos os
> tickets do setor COMMERCIAL (antes não via tickets em `NEGOTIATION` de outros membros do setor).
> Ver §8, §9, §13 e §15.

> **Changelog 1.7 (2026-06-16) — ADR-018 + ADR-019 + bug #18.**
> `GET /customers` nunca retorna clientes com `anonymized=true` — filtro aplicado por default no SQL
> via `CustomerSpecifications.notAnonymized()` (ADR-018). `ContactLogResponseDTO` agora inclui o campo
> `username` (nome do autor gravado no momento da criação, ADR-019) — logs anteriores a esta versão
> chegam com `null`. `GET /config/recycle` retorna `200 + null` quando nenhuma config foi cadastrada
> (era 404, bug #18); frontend deve tratar `null` como "não configurado" e exibir formulário de
> criação. Ver §6, §7.5, §7.7 e §15.

> **Changelog 1.6 (2026-06-15) — ADR-017 implementada: dashboard global aceita range livre.**
> `GET /analytics/dashboard` não exige mais range de mês único — aceita qualquer range ("últimos 30
> dias", trimestre, etc.). `topPerformers` é calculado via núcleo interno sem bônus: `calculatedBonus`
> sempre chega como `0` e `bonusPeriodRef` sempre chega como `null` no contexto do dashboard. O
> frontend **não deve renderizar** bônus nos cards do ranking do dashboard. Ver §13 e §15 (ADR-017).

> **Changelog 1.5 (2026-06-14) — ADR-016 implementada: bônus mensal vs. métricas por range.**
> `GET /analytics/user-performance/{targetUserId}` ganha o campo `bonusPeriodRef` (`yyyy-MM`),
> que explicita o mês a que o `calculatedBonus` se refere. O range `from/to` passa a exigir
> **um único mês calendário** (cross-month → **422**); como o `/dashboard` reutiliza esse cálculo
> para `topPerformers`, o mesmo guard vale para o dashboard. Ver §15 bloco F1–F3.

> **Changelog 1.4 (2026-06-14) — ADR-015 implementada: analytics scope-aware.** Endpoints
> `/ads-roi`, `/post-procedure` e `/bonus/{id}` removidos como endpoints independentes — seus dados
> ficam acessíveis apenas via `GET /analytics/dashboard` (GLOBAL). Dashboard passa a incluir
> `postProcedures` (`PostProcedureResultDTO`). `getConversionByStage` e `getDropOffBySector` agora
> respondem corretamente para escopo `SECTOR` (ADMs de setor recebem dados filtrados ao próprio
> setor). `getUserPerformance` reforça guarda `OWN` — papel `OWN` só pode consultar o próprio
> `targetUserId`. Testes unitários reescritos para cobrir os novos comportamentos de scope. Ver §13 e §15.

> **Changelog 1.3 (2026-06-11) — sincronização total com o código.** Esta revisão reescreveu o
> contrato a partir da leitura direta de todos os controllers, DTOs, enums, services e do
> `PermissionSeeder`. Correções relevantes que **alteram a integração**:
> - **`POST /users`**: o campo do body é **`password`** (não `passwordHash`).
> - **`PATCH /users/{username}/newPassword`**: o body é **apenas `{ "newPassword": "..." }`** (não há
>   `username` nem `oldPassword` no body). Exige permissão **`USER:UPDATE`** (na matriz, só `ADM_SYSTEM`).
>   Enviar uma senha **igual à atual** retorna **422**.
> - **Customer usa `adsChannel`** (não `adChannel`) em **todos os pontos**: campo do request de criação,
>   campo da resposta e **query param** de `GET /customers`. O campo de campanha permanece `adCampaign`.
> - **`GET /customers?name=`** faz **match exato** (igualdade), **não** "contains/case-insensitive".
> - **Matriz RBAC (§8/§9/§14) reescrita** conforme o `PermissionSeeder` real: escopo **`INTAKE`** para
>   `LEADS`/`ATTENDANT`, **`ANALYTICS:READ` para todos os papéis**, `CUSTOMER:READ` para avaliadores etc.
> - **Login com credenciais inválidas → 401 _com_ corpo JSON** (`BadCredentialsException`).
> - **`POST /authentication/refresh` com token de assinatura inválida → 500** (não há handler de
>   `JwtException`; cai no handler genérico).
> - **`IllegalArgumentException` → 422** (handler dedicado); mensagem do 500 genérico é
>   `"Erro Interno do Servidor"`.
> - **`GET /users/{id}` e `GET /users/username/{username}` não fazem checagem de permissão** (qualquer
>   usuário autenticado) — o restante de `/users` é exclusivo de `ADM_SYSTEM`.
> - **Analytics**: na implementação atual quase todos os endpoints passam `targetSector=null` e
>   `targetOwnerId=null` ao `checkOrThrow`, então na prática **só papéis de escopo `GLOBAL`
>   (`ADM_SYSTEM`) obtêm sucesso**; `user-performance` é exceção (ver §13).
> - **Invariantes 422 em deals** documentadas (criar exige ticket `IN_EVALUATION`; desconto 0–100; não
>   reabrir deal fechado).
> Ver §15 para a lista completa de divergências.

> **Changelog 1.2 (2026-06-08):** correções de RBAC e dados — `CUSTOMER:READ` adicionado para
> `ADM_COMMERCIAL` e `USER_COMMERCIAL` (SECTOR); `DEAL:UPDATE` de `USER_COMMERCIAL` corrigido para
> scope `SECTOR`; `applyDiscount` corrigido de `CONFIGURE` para `UPDATE`; `getUserPerformance` com
> scope OWN corrigido; `phone2` agora atualizado via `PATCH /customers`. C4/C5 marcados resolvidos.
> Ver §15 "Correções backend 2026-06-08".

> **Changelog 1.1 (2026-06-07):** filtros de listagem agora **cumulativos (AND)** e scope aplicado no
> SQL via JPA Specifications (ADR-013). `PermissionScope.INTAKE` adicionado em §5. M1/M2 resolvidos
> (§15). **Mudança de semântica de contrato — ver §15 "Correções pós-Fase 3 RBAC".**

---

## Sumário

- [0. Quick Reference — todos os endpoints](#0-quick-reference)
- [1. Convenções Globais](#1-convenções-globais)
- [2. Modelo de Erro](#2-modelo-de-erro)
- [3. Autenticação e Sessão](#3-autenticação-e-sessão)
- [4. Paginação](#4-paginação)
- [5. Enums](#5-enums)
- [6. Modelo de Domínio](#6-modelo-de-domínio)
- [7. Endpoints por Módulo](#7-endpoints-por-módulo)
- [8. RBAC — Matriz Completa](#8-rbac--matriz-completa)
- [9. Capacidades e Navegação por Papel](#9-capacidades-e-navegação-por-papel)
- [10. Máquina de Estados do Ticket](#10-máquina-de-estados-do-ticket)
- [11. Reciclagem e No-Show](#11-reciclagem-e-no-show)
- [12. Separação de Conceitos — Onde Mora Cada Observação](#12-separação-de-conceitos)
- [13. Config e Analytics — Shapes Exatos](#13-config--analytics)
- [14. Apêndice TypeScript](#14-apêndice-typescript)
- [15. Divergências e Correções para o Frontend](#15-divergências-e-correções)

---

## 0. Quick Reference

| Método | Path | Descrição | Permissão (resource:action:scope) | HTTP Sucesso |
|--------|------|-----------|-----------------------------------|--------------|
| POST | `/api/v1/authentication/login` | Login | público | 200 |
| POST | `/api/v1/authentication/refresh` | Renovar token | público | 200 |
| POST | `/api/v1/users` | Criar usuário | USER:CREATE (só ADM_SYSTEM) | 201 |
| PATCH | `/api/v1/users/{username}/newPassword` | Trocar senha | USER:UPDATE (só ADM_SYSTEM) | 200 |
| GET | `/api/v1/users` | Listar/buscar usuários | USER:READ (só ADM_SYSTEM) | 200 |
| GET | `/api/v1/users/{id}` | Buscar por UUID | autenticado (sem checagem RBAC) | 200 |
| GET | `/api/v1/users/username/{username}` | Buscar por username | autenticado (sem checagem RBAC) | 200 |
| DELETE | `/api/v1/users/{id}` | Deletar usuário | USER:DELETE | 204 |
| POST | `/api/v1/customers` | Criar cliente + ticket + log | CUSTOMER:CREATE | 201 |
| PATCH | `/api/v1/customers/{id}` | Atualizar cliente | CUSTOMER:UPDATE | 200 |
| GET | `/api/v1/customers` | Buscar clientes | CUSTOMER:READ | 200 |
| GET | `/api/v1/customers/{id}` | Buscar por UUID | CUSTOMER:READ | 200 |
| GET | `/api/v1/customers/cpf/{cpf}` | Buscar por CPF | CUSTOMER:READ | 200 |
| DELETE | `/api/v1/customers/{id}` | Anonimizar cliente (LGPD) | CUSTOMER:DELETE | 204 |
| POST | `/api/v1/tickets` | Criar ticket avulso | TICKET:CREATE | 201 |
| PATCH | `/api/v1/tickets/{id}/status` | Mudar status do ticket | TICKET:UPDATE | 200 |
| GET | `/api/v1/tickets/{id}` | Buscar ticket por UUID | TICKET:READ | 200 |
| GET | `/api/v1/tickets` | Buscar tickets | TICKET:READ | 200 |
| POST | `/api/v1/contact-logs` | Criar log de contato | CONTACT_LOG:CREATE | 201 |
| GET | `/api/v1/contact-logs/{id}` | Buscar log por UUID | CONTACT_LOG:READ | 200 |
| GET | `/api/v1/contact-logs` | Buscar logs (por ticket) | CONTACT_LOG:READ | 200 |
| POST | `/api/v1/deals/{ticketId}` | Criar deal | DEAL:CREATE | 201 |
| PATCH | `/api/v1/deals/{id}` | Atualizar procedimentos | DEAL:UPDATE | 200 |
| GET | `/api/v1/deals/ticketId/{ticketId}` | Buscar deal (não-arquivado) do ticket | autenticado (sem checagem RBAC) | 200 ou 204 |
| PATCH | `/api/v1/deals/{id}/discount` | Aplicar desconto | DEAL:UPDATE | 200 |
| PATCH | `/api/v1/deals/{id}/status` | Fechar deal | DEAL:CLOSE | 200 |
| GET | `/api/v1/deals/{id}/dealHistory` | Histórico do deal | DEAL:READ | 200 |
| POST | `/api/v1/config/recycle` | Configurar prazo de reciclagem | CONFIG:CONFIGURE | 201 |
| POST | `/api/v1/config/bonus` | Configurar bônus | CONFIG:CONFIGURE | 201 |
| POST | `/api/v1/config/ads-investment` | Registrar investimento ADS | CONFIG:CONFIGURE | 201 |
| GET | `/api/v1/config/recycle` | Consultar config de reciclagem | CONFIG:CONFIGURE | 200 |
| GET | `/api/v1/config/bonus` | Consultar configs de bônus | CONFIG:CONFIGURE | 200 |
| GET | `/api/v1/config/ads-investment` | Consultar investimentos ADS | CONFIG:CONFIGURE | 200 |
| GET | `/api/v1/analytics/conversion` | Conversão por etapa | ANALYTICS:READ (GLOBAL + SECTOR) | 200 |
| GET | `/api/v1/analytics/dropoff` | Abandono por setor | ANALYTICS:READ (GLOBAL + SECTOR) | 200 |
| GET | `/api/v1/analytics/user-performance/{targetUserId}` | Performance de usuário | ANALYTICS:READ (GLOBAL + OWN) | 200 |
| GET | `/api/v1/analytics/dashboard` | Dashboard global — inclui `postProcedures` e `adsRoi` | ANALYTICS:READ (GLOBAL only) | 200 |

---

## 1. Convenções Globais

### Base URL

| Ambiente | URL |
|----------|-----|
| Desenvolvimento | `http://localhost:8080` |
| Produção (Railway) | Configurado via variável `CORS_ALLOWED_ORIGINS` |

Prefixo de todas as rotas: `/api/v1`

### Formato JSON

- Nomes de campos: **camelCase** (Jackson padrão)
- Campos `null`: serializados como `null` no JSON (Jackson padrão)
- Campos ausentes: nunca omitidos — todos os campos do DTO sempre aparecem, mesmo que `null`
- IDs: **UUID como string** (`"3fa85f64-5717-4562-b3fc-2c963f66afa6"`)

### Autenticação

- Header obrigatório em todas as rotas exceto `/api/v1/authentication/**`:
  ```
  Authorization: Bearer <jwt>
  ```
- Rotas públicas (`permitAll`): `/api/v1/authentication/login`, `/api/v1/authentication/refresh`
- Token ausente ou inválido → **HTTP 401 sem corpo** (Spring retorna `HttpStatus.UNAUTHORIZED` puro via `HttpStatusEntryPoint`)

### Timezone — RESOLVIDO (ADR-009, 2026-06-04)

O fuso da JVM agora é **fixado em `America/Sao_Paulo`** no boot (`Application.main`, configurável via env `APP_TIMEZONE`), mais `spring.jackson.time-zone` e `zone` explícito no cron do `RecycleJob`. Com isso `LocalDateTime.now()`, `@CreationTimestamp`/`@UpdateTimestamp` e o scheduler operam em horário de Brasília.

**Impacto para o frontend:**
- Campos `LocalDateTime` chegam sem offset (ex: `"2026-06-04T14:30:00"`) e representam **horário de Brasília**.
- **Exibir como horário local naïve** — **não** aplicar conversão UTC→local. O frontend já envia em Brasília (`nowBrasiliaISO`), então ida e volta são simétricas.
- ⚠️ A recomendação anterior (tratar `LocalDateTime` como UTC) está **revogada** pela ADR-009 — aplicá-la agora reintroduziria erro de 3h.

### Serialização de tipos

| Tipo Java | Formato JSON | Exemplo |
|-----------|-------------|---------|
| `LocalDateTime` | string ISO-8601 sem offset | `"2026-06-03T14:30:00"` |
| `LocalDate` | string `YYYY-MM-DD` | `"2026-06-03"` |
| `BigDecimal` | **número JSON** (Jackson padrão) | `1500.50` |
| `UUID` | string | `"3fa85f64-5717-4562-b3fc-2c963f66afa6"` |
| `Enum` | string com o nome exato do valor | `"PIX"`, `"LEADS"` |
| `boolean` | boolean JSON | `true`, `false` |

### Dinheiro

- Unidade: **Reais (BRL)**
- Precisão: `NUMERIC(15,2)` — sempre 2 casas decimais
- Arredondamento: `RoundingMode.HALF_UP`
- Fórmula do finalValue: `finalValue = totalValue × (1 - discountPct / 100)`
- Nunca use `float`/`double` no frontend para valores monetários — use uma biblioteca decimal

---

## 2. Modelo de Erro

### Shape padrão (todos os erros)

```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Customer not found <id>",
  "timestamp": "2026-06-03T14:30:00.123"
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `status` | `number` | Código HTTP numérico |
| `error` | `string` | Reason phrase HTTP padrão |
| `message` | `string` | Mensagem específica do erro |
| `timestamp` | `string` | LocalDateTime sem offset |

### Mapa de exceção → HTTP

| Exceção | HTTP | `error` | Quando ocorre |
|---------|------|---------|---------------|
| `ResourceNotFoundException` | 404 | `"Not Found"` | ID não encontrado, CPF não encontrado |
| `ResourceAlreadyExistsException` | 409 | `"Conflict"` | CPF duplicado na atualização de cliente |
| `AccessDeniedException` | 403 | `"Forbidden"` | RBAC negou a operação |
| `DiscountApprovalRequiredException` | 403 | `"Forbidden"` | Desconto acima do limite sem aprovação |
| `IllegalStateException` | 422 | `"Unprocessable Content"` | Transição inválida, CPF ausente no agendamento, `returnScheduledAt` no passado, deal fora de `IN_EVALUATION`, desconto fora de 0–100, deal já fechado/arquivado |
| `IllegalArgumentException` | 422 | `"Unprocessable Content"` | Ex.: nova senha igual à atual em `PATCH /users/{username}/newPassword` |
| `MethodArgumentNotValidException` | 400 | `"Bad Request"` | Bean Validation falhou no body |
| `ConstraintViolationException` | 400 | `"Bad Request"` | Validação de @PathVariable/@RequestParam |
| `BadCredentialsException` | 401 | `"Unauthorized"` | **Login com credenciais inválidas — retorna corpo JSON** (shape padrão de erro) |
| Token expirado/inválido no filtro | 401 | *(sem corpo)* | `JwtAuthenticationFilter` não autentica → `HttpStatusEntryPoint` retorna 401 puro |
| Token ausente | 401 | *(sem corpo)* | Header Authorization ausente em rota protegida |
| Qualquer outra (inclui `JwtException` no `/refresh`) | 500 | `"Internal Server Error"` | `"Erro Interno do Servidor"` |

> **Atenção ao 422:** o `error` (reason phrase) do HTTP 422 nesta versão do Spring é
> **`"Unprocessable Content"`** (e não `"Unprocessable Entity"`). Trate ambos defensivamente se
> precisar comparar a string.
>
> **Atenção ao 401:** há **duas** formas de 401. (a) **Credenciais inválidas no login** passam pelo
> `GlobalExceptionHandler` e **vêm com corpo JSON** no shape padrão. (b) **Token ausente/expirado/
> inválido em rotas protegidas** são barrados antes do controller pelo `HttpStatusEntryPoint` e vêm
> **sem corpo**. Já o `POST /authentication/refresh` com token de **assinatura adulterada** lança
> `JwtException` que cai no handler genérico → **500** (não 401).

### Exemplos JSON

**400 — Validação de DTO:**
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "name : não deve estar em branco , phone : não deve estar em branco",
  "timestamp": "2026-06-03T14:30:00.123"
}
```
> O `message` é uma string única com os campos separados por ` , ` (espaço-vírgula-espaço). Não é um array — parse com `split(' , ')` se precisar exibir por campo.

**404 — Not Found:**
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Customer not found 3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "timestamp": "2026-06-03T14:30:00.123"
}
```

**403 — Acesso negado:**
```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "Access denied",
  "timestamp": "2026-06-03T14:30:00.123"
}
```

**422 — Transição inválida:**
```json
{
  "status": 422,
  "error": "Unprocessable Content",
  "message": "Transition not allowed IN_CONTACT -> WIN",
  "timestamp": "2026-06-03T14:30:00.123"
}
```

**409 — Conflito:**
```json
{
  "status": 409,
  "error": "Conflict",
  "message": "CPF 123.456.789-09 já existe na base de dados",
  "timestamp": "2026-06-03T14:30:00.123"
}
```

**401 — Token ausente/inválido em rota protegida:** HTTP 401 **sem corpo**.

**401 — Login com credenciais inválidas:** HTTP 401 **com corpo** no shape padrão:
```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Bad credentials",
  "timestamp": "2026-06-03T14:30:00.123"
}
```

---

## 3. Autenticação e Sessão

### POST /api/v1/authentication/login

**Request:**
```json
{
  "username": "joao.silva",
  "password": "minhasenha123"
}
```

| Campo | Tipo | Validação |
|-------|------|-----------|
| `username` | `string` | `@NotBlank` |
| `password` | `string` | `@NotBlank` |

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer"
}
```

### POST /api/v1/authentication/refresh

Envia o token **expirado** (ou ainda válido) para obter um novo. Não requer autenticação.

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Response 200:** mesmo shape de `AuthResponseDTO`

> O backend extrai o `username` do token **ignorando a expiração** (`extractUserNameIgnoringExpiration`),
> recarrega o usuário e emite um token novo. Por isso aceita token expirado.

**Erros:**
- `400` se `token` estiver em branco
- `500` se o token tiver **assinatura inválida** (adulterado): lança `JwtException`, que **não tem
  handler dedicado** e cai no handler genérico (`"Erro Interno do Servidor"`). ⚠️ Não é 401.

### Claims do JWT

O backend gera o token com:

| Claim | Tipo | Descrição |
|-------|------|-----------|
| `sub` (subject) | `string` | username do usuário |
| `id` | `string` (UUID) | UUID do usuário |
| `role` | `string` | valor exato do enum `Role` |
| `sector` | `string` | valor exato do enum `Sector` |
| `iat` | `number` | issued at (Unix timestamp) |
| `exp` | `number` | expiration (Unix timestamp) |

**Expiração:** 86400000 ms = **24 horas**

O frontend **pode** ler os claims do JWT para: conhecer o `id` e `role` do usuário sem fazer chamada extra. Mas para o objeto completo (name, username, sector), use:

```
GET /api/v1/users/username/{username}
```

### Fluxo pós-login recomendado

```
1. POST /authentication/login → recebe {token, type}
2. Decodifica payload do JWT → extrai {id, role, sector, sub}
3. GET /users/username/{sub} → recebe UserResponseDTO completo
4. Armazena no Zustand: {token, user: UserResponseDTO}
5. Redireciona para rota inicial do papel (ver seção 9)
```

### Tratamento de 401

- Interceptor Axios detecta 401 **sem corpo** (token expirado/ausente em rota protegida)
- Chama `POST /authentication/refresh` com o token atual (o backend aceita token expirado, pois ignora
  a expiração ao extrair o `username`)
- Se refresh retornar **200**: substitui o token e retenta a requisição original
- Se refresh retornar **400** (token em branco) ou **500** (assinatura inválida): limpa store,
  redireciona para `/login`
- ⚠️ O refresh **não** retorna 401 para token inválido — ver §7.1. Trate qualquer status ≠ 200 do
  refresh como "sessão perdida".

### CORS

Origens permitidas: configuradas via env `CORS_ALLOWED_ORIGINS` (csv). Em dev: `http://localhost:5173`.

Métodos permitidos: `GET, POST, PUT, PATCH, DELETE, OPTIONS`

Headers permitidos: `Authorization, Content-Type, X-Requested-With`

---

## 4. Paginação

### Parâmetros aceitos (Pageable)

| Param | Tipo | Default | Exemplo |
|-------|------|---------|---------|
| `page` | `number` | `0` | `?page=2` |
| `size` | `number` | `20` | `?size=10` |
| `sort` | `string` | sem ordenação | `?sort=name,asc` |

**Default size:** 20 (via `@PageableDefault(size = 20)` em todos os controllers paginados).

### Shape completo de Page\<T\>

```json
{
  "content": [ /* array de T */ ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": { "empty": true, "sorted": false, "unsorted": true },
    "offset": 0,
    "paged": true,
    "unpaged": false
  },
  "last": false,
  "totalPages": 5,
  "totalElements": 98,
  "first": true,
  "size": 20,
  "number": 0,
  "sort": { "empty": true, "sorted": false, "unsorted": true },
  "numberOfElements": 20,
  "empty": false
}
```

### Endpoints paginados vs não-paginados

| Endpoint | Retorno |
|----------|---------|
| `GET /users` | `Page<UserResponseDTO>` |
| `GET /customers` | `Page<CustomerResponseDTO>` |
| `GET /tickets` | `Page<LeadTicketResponseDTO>` |
| `GET /contact-logs` | `Page<ContactLogResponseDTO>` |
| `GET /deals/ticketId/{ticketId}` | `DealResponseDTO` único ou **204 sem corpo** |
| `GET /deals/{id}/dealHistory` | `DealDetailResponseDTO` (objeto único) |
| `GET /config/bonus` | `List<BonusConfigResponseDTO>` (array puro, sem paginação) |
| `GET /config/ads-investment` | `List<AdsInvestmentResponseDTO>` (array puro) |
| `GET /config/recycle` | `RecycleConfigResponseDTO` (objeto único) |
| Todos os analytics | DTOs únicos ou `List<>` (sem paginação) |

---

## 5. Enums

Todos os enums são enviados e recebidos como **string com o nome exato do valor** (case-sensitive). Query params também são case-sensitive.

### Role

| Valor | Rótulo PT | Setor associado |
|-------|-----------|-----------------|
| `ADM_SYSTEM` | Administrador do Sistema | nenhum (GLOBAL) |
| `ADM_LEADS` | Gestor de Leads | LEADS |
| `USER_LEADS` | Atendente de Leads | LEADS |
| `USER_ATTENDANT` | Recepcionista/Atendente | ATTENDANT |
| `ADM_EVALUATOR` | Gestor de Avaliação | EVALUATOR |
| `USER_EVALUATOR` | Avaliador (Dentista) | EVALUATOR |
| `ADM_COMMERCIAL` | Gestor Comercial | COMMERCIAL |
| `USER_COMMERCIAL` | Vendedor | COMMERCIAL |

### Sector

| Valor | Rótulo PT | Papel típico |
|-------|-----------|-------------|
| `LEADS` | Leads | Captação de clientes |
| `ATTENDANT` | Recepção | Agendamentos |
| `EVALUATOR` | Avaliação | Dentistas avaliadores |
| `COMMERCIAL` | Comercial | Fechamento de vendas |
| `ADM` | Administrativo | Administração |
| `MANAGER` | Gestão | Gerência |

### TicketStatus

| Valor | Rótulo PT | Significado |
|-------|-----------|-------------|
| `NEW` | Novo | Lead recém-criado, não contatado |
| `IN_CONTACT` | Em contato | LEADS está fazendo contato ativo |
| `SCHEDULED` | Agendado | Consulta agendada, vai para EVALUATOR |
| `IN_EVALUATION` | Em avaliação | Dentista avaliando o paciente |
| `NEGOTIATION` | Em negociação | Deal criado, COMMERCIAL negociando |
| `WIN` | Ganho | Venda fechada |
| `PENDING` | Pendente | COMMERCIAL perdeu contato; aguardando reciclagem |
| `RECYCLED` | Reciclado | Ticket marcado pelo RecycleJob; novo ticket filho criado |
| `LOSS` | Perdido | Lead definitivamente perdido |
| `POST_PROCEDURE` | Pós-procedimento | Procedimento realizado; acompanhamento pós-venda |

### CustomerSource

| Valor | Rótulo PT |
|-------|-----------|
| `ADS_PAID` | Mídia paga (ADS) |
| `ORGANIC` | Orgânico |
| `INDICATION` | Indicação |

### AdsChannel

| Valor | Rótulo PT |
|-------|-----------|
| `GOOGLE` | Google Ads |
| `META` | Meta (Facebook) |
| `INSTAGRAM` | Instagram |
| `TIKTOK` | TikTok |
| `OUTER` | Outro canal externo |

### ContactChannel

| Valor | Rótulo PT |
|-------|-----------|
| `ORGANIC` | Orgânico |
| `REFERRAL` | Indicação |
| `FACEBOOK` | Facebook |
| `INSTAGRAM` | Instagram |
| `WHATSAPP` | WhatsApp |
| `PHONE_CALL` | Ligação telefônica |
| `WEBSITE_FROM` | Site da clínica |
| `OTHER` | Outro |

### PaymentMethod

| Valor | Rótulo PT | `conversionFactor` | Uso |
|-------|-----------|-------------------|-----|
| `PIX` | PIX | `1.00` | expectedCash = finalValue × 1.00 |
| `CASH` | Dinheiro | `1.00` | expectedCash = finalValue × 1.00 |
| `DEBIT_CARD` | Cartão de débito | `0.98` | expectedCash = finalValue × 0.98 |
| `CREDIT_CARD` | Cartão de crédito | `0.97` | expectedCash = finalValue × 0.97 |
| `INSTALLMENT` | Parcelado | `0.85` | expectedCash = finalValue × 0.85 |
| `DENTAL_INSURANCE` | Convênio odontológico | `0.90` | expectedCash = finalValue × 0.90 |

> `conversionFactor` representa o percentual líquido que a clínica efetivamente recebe após taxas. Usado no analytics para calcular `expectedCash` (valor esperado em caixa).

### Resource

`CUSTOMER`, `USER`, `TICKET`, `CONTACT_LOG`, `DEAL`, `ANALYTICS`, `CONFIG`

### Action

`CREATE`, `READ`, `UPDATE`, `CLOSE`, `RECYCLE`, `CONFIGURE`, `DELETE`

### PermissionScope

`GLOBAL`, `SECTOR`, `INTAKE`, `OWN`

| Valor | Significado na listagem (`search()`) |
|-------|--------------------------------------|
| `GLOBAL` | Sem recorte — vê todos os registros |
| `SECTOR` | Vê registros do próprio setor (`currentSector`; em Customer/ContactLog via `EXISTS` no ticket) |
| `INTAKE` | Vê registros dos setores de captação (`LEADS`, `ATTENDANT`) — acesso cross-sector da entrada (ADR-011) |
| `OWN` | Vê apenas os registros que o próprio usuário criou (`createdBy`; ContactLog usa `userId`) |

> O scope é resolvido no servidor (`PermissionService.getScope`) e aplicado no SQL via JPA Specifications (ADR-013). O frontend não controla nem envia o scope — apenas recebe a página já recortada.

---

## 6. Modelo de Domínio

### User (identity_db → tabela tb_users)

| Campo | Tipo Java | Nullable | Descrição |
|-------|-----------|----------|-----------|
| `id` | `UUID` | não | PK gerado automaticamente |
| `name` | `String` | não | Nome completo |
| `username` | `String` | não | Login único (usado no JWT subject) |
| `password` | `String` | não | Hash BCrypt — nunca exposto na API (campo da entidade chama-se `password`) |
| `sector` | `Sector` | não | Setor ao qual o usuário pertence |
| `role` | `Role` | não | Papel do usuário no sistema |
| `active` | `boolean` | não | Se o usuário pode logar |
| `createdBy` | `UUID` | sim | ID do usuário que criou |
| `createdAt` | `LocalDateTime` | não | @CreationTimestamp |
| `updatedAt` | `LocalDateTime` | não | @UpdateTimestamp |

**Exposto na API via UserResponseDTO:** `id, name, username, sector, role`
> `password`, `active`, `createdBy`, `createdAt`, `updatedAt` **não são expostos**.

### Customer (crm_db → tabela customers)

| Campo | Tipo Java | Nullable | Descrição |
|-------|-----------|----------|-----------|
| `id` | `UUID` | não | PK |
| `name` | `String` | não | Nome do cliente |
| `cpf` | `String` | sim | CPF formatado; constraint UNIQUE; null após anonimização |
| `phone` | `String` | não | Telefone principal; **"NULL" (string)** após anonimização |
| `phone2` | `String` | sim | Telefone secundário |
| `address` | `String` | sim | Endereço — **existe na entidade mas não há campo correspondente em nenhum DTO** (nunca é preenchido na criação/atualização; só é zerado na anonimização). Para o frontend, **não existe**. |
| `email` | `String` | sim | E-mail |
| `initialNote` | `String` (TEXT) | sim | Observação do atendente no momento da **entrada** do lead |
| `source` | `CustomerSource` | não | Origem do cliente (ADS_PAID, ORGANIC, INDICATION) |
| `adsChannel` | `AdsChannel` | sim | Canal de ADS se source=ADS_PAID. **Nome do campo JSON: `adsChannel`** (não `adChannel`) |
| `adCampaign` | `String` | sim | Nome da campanha ADS |
| `referredBy` | `UUID` | sim | UUID de outro Customer que indicou este |
| `createdBy` | `UUID` | não | UUID do usuário que cadastrou |
| `createdAt` | `LocalDateTime` | não | @CreationTimestamp |
| `updatedAt` | `LocalDateTime` | não | @UpdateTimestamp |
| `anonymized` | `boolean` | não | true = cliente anonimizado (LGPD) |

**Campos após anonimização (DELETE /customers/{id}):**
- `name` → `"CLIENTE ANONIMIZADO"`
- `cpf` → `null`
- `phone` → `"NULL"` (**atenção: string "NULL", não null**)
- `phone2` → `null`
- `email` → `null`
- `initialNote` → `null`
- `address` → `null`
- `referredBy` → `null`
- `address` → `null`
- `anonymized` → `true`
- Preservados (não tocados pela anonimização): `id`, `source`, `adsChannel`, `adCampaign`, `createdAt`, `createdBy`, `updatedAt`

> **Para o frontend:** verificar o campo `anonymized === true` antes de exibir dados do cliente. Nunca testar `name === "CLIENTE ANONIMIZADO"`.

### LeadTicket (crm_db → tabela lead_tickets)

| Campo | Tipo Java | Nullable | Descrição |
|-------|-----------|----------|-----------|
| `id` | `UUID` | não | PK |
| `customerId` | `UUID` | não | FK para Customer.id |
| `status` | `TicketStatus` | não | Status atual na esteira |
| `currentSector` | `Sector` | não | Setor responsável pelo ticket agora |
| `assignedTo` | `UUID` | sim | UUID do usuário atribuído |
| `scheduledAt` | `LocalDateTime` | sim | Data/hora do agendamento |
| `pendingAt` | `LocalDateTime` | sim | Quando entrou em PENDING |
| `closedAt` | `LocalDateTime` | sim | Quando foi WIN ou LOSS |
| `createdBy` | `UUID` | não | UUID do usuário criador |
| `previousTicketId` | `UUID` | sim | UUID do ticket anterior (reciclagem) |
| `createdAt` | `LocalDateTime` | não | @CreationTimestamp |
| `updatedAt` | `LocalDateTime` | sim | @UpdateTimestamp |
| `recycledAt` | `LocalDateTime` | sim | Quando foi reciclado |
| `procedurePerformedAt` | `LocalDateTime` | sim | Quando WIN→POST_PROCEDURE ocorreu |
| `returnScheduledAt` | `LocalDateTime` | sim | Retorno agendado pós-procedimento |

### ContactLog (crm_db → tabela contact_logs) — IMUTÁVEL

| Campo | Tipo Java | Nullable | Descrição |
|-------|-----------|----------|-----------|
| `id` | `UUID` | não | PK |
| `ticketId` | `UUID` | não | FK para LeadTicket.id |
| `userId` | `UUID` | não | UUID do usuário que registrou |
| `username` | `String` | sim | Nome do usuário no momento da criação — snapshot imutável (ADR-019); `null` em logs anteriores à feature |
| `channel` | `ContactChannel` | não | Canal do contato |
| `note` | `String` (500 chars) | não | Descrição da interação |
| `statusBefore` | `TicketStatus` | sim | Status antes (preenchido em logs automáticos de transição) |
| `statusAfter` | `TicketStatus` | sim | Status depois (preenchido em logs automáticos de transição) |
| `occurredAt` | `LocalDateTime` | não | Momento real da interação |
| `createdAt` | `LocalDateTime` | não | @CreationTimestamp |

> Sem UPDATE, sem DELETE — ADR-003. Logs criados manualmente pelo usuário têm `statusBefore`/`statusAfter` = null. Logs gerados automaticamente pela transição de status têm ambos preenchidos com `channel = OTHER`.
> `username` é um snapshot gravado na criação (ContactLog é imutável após criar, ADR-003 + ADR-019) — elimina lookup ao `UserRepository` em tempo de leitura.

### Deal (crm_db → tabela deals)

| Campo | Tipo Java | Nullable | Descrição |
|-------|-----------|----------|-----------|
| `id` | `UUID` | não | PK |
| `ticketId` | `UUID` | não | FK para LeadTicket.id |
| `createdBySector` | `Sector` | sim | Sempre EVALUATOR (quem cria o deal) |
| `createdBy` | `UUID` | não | UUID do avaliador |
| `procedures` | `List<DealProcedure>` (JSONB) | não | Procedimentos planejados |
| `totalValue` | `BigDecimal` | não | Soma dos tableValue × quantity |
| `discountPct` | `BigDecimal` | sim | % de desconto (0-100) |
| `discountApprovedBy` | `UUID` | sim | UUID de quem aprovou desconto acima do limite |
| `finalValue` | `BigDecimal` | sim | totalValue × (1 - discountPct/100) |
| `paymentMethod` | `PaymentMethod` | sim | Definido no fechamento |
| `closedBy` | `UUID` | sim | UUID do vendedor que fechou |
| `closedAt` | `LocalDateTime` | sim | Quando foi fechado |
| `archived` | `boolean` | não | true = deal arquivado pelo RecycleJob |
| `createdAt` | `LocalDateTime` | não | @CreationTimestamp |
| `updatedAt` | `LocalDateTime` | sim | @UpdateTimestamp |

### DealProcedure (record JSON dentro de Deal)

| Campo | Tipo | Nullable | Descrição |
|-------|------|----------|-----------|
| `name` | `String` | não | Nome do procedimento |
| `code` | `String` | sim | Código tabela TUSS ou interno |
| `tableValue` | `BigDecimal` | não | Valor unitário de tabela |
| `quantity` | `int` | não | Quantidade (min=1) |
| `note` | `String` | sim | **Contexto clínico do avaliador** para ESTE procedimento — justificativa, observação técnica |

### DealHistory (crm_db → tabela deal_history) — IMUTÁVEL

| Campo | Tipo Java | Nullable | Descrição |
|-------|-----------|----------|-----------|
| `id` | `UUID` | não | PK |
| `dealId` | `UUID` | não | FK para Deal.id |
| `changedBy` | `UUID` | não | UUID do usuário que alterou |
| `changedBySector` | `Sector` | não | Setor do usuário |
| `fieldChanged` | `String` | sim | Campo alterado |
| `valueBefore` | `String` | não | JSON do estado anterior |
| `valueAfter` | `String` | não | JSON do estado posterior |
| `occurredAt` | `LocalDateTime` | não | Timestamp da alteração |

---

## 7. Endpoints por Módulo

### 7.1 Auth

#### POST /api/v1/authentication/login

```json
// Request
{ "username": "joao.silva", "password": "Senha@123" }

// Response 200
{ "token": "eyJ...", "type": "Bearer" }
```

| Erro | Causa |
|------|-------|
| 400 | username ou password em branco |
| 401 | credenciais inválidas (sem corpo) |

---

#### POST /api/v1/authentication/refresh

```json
// Request
{ "token": "eyJ..." }

// Response 200
{ "token": "eyJ...novo...", "type": "Bearer" }
```

| Erro | Causa |
|------|-------|
| 400 | token em branco |
| 401 | assinatura inválida (adulterada) — sem corpo |

---

### 7.2 Users

#### POST /api/v1/users

**Permissão:** `USER:CREATE` (ADM_SYSTEM apenas — único papel com esta permissão na matriz)

```json
// Request
{
  "name": "João Silva",
  "username": "joao.silva",
  "password": "Senha@123",
  "sector": "LEADS",
  "role": "USER_LEADS"
}
```

| Campo | Tipo | Validação |
|-------|------|-----------|
| `name` | `string` | `@NotBlank @NotNull` |
| `username` | `string` | `@NotBlank` |
| `password` | `string` | `@NotBlank @Size(min=8)` — texto plano; o backend faz o hash BCrypt |
| `sector` | `Sector` | `@NotNull` |
| `role` | `Role` | `@NotNull` |

> ⚠️ O campo do body é **`password`** (não `passwordHash`). Envie a senha em texto plano; o backend
> aplica BCrypt. `active` é forçado `true` e `createdBy` é o usuário autenticado.

```json
// Response 201
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "João Silva",
  "username": "joao.silva",
  "sector": "LEADS",
  "role": "USER_LEADS"
}
```

| Erro | Causa |
|------|-------|
| 400 | validação |
| 401 | sem token |
| 403 | sem permissão |

---

#### PATCH /api/v1/users/{username}/newPassword

**Permissão:** `USER:UPDATE` (na matriz, **só `ADM_SYSTEM`**). ⚠️ Um usuário comum **não** troca a
própria senha por este endpoint — recebe 403.

**Path param:** `username` (string) — o usuário-alvo cuja senha será trocada.

```json
// Request — APENAS newPassword
{
  "newPassword": "SenhaNova@456"
}
```

| Campo | Validação |
|-------|-----------|
| `newPassword` | `@NotBlank @Size(min=8)` |

> ⚠️ O body contém **apenas `newPassword`**. Não existem campos `username` (vem do path) nem
> `oldPassword` no body — **não há verificação da senha antiga**.

**Response 200:** `UserResponseDTO`

| Erro | Causa |
|------|-------|
| 403 | papel sem `USER:UPDATE` (qualquer um que não seja ADM_SYSTEM) |
| 404 | username não encontrado |
| 422 | a nova senha é **igual** à senha atual (`"Nova senha não deve ser igual a senha atual."`) |

---

#### GET /api/v1/users

**Permissão:** `USER:READ` (só `ADM_SYSTEM`).

**Query params:**

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `sector` | `Sector` | não | Filtrar por setor |
| `role` | `Role` | não | Filtrar por role |
| `page`, `size`, `sort` | Pageable | não | Paginação |

**Response 200:** `Page<UserResponseDTO>`

> Lógica de filtro (mutuamente exclusiva, **não** cumulativa, ao contrário das outras listagens): se
> `sector` **e** `role` forem ambos fornecidos → filtra por ambos; senão, se só `sector` → filtra por
> setor; caso contrário (mesmo que só `role` seja enviado) → **retorna todos**. Ou seja, enviar apenas
> `role` é ignorado.

---

#### GET /api/v1/users/{id}

**Permissão:** **nenhuma checagem de RBAC** — basta estar autenticado.  
**Path param:** `id` (UUID)  
**Response 200:** `UserResponseDTO`  
**Erro 404:** usuário não encontrado

---

#### GET /api/v1/users/username/{username}

**Permissão:** **nenhuma checagem de RBAC** — basta estar autenticado. É o endpoint usado no fluxo
pós-login para obter o `UserResponseDTO` completo a partir do `sub` do JWT.  
**Path param:** `username` (string)  
**Response 200:** `UserResponseDTO`  
**Erro 404:** usuário não encontrado

---

#### DELETE /api/v1/users/{id}

**Path param:** `id` (UUID)  
**Response 204:** sem corpo  
**Erros:** 404, 403

---

### 7.3 Customers

#### POST /api/v1/customers

Cria o cliente, abre um `LeadTicket(NEW)` automaticamente no setor do usuário logado. Se `initialNote` for fornecida, cria também um `ContactLog` com o canal informado (ou `OTHER` se ausente).

**Permissão:** `CUSTOMER:CREATE`

```json
// Request
{
  "name": "Maria Oliveira",
  "cpf": "123.456.789-09",
  "phone": "(11) 99999-8888",
  "phone2": "(11) 98888-7777",
  "email": "maria@email.com",
  "initialNote": "Cliente veio pelo Instagram, interesse em implante",
  "source": "ADS_PAID",
  "adsChannel": "INSTAGRAM",
  "adCampaign": "Campanha-Maio-2026",
  "referredBy": null,
  "channel": "INSTAGRAM"
}
```

| Campo | Tipo | Validação |
|-------|------|-----------|
| `name` | `string` | `@NotBlank` |
| `cpf` | `string` | `@CPF` (formato brasileiro), opcional |
| `phone` | `string` | `@NotBlank` |
| `phone2` | `string` | opcional |
| `email` | `string` | opcional (sem validação `@Email`) |
| `initialNote` | `string` | opcional — nota de entrada |
| `source` | `CustomerSource` | `@NotNull` |
| `adsChannel` | `AdsChannel` | opcional (relevante se source=ADS_PAID) — **nome do campo: `adsChannel`** |
| `adCampaign` | `string` | opcional |
| `referredBy` | `UUID` | opcional (relevante se source=INDICATION) |
| `channel` | `ContactChannel` | opcional — canal da nota inicial (default `OTHER` se ausente e houver `initialNote`) |

> O `ContactLog` de entrada só é criado se `initialNote` vier preenchida (não-blank). O ticket inicial
> é aberto com `currentSector` = **setor do usuário autenticado** (não o `source`).

```json
// Response 201
{
  "id": "...",
  "name": "Maria Oliveira",
  "cpf": "123.456.789-09",
  "phone": "(11) 99999-8888",
  "phone2": "(11) 98888-7777",
  "email": "maria@email.com",
  "initialNote": "Cliente veio pelo Instagram...",
  "source": "ADS_PAID",
  "adsChannel": "INSTAGRAM",
  "adCampaign": "Campanha-Maio-2026",
  "createdAt": "2026-06-03T14:30:00",
  "updatedAt": "2026-06-03T14:30:00",
  "createdBy": "uuid-do-usuario",
  "referredBy": null,
  "anonymized": false
}
```

| Erro | Causa |
|------|-------|
| 400 | CPF inválido, campos obrigatórios ausentes |
| 403 | sem permissão |
| 409 | CPF já cadastrado |

---

#### PATCH /api/v1/customers/{id}

**Permissão:** `CUSTOMER:UPDATE`

```json
// Request
{
  "id": "uuid",
  "name": "Maria Oliveira Santos",
  "cpf": "123.456.789-09",
  "phone": "(11) 99999-0000",
  "phone2": null,
  "email": "novo@email.com"
}
```

| Campo | Tipo | Validação |
|-------|------|-----------|
| `id` | `UUID` | `@NotNull` |
| `name` | `string` | `@NotBlank` |
| `cpf` | `string` | `@CPF`, opcional |
| `phone` | `string` | `@NotBlank` |
| `phone2` | `string` | opcional |
| `email` | `string` | opcional |

**Response 200:** `CustomerResponseDTO`

| Erro | Causa |
|------|-------|
| 404 | cliente não encontrado |
| 409 | CPF já pertence a outro cliente |

---

#### GET /api/v1/customers

**Permissão:** `CUSTOMER:READ`

| Param | Tipo | Obrigatório | Match |
|-------|------|-------------|-------|
| `phone` | `string` | não | **exato** (igualdade) |
| `name` | `string` | não | **exato** (igualdade — `cb.equal`); ⚠️ **não** é "contains" nem case-insensitive |
| `adsChannel` | `AdsChannel` | não | exato — **nome do param: `adsChannel`** |
| `page`, `size`, `sort` | Pageable | não | — |

> ⚠️ **Correção 1.3:** o param de canal chama-se **`adsChannel`** (não `adChannel`) e o filtro de
> `name` é **igualdade exata**, não busca parcial. Para busca parcial por nome, o backend ainda não
> oferece suporte.
>
> **Filtros são cumulativos (AND)** — ADR-013. Quando mais de um param é enviado, todos são
> aplicados simultaneamente (`phone` E `name` E `adsChannel`). A semântica anterior de "um filtro por
> prioridade" foi revogada.
>
> **Visibilidade por scope** (aplicada no SQL, transparente ao consumidor): o resultado já vem
> filtrado pelo escopo RBAC do usuário — `GLOBAL` vê tudo; `OWN` vê só os clientes que criou;
> `SECTOR`/`INTAKE` vê clientes que possuem ao menos um ticket no(s) setor(es) do escopo. O frontend
> não controla isso — apenas recebe a página já recortada.

**Response 200:** `Page<CustomerResponseDTO>`

---

#### GET /api/v1/customers/{id}

**Permissão:** `CUSTOMER:READ`  
**Response 200:** `CustomerResponseDTO`  
**Erro 404:** não encontrado

---

#### GET /api/v1/customers/cpf/{cpf}

**Permissão:** `CUSTOMER:READ`  
**Path param:** `cpf` (string — formato "123.456.789-09")  
**Response 200:** `CustomerResponseDTO`  
**Erro 404:** CPF não encontrado

---

#### DELETE /api/v1/customers/{id}

**Não deleta — anonimiza (LGPD, ADR-006)**  
**Permissão:** `CUSTOMER:DELETE`  
**Response 204:** sem corpo  
**Erros:** 404, 403

---

### 7.4 Tickets

#### POST /api/v1/tickets

Cria ticket avulso (sem criar cliente novo). Usado quando o cliente já existe e precisa de um novo ticket.

**Permissão:** `TICKET:CREATE`

```json
// Request
{
  "customerId": "uuid-do-cliente",
  "currentSector": "LEADS",
  "assignedTo": "uuid-do-usuario",
  "scheduledAt": "2026-06-10T09:00:00"
}
```

| Campo | Validação |
|-------|-----------|
| `customerId` | `@NotNull` UUID |
| `currentSector` | `@NotNull` Sector |
| `assignedTo` | opcional UUID |
| `scheduledAt` | opcional LocalDateTime |

> O ticket é criado sempre com status `NEW`.

```json
// Response 201 — LeadTicketResponseDTO
{
  "id": "...",
  "customerId": "...",
  "status": "NEW",
  "currentSector": "LEADS",
  "assignedTo": "...",
  "scheduledAt": null,
  "pendingAt": null,
  "closedAt": null,
  "createdBy": "...",
  "previousTicketId": null,
  "createdAt": "2026-06-03T14:30:00",
  "updatedAt": "2026-06-03T14:30:00",
  "recycledAt": null,
  "procedurePerformedAt": null,
  "returnScheduledAt": null
}
```

| Erro | Causa |
|------|-------|
| 404 | customerId não encontrado |
| 403 | sem permissão |

---

#### PATCH /api/v1/tickets/{id}/status

Avança ou recua o ticket na máquina de estados.  
**Permissão:** `TICKET:UPDATE`

```json
// Request
{
  "status": "SCHEDULED",
  "returnScheduledAt": null,
  "lossReason": null
}
```

| Campo | Validação | Quando obrigatório |
|-------|-----------|-------------------|
| `status` | `@NotNull TicketStatus` | sempre |
| `returnScheduledAt` | `LocalDateTime` | obrigatório em `POST_PROCEDURE → SCHEDULED` (deve ser futuro) |
| `lossReason` | `string` | obrigatório em `POST_PROCEDURE → LOSS` |

**Response 200:** `LeadTicketResponseDTO` atualizado

| Erro | Causa |
|------|-------|
| 404 | ticket não encontrado |
| 422 | transição não permitida, CPF ausente (→ SCHEDULED), returnScheduledAt passado/ausente |
| 403 | papel não tem permissão para esta transição |

---

#### GET /api/v1/tickets/{id}

**Permissão:** `TICKET:READ`  
**Response 200:** `LeadTicketResponseDTO`  
**Erro 404**

---

#### GET /api/v1/tickets

**Permissão:** `TICKET:READ`

| Param | Tipo | Obrigatório | Match |
|-------|------|-------------|-------|
| `customerId` | UUID | não | exato |
| `status` | TicketStatus | não | exato |
| `assignedTo` | UUID | não | exato |
| `page`, `size`, `sort` | Pageable | não | — |

> **Filtros são cumulativos (AND)** — ADR-013. `?status=SCHEDULED&assignedTo=X` retorna tickets
> `SCHEDULED` **E** atribuídos a X. A semântica anterior de "um filtro por prioridade" foi revogada.
>
> **Visibilidade por scope** (no SQL): `GLOBAL` vê todos os tickets; `SECTOR` vê os do próprio setor
> (`currentSector`); `INTAKE` vê os dos setores de captação (`LEADS`, `ATTENDANT`); `OWN` vê só os que
> o usuário criou. A página chega já recortada pelo escopo do papel.

**Response 200:** `Page<LeadTicketResponseDTO>`

---

### 7.5 ContactLogs

#### POST /api/v1/contact-logs

**Permissão:** `CONTACT_LOG:CREATE`

```json
// Request
{
  "ticketId": "uuid-do-ticket",
  "channel": "WHATSAPP",
  "note": "Cliente confirmou interesse, aguarda data de avaliação",
  "occurredAt": "2026-06-03T14:00:00"
}
```

| Campo | Validação |
|-------|-----------|
| `ticketId` | `@NotNull` UUID |
| `channel` | `@NotNull` ContactChannel |
| `note` | `@NotBlank` |
| `occurredAt` | `@NotNull` LocalDateTime |

```json
// Response 201
{
  "id": "...",
  "ticketId": "...",
  "userId": "...",
  "username": "João Silva",
  "channel": "WHATSAPP",
  "note": "Cliente confirmou interesse...",
  "statusBefore": null,
  "statusAfter": null,
  "occurredAt": "2026-06-03T14:00:00",
  "createdAt": "2026-06-03T14:30:05"
}
```

> `username` é o nome do usuário autenticado no momento da criação (ADR-019). Logs automáticos de
> transição de status também recebem o `username` do usuário que disparou a transição. Logs criados
> antes da v1.7 chegam com `username: null`.

---

#### GET /api/v1/contact-logs/{id}

**Response 200:** `ContactLogResponseDTO`

---

#### GET /api/v1/contact-logs

| Param | Tipo | Obrigatório |
|-------|------|-------------|
| `ticketId` | UUID | não (sem ele retorna conforme scope) |
| `page`, `size`, `sort` | Pageable | não |

> **Visibilidade por scope** (no SQL) — ADR-013: `GLOBAL` vê todos os logs; `OWN` vê só os que o
> usuário registrou (`userId`); `SECTOR`/`INTAKE` vê logs cujos tickets estão no(s) setor(es) do
> escopo (via `EXISTS` no LeadTicket). Sem `ticketId`, o resultado é a lista recortada pelo escopo —
> não necessariamente "todos".

**Response 200:** `Page<ContactLogResponseDTO>`

---

### 7.6 Deals

#### POST /api/v1/deals/{ticketId}

**Permissão:** `DEAL:CREATE`  
**Path param:** `ticketId` (UUID)

> **Pré-condição:** o ticket deve estar em `IN_EVALUATION`; caso contrário → **422**
> (`"O status atual do ticket não permite realizar a operação"`).
> **Efeito colateral:** ao criar o deal, o ticket transita para `NEGOTIATION` e `currentSector` →
> `COMMERCIAL`. `totalValue` = Σ(`tableValue` × `quantity`); `discountPct`, `finalValue`,
> `paymentMethod`, `closedBy`, `closedAt` nascem `null`; `createdBySector` = `EVALUATOR`.

```json
// Request
{
  "procedures": [
    {
      "name": "Implante dentário",
      "code": "87000082",
      "tableValue": 2500.00,
      "quantity": 2,
      "note": "Paciente necessita de 2 implantes na região posterior — osso em bom estado"
    }
  ]
}
```

| Campo | Validação |
|-------|-----------|
| `procedures` | `@NotEmpty` |
| `procedures[].name` | `@NotBlank` |
| `procedures[].tableValue` | `@NotNull BigDecimal` |
| `procedures[].quantity` | `@Min(1) int` |
| `procedures[].code` | opcional |
| `procedures[].note` | opcional — contexto clínico do avaliador |

```json
// Response 201 — DealResponseDTO
{
  "id": "...",
  "ticketId": "...",
  "createdBy": "...",
  "createdBySector": "EVALUATOR",
  "procedures": [
    {
      "name": "Implante dentário",
      "code": "87000082",
      "tableValue": 2500.00,
      "quantity": 2,
      "note": "Paciente necessita de 2 implantes..."
    }
  ],
  "totalValue": 5000.00,
  "discountPct": null,
  "discountApprovedBy": null,
  "finalValue": null,
  "paymentMethod": null,
  "closedBy": null,
  "archived": false,
  "createdAt": "2026-06-03T14:30:00",
  "closedAt": null,
  "updatedAt": "2026-06-03T14:30:00"
}
```

---

#### PATCH /api/v1/deals/{id}

Atualiza lista de procedimentos.  
**Permissão:** `DEAL:UPDATE`

```json
// Request — mesmo shape de DealCreateRequestDTO
{ "procedures": [ /* ... */ ] }
```

**Response 200:** `DealResponseDTO`

---

#### GET /api/v1/deals/ticketId/{ticketId}

**Permissão:** **nenhuma checagem RBAC neste método** (apenas autenticação). Retorna o deal
**não-arquivado** do ticket (`findByTicketIdAndArchivedFalse`).  
**Response:** `200 DealResponseDTO` se existe deal ativo; **`204 sem corpo`** se não há deal (ou só há
deal arquivado) para o ticket.

> O frontend **deve** tratar `204` como "deal ainda não criado" — não é erro. Deals arquivados pelo
> RecycleJob não aparecem aqui.

---

#### PATCH /api/v1/deals/{id}/discount

**Permissão:** `DEAL:UPDATE`

```json
// Request
{ "discountPct": 10.5 }
```

| Validação | Regra |
|-----------|-------|
| `@NotNull BigDecimal` | obrigatório |
| Faixa | `discountPct` deve estar em **0–100** (inclusive). Fora disso → **422** (`"Percentual não deve ter valores negativos ou superiores a 100"`) |
| Deal arquivado | se `archived = true` → **422** (`"O status arquivado não permite alterações"`) |

> **Efeito:** grava `discountPct`, calcula `finalValue = totalValue × (1 − discountPct/100)`
> (`HALF_UP`, 2 casas) e seta `discountApprovedBy` = usuário autenticado. ⚠️ **Não há regra de limite
> com aprovação implementada** — qualquer usuário com `DEAL:UPDATE` aplica qualquer % dentro de 0–100;
> a exceção `DiscountApprovalRequiredException` existe mas **nunca é lançada** (ver §15).

**Response 200:** `DealResponseDTO`

---

#### PATCH /api/v1/deals/{id}/status

Fecha o deal.  
**Permissão:** `DEAL:CLOSE`

```json
// Request
{ "paymentMethod": "PIX" }
```

| Campo | Validação |
|-------|-----------|
| `paymentMethod` | `@NotNull PaymentMethod` |

> **Efeitos:** seta `closedBy` = usuário autenticado, `closedAt = now`, `paymentMethod`; e **transita o
> ticket associado para `WIN`** (`ticket.closedAt = now`). Note que este caminho fecha o ticket
> **sem** passar pela máquina de estados de `PATCH /tickets/{id}/status` (não checa `TRANSITION_ROLES`),
> apenas pela permissão `DEAL:CLOSE`.
> **Erros 422:** deal arquivado (`"O status arquivado não permite alterações"`); deal já fechado
> (`closedAt != null` → `"Contrato já consta como fechado"`).

**Response 200:** `DealResponseDTO` com `closedBy`, `closedAt`, `paymentMethod` preenchidos.

---

#### GET /api/v1/deals/{id}/dealHistory

**Permissão:** `DEAL:READ`

```json
// Response 200
{
  "deal": { /* DealResponseDTO */ },
  "history": [
    {
      "dealId": "...",
      "changedBy": "...",
      "changedBySector": "EVALUATOR",
      "fieldChanged": "procedures",
      "valueBefore": "[{...}]",
      "valueAfter": "[{...}]",
      "occurredAt": "2026-06-03T15:00:00"
    }
  ]
}
```

---

### 7.7 Config

Todos os endpoints requerem `CONFIG:CONFIGURE` (apenas ADM_SYSTEM).

#### POST /api/v1/config/recycle

```json
// Request
{ "afterDays": 7 }
```

| Campo | Validação |
|-------|-----------|
| `afterDays` | `@Min(1) int` |

**Response 201:** sem corpo

---

#### GET /api/v1/config/recycle

```json
// Response 200
{
  "id": "...",
  "afterDays": 7,
  "active": true,
  "createdAt": "2026-06-01T10:00:00"
}
```

> Retorna a config **global** ativa mais recente. `sector` é omitido (ADR-007).
> Quando nenhuma config foi cadastrada ainda, retorna `200` com body `null`. O frontend deve tratar `null` como estado "não configurado" e exibir o formulário de criação.

| Resposta | Causa |
|----------|-------|
| 200 + body | Config ativa encontrada |
| 200 + null | Nenhuma `RecycleConfig` cadastrada ainda — exibir estado vazio com botão de criação |
| 403 | sem permissão (`CONFIG:CONFIGURE` — apenas `ADM_SYSTEM`) |

---

#### POST /api/v1/config/bonus

```json
// Request
{
  "sector": "COMMERCIAL",
  "role": "USER_COMMERCIAL",
  "metricKey": "closedDeals",
  "bonusPct": 5.0,
  "targetValue": 10000.00,
  "periodRef": "2026-06"
}
```

| Campo | Validação |
|-------|-----------|
| `sector` | `@NotNull Sector` |
| `role` | `@NotNull Role` |
| `metricKey` | `@NotBlank String` |
| `bonusPct` | `@NotNull @Positive BigDecimal` |
| `targetValue` | opcional BigDecimal |
| `periodRef` | `@NotBlank String` (ex: "2026-06") |

**Response 201:** sem corpo

---

#### GET /api/v1/config/bonus?sector=COMMERCIAL

**Query param:** `sector` (Sector, obrigatório)  
**Response 200:** `List<BonusConfigResponseDTO>`

---

#### POST /api/v1/config/ads-investment

```json
// Request
{
  "channel": "INSTAGRAM",
  "campaign": "Campanha-Implante-Jun26",
  "amount": 3500.00,
  "periodStart": "2026-06-01",
  "periodEnd": "2026-06-30"
}
```

| Campo | Validação |
|-------|-----------|
| `channel` | `@NotNull AdsChannel` |
| `campaign` | opcional String |
| `amount` | `@NotNull @Positive BigDecimal` |
| `periodStart` | `@NotNull LocalDate` |
| `periodEnd` | `@NotNull LocalDate` |

**Response 201:** sem corpo

---

#### GET /api/v1/config/ads-investment?channel=INSTAGRAM

**Query param:** `channel` (AdsChannel, obrigatório)  
**Response 200:** `List<AdsInvestmentResponseDTO>`

---

## 8. RBAC — Matriz Completa

### Matriz role × resource × action × scope

> **Fonte:** `PermissionSeeder.run()` — esta é a matriz **exata** semeada no primeiro boot (uma regra
> por linha; `allowed = true`). Difere das versões anteriores deste contrato: agora usa `INTAKE` para
> os papéis de captação, concede `ANALYTICS:READ` a **todos** os papéis e dá `CUSTOMER:READ` aos
> avaliadores.

| Role | Resource | Action | Scope |
|------|----------|--------|-------|
| ADM_SYSTEM | USER | CREATE / READ / UPDATE / DELETE | GLOBAL |
| ADM_SYSTEM | CUSTOMER | CREATE / READ / UPDATE / DELETE | GLOBAL |
| ADM_SYSTEM | TICKET | CREATE / UPDATE / READ / RECYCLE | GLOBAL |
| ADM_SYSTEM | CONTACT_LOG | CREATE / READ | GLOBAL |
| ADM_SYSTEM | DEAL | CREATE / READ / UPDATE / CLOSE | GLOBAL |
| ADM_SYSTEM | ANALYTICS | READ | GLOBAL |
| ADM_SYSTEM | CONFIG | CONFIGURE | GLOBAL |
| ADM_LEADS | CUSTOMER | CREATE | SECTOR |
| ADM_LEADS | CUSTOMER | READ / UPDATE | INTAKE |
| ADM_LEADS | TICKET | CREATE | SECTOR |
| ADM_LEADS | TICKET | READ / UPDATE | INTAKE |
| ADM_LEADS | CONTACT_LOG | CREATE | SECTOR |
| ADM_LEADS | CONTACT_LOG | READ | INTAKE |
| ADM_LEADS | ANALYTICS | READ | SECTOR |
| USER_LEADS | CUSTOMER | CREATE / UPDATE | OWN |
| USER_LEADS | CUSTOMER | READ | INTAKE |
| USER_LEADS | TICKET | CREATE | OWN |
| USER_LEADS | TICKET | READ | INTAKE |
| USER_LEADS | TICKET | UPDATE | SECTOR |
| USER_LEADS | CONTACT_LOG | CREATE | OWN |
| USER_LEADS | CONTACT_LOG | READ | SECTOR |
| USER_LEADS | ANALYTICS | READ | OWN |
| USER_ATTENDANT | CUSTOMER | CREATE | OWN |
| USER_ATTENDANT | CUSTOMER | READ / UPDATE | INTAKE |
| USER_ATTENDANT | TICKET | READ / UPDATE | INTAKE |
| USER_ATTENDANT | CONTACT_LOG | CREATE | OWN |
| USER_ATTENDANT | CONTACT_LOG | READ | INTAKE |
| USER_ATTENDANT | ANALYTICS | READ | OWN |
| ADM_EVALUATOR | CUSTOMER | READ | SECTOR |
| ADM_EVALUATOR | DEAL | CREATE / READ / UPDATE | SECTOR |
| ADM_EVALUATOR | TICKET | READ / UPDATE | SECTOR |
| ADM_EVALUATOR | CONTACT_LOG | READ | GLOBAL |
| ADM_EVALUATOR | ANALYTICS | READ | SECTOR |
| USER_EVALUATOR | CUSTOMER | READ | GLOBAL |
| USER_EVALUATOR | DEAL | CREATE / READ / UPDATE | OWN |
| USER_EVALUATOR | TICKET | READ / UPDATE | SECTOR |
| USER_EVALUATOR | CONTACT_LOG | READ | GLOBAL |
| USER_EVALUATOR | ANALYTICS | READ | OWN |
| ADM_COMMERCIAL | DEAL | READ / UPDATE / CLOSE | SECTOR |
| ADM_COMMERCIAL | TICKET | READ / UPDATE / CLOSE | SECTOR |
| ADM_COMMERCIAL | CUSTOMER | READ | SECTOR |
| ADM_COMMERCIAL | CONTACT_LOG | READ | SECTOR |
| ADM_COMMERCIAL | ANALYTICS | READ | SECTOR |
| USER_COMMERCIAL | DEAL | READ | OWN |
| USER_COMMERCIAL | DEAL | UPDATE | SECTOR |
| USER_COMMERCIAL | DEAL | CLOSE | OWN |
| USER_COMMERCIAL | TICKET | READ | SECTOR |
| USER_COMMERCIAL | TICKET | UPDATE / CLOSE | OWN |
| USER_COMMERCIAL | CUSTOMER | READ | SECTOR |
| USER_COMMERCIAL | CONTACT_LOG | READ | GLOBAL |
| USER_COMMERCIAL | ANALYTICS | READ | OWN |

> **Notas:**
> - **`TICKET:CLOSE`** é semeado para os papéis COMMERCIAL, mas **nenhum endpoint o consome** (o fecho
>   do deal usa `DEAL:CLOSE`; a mudança de status usa `TICKET:UPDATE`). É efetivamente inerte hoje.
> - **`USER:*`** existe só para `ADM_SYSTEM`. Nenhum outro papel cria/lista/atualiza/deleta usuários.
> - **`CONFIG:CONFIGURE`** existe só para `ADM_SYSTEM` → todo o módulo `/config` é exclusivo do admin.

### Lógica de resolveScope (`PermissionService`)

```
canAccess(user, resource, action, targetSector, targetOwnerId):
  1. getScope: busca regra (role + sector + resource + action)
  2. Fallback: regra (role + resource + action) sem sector
  3. Se nenhuma regra ou allowed=false → Optional.empty() → NEGA (403)
  4. resolveScope(scope):
     GLOBAL → sempre PERMITE
     SECTOR → PERMITE se user.sector == targetSector
     OWN    → PERMITE se user.id == targetOwnerId
     INTAKE → PERMITE se user.sector ∈ {LEADS, ATTENDANT} E targetSector ∈ {LEADS, ATTENDANT}
```

> ⚠️ **Consequência prática do `targetSector`/`targetOwnerId`:** em operações de recurso único, o
> backend passa o setor/dono do **recurso alvo** (ex.: `ticket.currentSector`, `customer.createdBy`).
> Por isso, p.ex., um `ADM_LEADS` (escopo `INTAKE` em `TICKET:UPDATE`) só consegue atualizar tickets
> cujo `currentSector` ainda seja `LEADS` ou `ATTENDANT`; assim que o ticket vai para `EVALUATOR`/
> `COMMERCIAL`, ele perde o acesso. Já um `USER_LEADS` tem `TICKET:UPDATE` em escopo `SECTOR`, então
> só atualiza tickets com `currentSector == LEADS`.

### Orientação para o frontend

**O que o frontend deve esconder** (baseado na capacidade do papel, sem checar scope):

| Role | Itens ocultos na UI |
|------|---------------------|
| USER_ATTENDANT | Menu de Deals, botão criar ticket, transições LOSS e IN_CONTACT |
| USER_LEADS / ADM_LEADS | Menu de Deals |
| USER_EVALUATOR / ADM_EVALUATOR | Botão fechar deal (apenas cria/atualiza) |
| USER_COMMERCIAL / ADM_COMMERCIAL | Botão criar deal |

**O backend sempre enforce o scope.** O frontend esconde por capacidade para melhor UX, mas o 403 é a rede de segurança real.

---

## 9. Capacidades e Navegação por Papel

### ADM_SYSTEM

- **Cria/edita:** usuários, clientes, tickets, deals, configs
- **Lê:** tudo (GLOBAL)
- **Telas visíveis:** todas
- **Rota inicial pós-login:** `/dashboard`
- **Analytics:** GLOBAL — dashboard completo

---

### ADM_LEADS

- **Cria:** clientes, tickets (escopo `SECTOR`), logs de contato
- **Lê/edita:** clientes e tickets em escopo **`INTAKE`** (recursos cujo ticket está em `LEADS` ou `ATTENDANT`)
- **Lê:** contact_log (`INTAKE`)
- **Não acessa:** deals, config, USER
- **Analytics:** `ANALYTICS:READ:SECTOR` — acessa `/conversion` e `/dropoff` filtrados ao próprio setor (ADR-015); `/dashboard` continua restrito a GLOBAL (§13)
- **Rota inicial sugerida:** `/clientes`

### USER_LEADS

- **Cria:** clientes/tickets (`OWN`), logs de contato (`OWN`)
- **Lê:** clientes/tickets em `INTAKE`; **atualiza** tickets em escopo `SECTOR` (só `currentSector==LEADS`)
- **Lê:** contact_log (`SECTOR`)
- **Analytics:** `ANALYTICS:READ:OWN` — acessa `/user-performance/{próprio-id}` (§13)
- **Rota inicial sugerida:** `/clientes`

---

### USER_ATTENDANT

- **Cria:** clientes (`OWN`), logs de contato (`OWN`)
- **Lê/atualiza:** clientes e tickets em escopo **`INTAKE`** (`LEADS`/`ATTENDANT`)
- **Não pode:** criar ticket; transição **LOSS** e transição **IN_CONTACT** (bloqueio explícito → 403)
- **Analytics:** `ANALYTICS:READ:OWN` — acessa `/user-performance/{próprio-id}` (§13)
- **Rota inicial sugerida:** `/atendimentos`

---

### ADM_EVALUATOR

- **Cria/edita:** deals (`SECTOR`); edita tickets (`SECTOR`)
- **Lê:** clientes (`SECTOR`), contact_log (`GLOBAL` — histórico de captação completo)
- **Analytics:** `SECTOR` — acessa `/conversion` e `/dropoff` filtrados ao próprio setor (ADR-015); `/dashboard` restrito a GLOBAL (§13)
- **Rota inicial sugerida:** `/avaliacoes`

### USER_EVALUATOR

- **Cria/edita:** deals (`OWN`)
- **Edita/lê:** tickets (`SECTOR`)
- **Lê:** clientes (`GLOBAL`), contact_log (`GLOBAL`)
- **Analytics:** `OWN` — acessa `/user-performance/{próprio-id}` (§13)
- **Rota inicial sugerida:** `/avaliacoes`

---

### ADM_COMMERCIAL

- **Edita/fecha:** deals (`SECTOR`)
- **Lê/edita:** tickets (`SECTOR`); lê clientes (`SECTOR`), contact_log (`SECTOR`)
- **Não cria:** deals, tickets, usuários
- **Analytics:** `SECTOR` — acessa `/conversion` e `/dropoff` filtrados ao próprio setor (ADR-015); `/dashboard` restrito a GLOBAL (§13)
- **Rota inicial sugerida:** `/negociacoes`

### USER_COMMERCIAL

- **Lê/fecha:** deals (`OWN`); **atualiza** deals em escopo **`SECTOR`** (pode editar deal criado por
  outro membro do setor, mas só lê/fecha os próprios)
- **Lê** tickets (`SECTOR`); **edita/fecha** tickets (`OWN`); lê clientes (`SECTOR`), contact_log (`GLOBAL`)
- **Não cria:** deals, tickets
- **Analytics:** `OWN` — acessa `/user-performance/{próprio-id}` (§13)
- **Rota inicial sugerida:** `/negociacoes`

---

> **Regra de ouro (revisada 1.4 — ADR-015):** **todos** os papéis têm `ANALYTICS:READ` semeado.
> Com a ADR-015 o scope é resolvido uma vez no entry point de cada método:
> `GLOBAL` acessa `/dashboard` (dados completos); `SECTOR` acessa `/conversion` e `/dropoff` filtrados
> ao próprio setor; `OWN` acessa `/user-performance/{próprio-id}` (qualquer outro `targetUserId` → 403).
> Endpoints `/ads-roi`, `/bonus/{id}` e `/post-procedure` foram removidos — dados disponíveis apenas
> dentro de `/dashboard`. Detalhe em §13.

---

## 10. Máquina de Estados do Ticket

### ALLOWED_TRANSITIONS

```
NEW           → { IN_CONTACT }
IN_CONTACT    → { SCHEDULED, LOSS }
SCHEDULED     → { IN_EVALUATION }
IN_EVALUATION → { NEGOTIATION, LOSS }
NEGOTIATION   → { WIN, PENDING }
PENDING       → { RECYCLED }
RECYCLED      → { NEW }
WIN           → { POST_PROCEDURE }
POST_PROCEDURE→ { SCHEDULED, LOSS }
```

**Estados terminais sem transição:** `LOSS` (não há saída)

### TRANSITION_ROLES

Apenas algumas transições têm restrição de papel específica:

| Destino | Papéis permitidos |
|---------|-------------------|
| `WIN` | USER_COMMERCIAL, ADM_COMMERCIAL, ADM_SYSTEM |
| `LOSS` | USER_LEADS, ADM_LEADS, ADM_SYSTEM |
| `POST_PROCEDURE` | USER_ATTENDANT, USER_LEADS, ADM_LEADS, ADM_SYSTEM |

> Transições **sem** entrada na TRANSITION_ROLES (ex: IN_CONTACT, SCHEDULED, IN_EVALUATION, NEGOTIATION, PENDING, RECYCLED) não têm restrição de papel além da permissão RBAC `TICKET:UPDATE`.

### Restrições adicionais por papel

| Papel | Transição bloqueada |
|-------|---------------------|
| USER_ATTENDANT | `LOSS` (qualquer origem) |
| USER_ATTENDANT | `IN_CONTACT` (qualquer origem) |

### Invariantes de negócio

| Condição | Erro |
|----------|------|
| `→ SCHEDULED` e `customer.cpf` é null/blank | 422: "CPF é obrigatório para a formalização do agendamento." |
| `POST_PROCEDURE → SCHEDULED` e `returnScheduledAt` é null ou no passado | 422: "returnScheduledAt é obrigatório e deve ser uma data futura." |
| `POST_PROCEDURE → LOSS` e `lossReason` é null/blank | 422: "lossReason é obrigatório para registrar uma perda." |

### Efeitos colaterais por transição

| Transição (origem→destino) | Campos alterados no ticket | currentSector muda? | ContactLog automático |
|---------------------------|---------------------------|--------------------|-----------------------|
| qualquer → `WIN` | `closedAt = now` | não | note: "Status changed: {A} → WIN", channel=OTHER |
| qualquer → `PENDING` | `pendingAt = now` | não | note: "Status changed: {A} → PENDING", channel=OTHER |
| qualquer → `RECYCLED` | `recycledAt = now` | não | note: "Status changed: {A} → RECYCLED", channel=OTHER |
| qualquer → `LOSS` | `closedAt = now` | não | note: "Status changed: {A} → LOSS", channel=OTHER |
| `WIN → POST_PROCEDURE` | `procedurePerformedAt = now` | **→ LEADS** | note: "Procedimento realizado. Início do acompanhamento pós-procedimento.", channel=OTHER |
| `POST_PROCEDURE → SCHEDULED` | `scheduledAt = returnScheduledAt` | **→ EVALUATOR** | note: "Retorno agendado para {returnScheduledAt}.", channel=OTHER |
| `POST_PROCEDURE → LOSS` | `closedAt = now` | não | note: `lossReason` (o texto enviado), channel=OTHER |
| demais transições | nenhum campo extra | não | note: "Status changed: {antes} → {depois}", channel=OTHER |

> **Atenção:** Todos os ContactLogs automáticos de transição têm `statusBefore` e `statusAfter` preenchidos, enquanto os logs manuais (criados via `POST /contact-logs`) têm ambos como `null`.

---

## 11. Reciclagem e No-Show

### RecycleConfig (global, ADR-007)

- Configurada via `POST /api/v1/config/recycle` com `{ afterDays: N }`
- **Uma única config global** ativa por vez (sem segmentação por setor)
- Consultada via `GET /api/v1/config/recycle`

### RecycleJob

- Executa diariamente às **02:00 AM** (cron `0 0 2 * * *`)
- Busca tickets com `status = PENDING` e `pendingAt < now`
- Para cada ticket:
  1. Calcula `ChronoUnit.DAYS.between(pendingAt, now)`
  2. Busca config pelo setor do ticket; fallback: config global (`sector = null`)
  3. Se `days >= config.afterDays`:
     - Arquiva o deal ativo do ticket (`archived = true`)
     - Define `ticket.status = RECYCLED` e `ticket.recycledAt = now`
     - Cria novo `LeadTicket(status=NEW, customerId=mesmo, currentSector=LEADS,
       createdBy=ticket.createdBy, previousTicketId=ticket.id)`

> ✅ O ticket-filho criado pelo RecycleJob **agora tem** `currentSector = LEADS` e `createdBy` herdado
> do ticket original (a LACUNA documentada em versões anteriores está resolvida). `assignedTo` do filho
> nasce `null`.

### Cadeia de tickets via previousTicketId

```
Ticket A (RECYCLED) ←─ Ticket B.previousTicketId
Ticket B (RECYCLED) ←─ Ticket C.previousTicketId
Ticket C (NEW)      ← ticket atual
```

Para reconstruir o histórico completo de um cliente: navegar pela cadeia de `previousTicketId`.

### No-show pós-agendamento

**Situação:** cliente entrou na clínica (SCHEDULED → IN_EVALUATION ou POST_PROCEDURE) e não compareceu ou desistiu.

**Como o backend modela hoje:** não há status específico para "no-show". O fluxo esperado é:
- `IN_EVALUATION → LOSS` (recusou o tratamento) — para caso o avaliador decide que o cliente não vai voltar
- `POST_PROCEDURE → LOSS` (com lossReason) — para caso o paciente não retorna ao pós-procedimento

**LACUNA:** não existe uma transição ou estado explícito de "no-show após agendamento". Se o cliente agendou mas não compareceu à avaliação (`SCHEDULED`), o ticket fica preso em `SCHEDULED` sem progressão. A decisão de reabrir ou dar como perda cabe ao gestor via mudança manual de status. Recomendação futura: adicionar `NO_SHOW` como status ou permitir `SCHEDULED → IN_CONTACT` para re-contato.

---

## 12. Separação de Conceitos

### Onde mora cada "observação" do cliente

| Fase do cliente | Entidade.campo | Canal | Propósito |
|-----------------|---------------|-------|-----------|
| Entrada do lead | `Customer.initialNote` | `CustomerCreateRequestDTO.channel` | Contexto da primeira interação — quem foi, o que disse, canal de origem |
| Aquisição/relacionamento | `ContactLog.note` + `ContactLog.channel` | campo do DTO | Histórico de cada interação durante a captação; **base para métricas de captação** |
| Avaliação clínica | `Deal.procedures[].note` | — | Contexto técnico do avaliador por procedimento — justificativa clínica |

### A esteira é dimensão separada

`TicketStatus` representa **onde o cliente está no processo**, não "o que aconteceu com ele". Ele é ortogonal às observações acima.

### Acoplamento atual a observar

Toda transição de status gera automaticamente um `ContactLog` com `channel = OTHER`, `statusBefore` e `statusAfter` preenchidos. Isso **mistura** logs de relacionamento (captação) com logs técnicos de transição de estado na mesma tabela.

**Consequência:** métricas de captação baseadas em `ContactLog` incluem ruído de logs de transição automáticos. Para análise pura de captação, o frontend deve filtrar ContactLogs com `statusBefore === null && statusAfter === null` (logs manuais).

> **Discriminador atual (implícito):**
> - Log manual → `statusBefore = null`, `statusAfter = null`, `channel` = qualquer valor
> - Log automático → `statusBefore != null`, `statusAfter != null`, `channel = OTHER`
>
> ⚠️ **Evolução futura planejada:** campo `logType: 'MANUAL' | 'SYSTEM'` tornará essa distinção explícita — ver Seção 15.

---

## 13. Config & Analytics

### Config — shapes já detalhados em 7.7

### Analytics

A maioria dos endpoints analytics recebe `DataRangeDTO` como `@ModelAttribute` (query params):

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `from` | `LocalDate` (`YYYY-MM-DD`) | sim | Início do período |
| `to` | `LocalDate` (`YYYY-MM-DD`) | sim | Fim do período |

> Os campos do `DataRangeDTO` são literalmente **`from`** e **`to`**. (`bonus/{id}` não usa período —
> usa `periodRef`.)

#### ⚠️ Acesso efetivo aos endpoints de analytics (importante)

Todos os papéis têm `ANALYTICS:READ` semeado, **mas** o backend chama `checkOrThrow` de formas
diferentes por endpoint, e o `resolveScope` compara contra `targetSector`/`targetOwnerId`:

| Endpoint | Scope aceito | Quem acessa | Comportamento por scope |
|----------|--------------|-------------|------------------------|
| `GET /analytics/dashboard` | GLOBAL only | `ADM_SYSTEM` | Escopo não-GLOBAL → **403** |
| `GET /analytics/conversion` | GLOBAL + SECTOR | `ADM_SYSTEM`, `ADM_LEADS`, `ADM_EVALUATOR`, `ADM_COMMERCIAL` | GLOBAL: sem filtro; SECTOR: `effectiveSector = user.getSector()`, ignora o `sector` do query param |
| `GET /analytics/dropoff` | GLOBAL + SECTOR | `ADM_SYSTEM`, `ADM_LEADS`, `ADM_EVALUATOR`, `ADM_COMMERCIAL` | GLOBAL: retorna os 3 setores; SECTOR: retorna apenas o setor do usuário |
| `GET /analytics/user-performance/{targetUserId}` | GLOBAL + OWN | `ADM_SYSTEM`, `USER_LEADS`, `USER_ATTENDANT`, `USER_EVALUATOR`, `USER_COMMERCIAL` | OWN: `targetUserId` deve ser o próprio `user.id` (caso contrário → **403**); GLOBAL: qualquer `targetUserId`. Papéis SECTOR → **403** |

> **ADR-015 (2026-06-14):** a implementação anterior passava `(null, null)` ao `checkOrThrow` em todos
> os métodos de analytics, bloqueando qualquer papel não-GLOBAL. Com a ADR-015, o scope é resolvido via
> `getScope()` no entry point de cada método e a visibilidade é aplicada nos dados (não apenas no check).
> Endpoints `/ads-roi`, `/bonus/{id}` e `/post-procedure` foram removidos do contrato público — seus
> dados ficam dentro de `GET /analytics/dashboard` (GLOBAL apenas).

---

#### GET /api/v1/analytics/conversion

**Params:** `sector` (Sector) + `from/to`

> ⚠️ **Comportamento por scope (ADR-015):** o parâmetro `sector` é relevante apenas para escopo
> `GLOBAL`. Com escopo `SECTOR`, o backend ignora o `sector` recebido e usa `user.getSector()`
> como `effectiveSector` — enviar `sector=EVALUATOR` com um `ADM_LEADS` retorna dados de `LEADS`.
> O campo `sector` na response reflete o `effectiveSector` aplicado.

> ⚠️ **Semântica de `dealCreatedCount` e `closedCount` (v1.8):**
> `dealCreatedCount` conta tickets com status ∈ `{NEGOTIATION, WIN, PENDING, RECYCLED, POST_PROCEDURE}` —
> inclui `POST_PROCEDURE` porque tickets que avançaram de `WIN` para o acompanhamento pós-venda
> pertencem ao funil comercial. `closedCount` conta tickets onde `closedAt != null`: isso captura
> tickets atualmente em `WIN` (cujo `closedAt` é setado pelo `DEAL:CLOSE`) **e** tickets em
> `POST_PROCEDURE` (cujo `closedAt` persiste da transição WIN). Com `effectiveSector = COMMERCIAL`,
> o filtro de setor inclui explicitamente tickets em `POST_PROCEDURE` mesmo que seu `currentSector`
> tenha sido alterado para `LEADS` pela transição `WIN→POST_PROCEDURE`.

```json
// Response 200
{
  "sector": "LEADS",
  "captureCount": 100,
  "scheduledCount": 60,
  "dealCreatedCount": 40,
  "closedCount": 25,
  "leadsConversionPct": 60.00,
  "evaluationConversionPct": 66.67,
  "commercialConversionPct": 62.50
}
```

---

#### GET /api/v1/analytics/dropoff

**Params:** `from/to` apenas

> ⚠️ **Comportamento por scope (ADR-015):** com escopo `GLOBAL` retorna os 3 setores (`LEADS`,
> `EVALUATOR`, `COMMERCIAL`). Com escopo `SECTOR`, retorna apenas o DTO do setor do usuário (array
> com 1 elemento).

```json
// Response 200 — List<SectorDropOffResultDTO>
[
  {
    "sector": "LEADS",
    "entryCount": 100,
    "exitCount": 60,
    "lossCount": 40,
    "dropOffPct": 40.00
  }
]
```

---

#### GET /api/v1/analytics/user-performance/{targetUserId}

**Path param:** `targetUserId` (UUID)  
**Params:** `from/to`

> ⚠️ **Guarda OWN (ADR-015):** papéis com escopo `OWN` só podem consultar o próprio `targetUserId`.
> Enviar o UUID de outro usuário → **403**. Papéis com escopo `GLOBAL` (`ADM_SYSTEM`) podem consultar
> qualquer usuário. Papéis com escopo `SECTOR` → **403** (não têm acesso a este endpoint).

> ⚠️ **Range de mês único (ADR-016):** este endpoint carrega bônus, que é **mensal**. O range `from/to`
> deve estar contido em **um único mês calendário**. Range que cruza meses (ex.: `from=2026-05-25 &
> to=2026-06-05`) → **422 Unprocessable Content**. O campo `bonusPeriodRef` na resposta informa
> explicitamente o mês a que o `calculatedBonus` se refere (derivado do mês do `from`).

```json
// Response 200
{
  "userId": "...",
  "name": "João Silva",
  "sector": "COMMERCIAL",
  "totalAssigned": 30,
  "totalConverted": 18,
  "conversionPct": 60.00,
  "avgTicketValue": 4500.00,
  "expectedCash": 4365.00,
  "calculatedBonus": 218.25,
  "bonusPeriodRef": "2026-06"
}
```

> `expectedCash = finalValue × paymentMethod.conversionFactor`
> `calculatedBonus` reflete o mês inteiro de `bonusPeriodRef`; as demais métricas refletem o range `from..to`.

---

#### GET /api/v1/analytics/dashboard

**Permissão:** GLOBAL only — apenas `ADM_SYSTEM`  
**Params:** `from/to` — **range livre** (ADR-017): aceita qualquer intervalo ("últimos 30 dias", trimestre, etc.). Sem guard de mês único.

```json
// Response 200
{
  "period": { "from": "2026-05-16", "to": "2026-06-15" },
  "adsRoi": [ /* List<AdsRoiResultDTO> */ ],
  "stageConversion": { /* StageConversionResultDTO */ },
  "sectorDropOff": [ /* List<SectorDropOffResultDTO> */ ],
  "topPerformers": [ /* List<UserPerformanceResultDTO> */ ],
  "postProcedures": { /* PostProcedureResultDTO */ },
  "totalExpectedCash": 125000.00
}
```

> `postProcedures` contém as métricas pós-procedimento do período (`totalPostProcedure`,
> `returnedCount`, `lostCount`, `returnRate`, `pendingCount`). Antes disponível como endpoint
> independente `/post-procedure` — removido na v1.4 (ADR-015).

> ⚠️ **`topPerformers` não carrega bônus (ADR-017):** cada `UserPerformanceResultDTO` no array
> `topPerformers` sempre terá `calculatedBonus = 0` e `bonusPeriodRef = null`. Bônus é mensal e não
> se aplica a range livre. **Não renderizar o campo de bônus** nos cards do ranking do dashboard;
> redirecionar o usuário para `/user-performance/{id}` (com range de mês único) se o bônus for
> necessário.

---

## 14. Apêndice TypeScript

```typescript
// =============================================================
// ENUMS
// =============================================================

export const Role = {
  ADM_SYSTEM: 'ADM_SYSTEM',
  ADM_LEADS: 'ADM_LEADS',
  USER_LEADS: 'USER_LEADS',
  USER_ATTENDANT: 'USER_ATTENDANT',
  ADM_EVALUATOR: 'ADM_EVALUATOR',
  USER_EVALUATOR: 'USER_EVALUATOR',
  ADM_COMMERCIAL: 'ADM_COMMERCIAL',
  USER_COMMERCIAL: 'USER_COMMERCIAL',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Sector = {
  LEADS: 'LEADS',
  ATTENDANT: 'ATTENDANT',
  EVALUATOR: 'EVALUATOR',
  COMMERCIAL: 'COMMERCIAL',
  ADM: 'ADM',
  MANAGER: 'MANAGER',
} as const;
export type Sector = (typeof Sector)[keyof typeof Sector];

export const TicketStatus = {
  NEW: 'NEW',
  IN_CONTACT: 'IN_CONTACT',
  SCHEDULED: 'SCHEDULED',
  IN_EVALUATION: 'IN_EVALUATION',
  NEGOTIATION: 'NEGOTIATION',
  WIN: 'WIN',
  PENDING: 'PENDING',
  RECYCLED: 'RECYCLED',
  LOSS: 'LOSS',
  POST_PROCEDURE: 'POST_PROCEDURE',
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const CustomerSource = {
  ADS_PAID: 'ADS_PAID',
  ORGANIC: 'ORGANIC',
  INDICATION: 'INDICATION',
} as const;
export type CustomerSource = (typeof CustomerSource)[keyof typeof CustomerSource];

export const AdsChannel = {
  GOOGLE: 'GOOGLE',
  META: 'META',
  INSTAGRAM: 'INSTAGRAM',
  TIKTOK: 'TIKTOK',
  OUTER: 'OUTER',
} as const;
export type AdsChannel = (typeof AdsChannel)[keyof typeof AdsChannel];

export const ContactChannel = {
  ORGANIC: 'ORGANIC',
  REFERRAL: 'REFERRAL',
  FACEBOOK: 'FACEBOOK',
  INSTAGRAM: 'INSTAGRAM',
  WHATSAPP: 'WHATSAPP',
  PHONE_CALL: 'PHONE_CALL',
  WEBSITE_FROM: 'WEBSITE_FROM',
  OTHER: 'OTHER',
} as const;
export type ContactChannel = (typeof ContactChannel)[keyof typeof ContactChannel];

export const PaymentMethod = {
  PIX: 'PIX',
  CASH: 'CASH',
  DEBIT_CARD: 'DEBIT_CARD',
  CREDIT_CARD: 'CREDIT_CARD',
  INSTALLMENT: 'INSTALLMENT',
  DENTAL_INSURANCE: 'DENTAL_INSURANCE',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PAYMENT_METHOD_CONVERSION_FACTOR: Record<PaymentMethod, number> = {
  PIX: 1.00,
  CASH: 1.00,
  DEBIT_CARD: 0.98,
  CREDIT_CARD: 0.97,
  INSTALLMENT: 0.85,
  DENTAL_INSURANCE: 0.90,
};

// =============================================================
// COMMON
// =============================================================

export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: { empty: boolean; sorted: boolean; unsorted: boolean };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  first: boolean;
  size: number;
  number: number;
  sort: { empty: boolean; sorted: boolean; unsorted: boolean };
  numberOfElements: number;
  empty: boolean;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp: string; // LocalDateTime sem offset
}

export interface DataRange {
  from: string; // LocalDate "YYYY-MM-DD"
  to: string;
}

// =============================================================
// AUTH
// =============================================================

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type: 'Bearer';
}

export interface RefreshTokenRequest {
  token: string;
}

export interface JwtPayload {
  sub: string;   // username
  id: string;    // UUID
  role: Role;
  sector: Sector;
  iat: number;
  exp: number;
}

// =============================================================
// USERS
// =============================================================

export interface UserCreateRequest {
  name: string;
  username: string;
  password: string; // CAMPO = "password" (não passwordHash); texto plano — backend faz hash
  sector: Sector;
  role: Role;
}

// PATCH /users/{username}/newPassword — body contém APENAS newPassword
export interface UserPasswordUpdateRequest {
  newPassword: string;
}

export interface UserResponse {
  id: string; // UUID
  name: string;
  username: string;
  sector: Sector;
  role: Role;
}

// =============================================================
// CUSTOMERS
// =============================================================

export interface CustomerCreateRequest {
  name: string;
  cpf?: string | null;
  phone: string;
  phone2?: string | null;
  email?: string | null;
  initialNote?: string | null;
  source: CustomerSource;
  adsChannel?: AdsChannel | null; // CAMPO = "adsChannel" (não adChannel)
  adCampaign?: string | null;
  referredBy?: string | null; // UUID
  channel?: ContactChannel | null;
}

export interface CustomerUpdateRequest {
  id: string; // UUID
  name: string;
  cpf?: string | null;
  phone: string;
  phone2?: string | null;
  email?: string | null;
}

export interface CustomerResponse {
  id: string;
  name: string;
  cpf: string | null;
  phone: string | null; // "NULL" (string) quando anonimizado
  phone2: string | null;
  email: string | null;
  initialNote: string | null;
  source: CustomerSource;
  adsChannel: AdsChannel | null; // CAMPO = "adsChannel" (não adChannel)
  adCampaign: string | null;
  createdAt: string; // LocalDateTime
  updatedAt: string;
  createdBy: string; // UUID
  referredBy: string | null; // UUID
  anonymized: boolean;
}

// =============================================================
// TICKETS
// =============================================================

export interface LeadTicketCreateRequest {
  customerId: string; // UUID
  currentSector: Sector;
  assignedTo?: string | null; // UUID
  scheduledAt?: string | null; // LocalDateTime
}

export interface LeadTicketChangeStatusRequest {
  status: TicketStatus;
  returnScheduledAt?: string | null; // LocalDateTime — obrigatório em POST_PROCEDURE→SCHEDULED
  lossReason?: string | null; // obrigatório em POST_PROCEDURE→LOSS
}

export interface LeadTicketResponse {
  id: string;
  customerId: string;
  status: TicketStatus;
  currentSector: Sector;
  assignedTo: string | null;
  scheduledAt: string | null;
  pendingAt: string | null;
  closedAt: string | null;
  createdBy: string;
  previousTicketId: string | null;
  createdAt: string;
  updatedAt: string | null;
  recycledAt: string | null;
  procedurePerformedAt: string | null;
  returnScheduledAt: string | null;
}

// =============================================================
// CONTACT LOGS
// =============================================================

export interface ContactLogCreateRequest {
  ticketId: string; // UUID
  channel: ContactChannel;
  note: string;
  occurredAt: string; // LocalDateTime
}

export interface ContactLogResponse {
  id: string;
  ticketId: string;
  userId: string;
  username: string | null; // ADR-019: nome do autor gravado na criação; null em logs anteriores à feature
  channel: ContactChannel;
  note: string;
  statusBefore: TicketStatus | null;
  statusAfter: TicketStatus | null;
  occurredAt: string;
  createdAt: string;
}

// =============================================================
// DEALS
// =============================================================

export interface DealProcedureDTO {
  name: string;
  code?: string | null;
  tableValue: number; // BigDecimal como número JSON
  quantity: number;
  note?: string | null;
}

export interface DealCreateRequest {
  procedures: DealProcedureDTO[];
}

export interface DealUpdateRequest {
  procedures: DealProcedureDTO[];
}

export interface ApplyDiscountRequest {
  discountPct: number; // BigDecimal como número
}

export interface CloseDealRequest {
  paymentMethod: PaymentMethod;
}

export interface DealResponse {
  id: string;
  ticketId: string;
  createdBy: string;
  createdBySector: Sector;
  procedures: DealProcedureDTO[];
  totalValue: number;
  discountPct: number | null;
  discountApprovedBy: string | null;
  finalValue: number | null;
  paymentMethod: PaymentMethod | null;
  closedBy: string | null;
  archived: boolean;
  createdAt: string;
  closedAt: string | null;
  updatedAt: string | null;
}

export interface DealHistoryResponse {
  dealId: string;
  changedBy: string;
  changedBySector: Sector;
  fieldChanged: string | null;
  valueBefore: string; // JSON string
  valueAfter: string;
  occurredAt: string;
}

export interface DealDetailResponse {
  deal: DealResponse;
  history: DealHistoryResponse[];
}

// =============================================================
// CONFIG
// =============================================================

export interface RecycleConfigRequest {
  afterDays: number; // min=1
}

export interface RecycleConfigResponse {
  id: string;
  afterDays: number;
  active: boolean;
  createdAt: string;
}

export interface BonusConfigRequest {
  sector: Sector;
  role: Role;
  metricKey: string;
  bonusPct: number;
  targetValue?: number | null;
  periodRef: string; // ex: "2026-06"
}

export interface BonusConfigResponse {
  id: string;
  sector: Sector;
  role: Role;
  metricKey: string;
  bonusPct: number;
  targetValue: number | null;
  periodRef: string;
  active: boolean;
  createdAt: string;
}

export interface AdsInvestmentRequest {
  channel: AdsChannel;
  campaign?: string | null;
  amount: number;
  periodStart: string; // LocalDate "YYYY-MM-DD"
  periodEnd: string;
}

export interface AdsInvestmentResponse {
  id: string;
  channel: AdsChannel;
  campaign: string | null;
  amount: number;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

// =============================================================
// ANALYTICS
// =============================================================

export interface AdsRoiResult {
  channel: AdsChannel;
  totalInvestment: number;
  totalRevenue: number;
  roiMultiplier: number;
  leadsCount: number;
  closedCount: number;
}

export interface StageConversionResult {
  sector: Sector;
  captureCount: number;
  scheduledCount: number;
  dealCreatedCount: number;
  closedCount: number;
  leadsConversionPct: number;
  evaluationConversionPct: number;
  commercialConversionPct: number;
}

export interface SectorDropOffResult {
  sector: Sector;
  entryCount: number;
  exitCount: number;
  lossCount: number;
  dropOffPct: number;
}

export interface UserPerformanceResult {
  userId: string;
  name: string;
  sector: Sector;
  totalAssigned: number;
  totalConverted: number;
  conversionPct: number;
  avgTicketValue: number;
  expectedCash: number;
  calculatedBonus: number;
  bonusPeriodRef: string; // ex: "2026-06" — mês a que o calculatedBonus se refere (ADR-016)
}

export interface BonusResult {
  value: number;
}

export interface PostProcedureResult {
  totalPostProcedure: number;
  returnedCount: number;
  lostCount: number;
  returnRate: number;
  pendingCount: number;
}

export interface GlobalDashboardResult {
  period: DataRange;
  adsRoi: AdsRoiResult[];
  stageConversion: StageConversionResult;
  sectorDropOff: SectorDropOffResult[];
  topPerformers: UserPerformanceResult[];
  postProcedures: PostProcedureResult; // adicionado v1.4 — ADR-015
  totalExpectedCash: number;
}

// =============================================================
// RBAC — mapa consultável
// =============================================================

export type Scope = 'GLOBAL' | 'SECTOR' | 'OWN' | 'INTAKE';
export type ResourceAction = string; // "RESOURCE:ACTION"

// Espelha PermissionSeeder. Valor = escopo concedido àquela tupla (resource:action).
// Use para esconder UI por CAPACIDADE; o backend é a fonte de verdade (403 = rede de segurança).
export const ROLE_CAPABILITIES: Record<Role, Record<ResourceAction, Scope>> = {
  ADM_SYSTEM: {
    'USER:CREATE': 'GLOBAL', 'USER:READ': 'GLOBAL', 'USER:UPDATE': 'GLOBAL', 'USER:DELETE': 'GLOBAL',
    'CUSTOMER:CREATE': 'GLOBAL', 'CUSTOMER:READ': 'GLOBAL', 'CUSTOMER:UPDATE': 'GLOBAL', 'CUSTOMER:DELETE': 'GLOBAL',
    'TICKET:CREATE': 'GLOBAL', 'TICKET:UPDATE': 'GLOBAL', 'TICKET:READ': 'GLOBAL', 'TICKET:RECYCLE': 'GLOBAL',
    'CONTACT_LOG:CREATE': 'GLOBAL', 'CONTACT_LOG:READ': 'GLOBAL',
    'DEAL:CREATE': 'GLOBAL', 'DEAL:READ': 'GLOBAL', 'DEAL:UPDATE': 'GLOBAL', 'DEAL:CLOSE': 'GLOBAL',
    'ANALYTICS:READ': 'GLOBAL',
    'CONFIG:CONFIGURE': 'GLOBAL',
  },
  ADM_LEADS: {
    'CUSTOMER:CREATE': 'SECTOR', 'CUSTOMER:READ': 'INTAKE', 'CUSTOMER:UPDATE': 'INTAKE',
    'TICKET:CREATE': 'SECTOR', 'TICKET:READ': 'INTAKE', 'TICKET:UPDATE': 'INTAKE',
    'CONTACT_LOG:CREATE': 'SECTOR', 'CONTACT_LOG:READ': 'INTAKE',
    'ANALYTICS:READ': 'SECTOR',
  },
  USER_LEADS: {
    'CUSTOMER:CREATE': 'OWN', 'CUSTOMER:READ': 'INTAKE', 'CUSTOMER:UPDATE': 'OWN',
    'TICKET:CREATE': 'OWN', 'TICKET:READ': 'INTAKE', 'TICKET:UPDATE': 'SECTOR',
    'CONTACT_LOG:CREATE': 'OWN', 'CONTACT_LOG:READ': 'SECTOR',
    'ANALYTICS:READ': 'OWN',
  },
  USER_ATTENDANT: {
    'CUSTOMER:CREATE': 'OWN', 'CUSTOMER:READ': 'INTAKE', 'CUSTOMER:UPDATE': 'INTAKE',
    'TICKET:READ': 'INTAKE', 'TICKET:UPDATE': 'INTAKE',
    'CONTACT_LOG:CREATE': 'OWN', 'CONTACT_LOG:READ': 'INTAKE',
    'ANALYTICS:READ': 'OWN',
  },
  ADM_EVALUATOR: {
    'CUSTOMER:READ': 'SECTOR',
    'DEAL:CREATE': 'SECTOR', 'DEAL:READ': 'SECTOR', 'DEAL:UPDATE': 'SECTOR',
    'TICKET:READ': 'SECTOR', 'TICKET:UPDATE': 'SECTOR',
    'CONTACT_LOG:READ': 'GLOBAL',
    'ANALYTICS:READ': 'SECTOR',
  },
  USER_EVALUATOR: {
    'CUSTOMER:READ': 'GLOBAL',
    'DEAL:CREATE': 'OWN', 'DEAL:READ': 'OWN', 'DEAL:UPDATE': 'OWN',
    'TICKET:READ': 'SECTOR', 'TICKET:UPDATE': 'SECTOR',
    'CONTACT_LOG:READ': 'GLOBAL',
    'ANALYTICS:READ': 'OWN',
  },
  ADM_COMMERCIAL: {
    'DEAL:READ': 'SECTOR', 'DEAL:UPDATE': 'SECTOR', 'DEAL:CLOSE': 'SECTOR',
    'TICKET:READ': 'SECTOR', 'TICKET:UPDATE': 'SECTOR', 'TICKET:CLOSE': 'SECTOR',
    'CUSTOMER:READ': 'SECTOR',
    'CONTACT_LOG:READ': 'SECTOR',
    'ANALYTICS:READ': 'SECTOR',
  },
  USER_COMMERCIAL: {
    'DEAL:READ': 'OWN', 'DEAL:UPDATE': 'SECTOR', 'DEAL:CLOSE': 'OWN',
    'TICKET:READ': 'SECTOR', 'TICKET:UPDATE': 'OWN', 'TICKET:CLOSE': 'OWN',
    'CUSTOMER:READ': 'SECTOR',
    'CONTACT_LOG:READ': 'GLOBAL',
    'ANALYTICS:READ': 'OWN',
  },
};

export function canDo(role: Role, resource: string, action: string): boolean {
  return ROLE_CAPABILITIES[role]?.[`${resource}:${action}`] !== undefined;
}

export function scopeOf(role: Role, resource: string, action: string): Scope | undefined {
  return ROLE_CAPABILITIES[role]?.[`${resource}:${action}`];
}

// =============================================================
// STATE MACHINE
// =============================================================

export const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  NEW:           ['IN_CONTACT'],
  IN_CONTACT:    ['SCHEDULED', 'LOSS'],
  SCHEDULED:     ['IN_EVALUATION'],
  IN_EVALUATION: ['NEGOTIATION', 'LOSS'],
  NEGOTIATION:   ['WIN', 'PENDING'],
  PENDING:       ['RECYCLED'],
  RECYCLED:      ['NEW'],
  WIN:           ['POST_PROCEDURE'],
  POST_PROCEDURE:['SCHEDULED', 'LOSS'],
  LOSS:          [],
};

export const TRANSITION_ROLES: Partial<Record<TicketStatus, Role[]>> = {
  WIN:            ['USER_COMMERCIAL', 'ADM_COMMERCIAL', 'ADM_SYSTEM'],
  LOSS:           ['USER_LEADS', 'ADM_LEADS', 'ADM_SYSTEM'],
  POST_PROCEDURE: ['USER_ATTENDANT', 'USER_LEADS', 'ADM_LEADS', 'ADM_SYSTEM'],
};

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function roleCanTransitionTo(role: Role, to: TicketStatus): boolean {
  const allowed = TRANSITION_ROLES[to];
  if (!allowed) return true; // sem restrição de papel
  return allowed.includes(role);
}
```

---

## 15. Divergências e Correções

### Divergências código vs ADR/Spec

| # | Local | O que diz a ADR/spec | O que diz o código | Impacto para o frontend |
|---|-------|---------------------|-------------------|------------------------|
| 1 | `CustomerServiceImpl.anonymize()` | ADR-006: `phone → null` | Código: `customer.setPhone("NULL")` — string literal "NULL" | Frontend deve tratar `phone === "NULL"` como ausente, não apenas `null` |
| 2 | `RecycleJob.processTicket()` | Ticket filho deve ter `currentSector` e `createdBy` | ✅ **RESOLVIDO** (2026-06-07, commit `7b1ec44`) — `currentSector=LEADS` e `createdBy=ticket.getCreatedBy()` agora setados no ticket-filho | Reciclagem operante |
| 3 | `DealHistoryServiceImpl.record()` | `DealHistory.changedBy` e `changedBySector` são `NOT NULL` | ✅ **RESOLVIDO** (2026-06-07, commit `3ce04b4`) — `record()` agora preenche `changedBy`/`changedBySector` a partir do `User` recebido | Operações de deal funcionam sem 500 |
| 4 | `LeadTicketServiceImpl.search()` | Contrato §7.4: filtros `customerId`/`status`/`assignedTo` aplicáveis | ✅ **RESOLVIDO** (2026-06-07, commit `7f707aa`) — filtros cumulativos AND via JPA Specifications (ADR-013) | `GET /tickets?status=X&assignedTo=Y` retorna `X` **E** `Y`, dentro do scope. Ver "Correções pós-Fase 3" abaixo |
| 5 | `Customer`/`ContactLog` `search()` | ADR-013: SECTOR/INTAKE via `EXISTS`; OWN via `createdBy`/`userId` | ✅ **RESOLVIDO** (2026-06-07, commit `7f707aa`) — scope aplicado no SQL via Specifications (`EXISTS` para SECTOR/INTAKE) | OWN/SECTOR/INTAKE agora recortam corretamente. Ver "Correções pós-Fase 3" abaixo |

### O que estava desatualizado na documentação anterior

| Item | Descrição desatualizada | Correto agora |
|------|------------------------|---------------|
| Endpoint de deals | `/deal` (singular) | `/api/v1/deals` (plural) |
| Fechamento do deal | Descrito de forma genérica | `PATCH /deals/{id}/status` com `CloseDealRequestDTO { paymentMethod }` |
| Listagem | Arrays puros | `Page<T>` com estrutura do Spring |
| Query params | Descritos como path params | Query params (`?sector=`, `?channel=`) conforme ADR-001 |
| `GET /analytics/bonus/{id}` | Retornava `BigDecimal` direto | Retorna `BonusResultDTO { value: BigDecimal }` — ADR-007 |
| DELETE de customer | Descrição como deleção | Anonimização — ADR-006 |
| DELETE de ticket | Endpoint existia | Removido — ADR-006 |
| RecycleConfig | Por setor | Global (sem sector) — ADR-007 |
| `POST /authentication/refresh` | Não descrito | Implementado — ADR-005 |
| TicketStatus | Sem `POST_PROCEDURE` | `POST_PROCEDURE` existe e está nas ALLOWED_TRANSITIONS |
| PaymentMethod | Sem conversionFactor | Cada valor carrega `conversionFactor` para cálculo de `expectedCash` — ADR-008 |

### Correções aplicadas pós-revisão de integração (2026-06-04)

As divergências abaixo foram identificadas na revisão do contrato e **já corrigidas no backend**:

| # | Arquivo | Problema | Correção aplicada |
|---|---------|----------|-------------------|
| C1 | `ContactLogServiceImpl.create()` | `statusBefore` era setado com `ticket.getStatus()` em logs manuais, violando o contrato | `statusBefore(null)` e `statusAfter(null)` explícitos no builder |
| C2 | `ConfigServiceImpl.getRecycle/getBonusConfigs/getAdsInvestments()` | Usava `Action.READ` mas o seeder só semente `CONFIG:CONFIGURE` → 403 para todos | Trocado para `Action.CONFIGURE` nos 3 métodos GET |
| C3 | `ConfigServiceImpl.getRecycle()` + `RecycleConfigRepository` | `findFirstByActiveTrueOrderByCreatedAtDesc()` retornava `RecycleConfig` nullable → NPE em banco vazio | Repositório alterado para `Optional<RecycleConfig>`; service usa `.orElseThrow(ResourceNotFoundException)` → 404 mapeado |

### Correções pós-Fase 3 RBAC — JPA Specifications (2026-06-07, commit `7f707aa`, ADR-013)

| # | Arquivo | Problema | Correção aplicada |
|---|---------|----------|-------------------|
| F1 (M1) | `LeadTicketServiceImpl.search()` | Só o scope era aplicado; `customerId`/`status`/`assignedTo` ignorados | `search()` compõe `Specification.where(byScope).and(filtros)`; repo estende `JpaSpecificationExecutor` |
| F2 (M2) | `CustomerServiceImpl`/`ContactLogServiceImpl` `search()` | Auto-check trivial + `findAll` → OWN/SECTOR/INTAKE não recortavam | Scope aplicado no SQL; SECTOR/INTAKE via subquery `EXISTS` sobre `LeadTicket` (correlação por `customerId`/`ticketId`) |
| L1 | `LeadTicketServiceImpl` | 4 métodos privados órfãos + dependência `userRepository` não usada | Removidos |

> ⚠️ **MUDANÇA DE SEMÂNTICA — ação necessária no frontend.** Antes da ADR-013 os filtros de
> listagem eram tratados como **mutuamente exclusivos por prioridade** (um filtro por request). Agora
> são **cumulativos (AND)**: `?status=SCHEDULED&assignedTo=X` retorna apenas tickets que satisfazem
> **ambos**. Telas que enviavam múltiplos params esperando o comportamento antigo (prioridade) precisam
> ser revisadas — caso contrário podem retornar menos resultados do que o usuário espera. Afeta
> `GET /customers` (§7.3), `GET /tickets` (§7.4) e a visibilidade por scope de `GET /contact-logs` (§7.5).

---

### Correções backend 2026-06-08

| # | Arquivo | Problema | Correção aplicada |
|---|---------|----------|-------------------|
| B1 (A1) | `PermissionSeeder` | `CUSTOMER:READ` ausente para `ADM_COMMERCIAL` e `USER_COMMERCIAL` → 403 em toda leitura de cliente por esses papéis | Regras `CUSTOMER:READ:SECTOR` adicionadas para ambos |
| B2 (A2) | `DealServiceImpl.applyDiscount()` | `checkOrThrow` usava `Action.CONFIGURE` → 403 para qualquer tentativa de aplicar desconto | Corrigido para `Action.UPDATE` |
| B3 (A3) | `PermissionSeeder` | `USER_COMMERCIAL, DEAL:UPDATE` com scope `OWN` → vendedor não conseguia atualizar deals criados por outros membros do setor | Scope corrigido para `SECTOR` |
| B4 (A4) | `AnalyticsServiceImpl.getUserPerformance()` | `checkOrThrow(... null, null)` — scope `OWN` checava `user.id == null` → sempre falso → `USER_ATTENDANT` recebia 403 ao consultar sua própria performance | Corrigido para `checkOrThrow(... null, userId)` |
| B5 (M4) | `CustomerServiceImpl.update()` | `phone2` não era persistido no `PATCH /customers/{id}` | `customer.setPhone2(dto.phone2())` adicionado |

---

### Sincronização 1.3 (2026-06-11) — divergências entre o contrato 1.2 e o código atual

Esta tabela lista o que **mudou em relação ao texto anterior** deste contrato; o código é a verdade.

| # | Local | Contrato dizia (≤1.2) | Código real (HEAD) | Ação do frontend |
|---|-------|-----------------------|--------------------|------------------|
| D1 | `UserCreateRequestDTO` | campo `passwordHash` | campo **`password`** | Enviar `password` |
| D2 | `UserPasswordUpdateRequestDTO` | `{username, oldPassword, newPassword}` | **só `{newPassword}`**; sem verificação de senha antiga | Enviar só `newPassword` |
| D3 | `PATCH /users/{username}/newPassword` | "autenticado" | exige **`USER:UPDATE`** (só ADM_SYSTEM); nova senha == atual → **422** | Restringir tela a admin |
| D4 | Customer `adChannel` | campo `adChannel` (request, response, query) | **`adsChannel`** em todos | Renomear para `adsChannel` |
| D5 | `GET /customers?name=` | "contains, case-insensitive" | **igualdade exata** | Não esperar busca parcial |
| D6 | RBAC §8/§9 | matriz SECTOR/OWN, analytics só p/ admin e attendant | matriz com **INTAKE** e **`ANALYTICS:READ` p/ todos**; `CUSTOMER:READ` p/ avaliadores | Usar matriz nova |
| D7 | Login inválido | "401 sem corpo" | **401 com corpo JSON** (`BadCredentialsException`) | Ler `message` do erro |
| D8 | `/authentication/refresh` token adulterado | "401 sem corpo" | **500** (sem handler de `JwtException`) | Tratar ≠200 como sessão perdida |
| D9 | `GET /users/{id}` e `/username/{username}` | `USER:READ` | **sem checagem RBAC** (qualquer autenticado) | Pode chamar pós-login |
| D10 | Analytics dashboards | "ADMIN/MANAGER" | efetivamente **só ADM_SYSTEM**; `user-performance` também p/ papéis OWN (§13) | Esconder dashboard p/ não-admin |
| D11 | 422 reason phrase | "Unprocessable Entity" | **"Unprocessable Content"** | Não comparar string literal |
| D12 | 500 message | "Erro interno do servidor" | **"Erro Interno do Servidor"** (maiúsculas) | — |
| D13 | `POST /deals/{ticketId}` | sem pré-condição | exige ticket em **`IN_EVALUATION`** (422 senão); move ticket → NEGOTIATION/COMMERCIAL | Habilitar criar deal só em IN_EVALUATION |
| D14 | `PATCH /deals/{id}/discount` | limite via `maxDiscountPct` → 403 | só valida **0–100** (422); sem aprovação; `discountApprovedBy` = quem aplicou | Validar 0–100 no front |
| D15 | RecycleJob ticket-filho | "sem currentSector/createdBy" | **resolvido**: `currentSector=LEADS`, `createdBy` herdado | — |

> **Nota de topologia (não afeta o frontend):** apesar de a documentação interna citar dois bancos
> (`identity_db`/`crm_db`), o `application.properties` configura **um único datasource**
> (`odontocoredb`) com `ddl-auto=update`. As entidades não usam `schema` explícito. Sem impacto na API.

---

### ADR-015 — Analytics scope-aware (2026-06-14)

| # | Local | Situação anterior | Situação atual | Ação do frontend |
|---|-------|-------------------|----------------|-----------------|
| E1 | `GET /analytics/ads-roi` | Endpoint público (GLOBAL only na prática) | **Removido** — dados disponíveis em `GET /analytics/dashboard` | Remover chamadas a `/ads-roi`; ler `adsRoi` do dashboard |
| E2 | `GET /analytics/bonus/{id}` | Endpoint público (GLOBAL only na prática) | **Removido** — bônus disponível em `getUserPerformance.calculatedBonus` | Remover chamadas a `/bonus/{id}` |
| E3 | `GET /analytics/post-procedure` | Endpoint público (GLOBAL only na prática) | **Removido** — dados disponíveis em `GET /analytics/dashboard` | Remover chamadas a `/post-procedure`; ler `postProcedures` do dashboard |
| E4 | `GET /analytics/dashboard` response | Não incluía métricas pós-procedimento | Inclui `postProcedures: PostProcedureResultDTO` (campo novo) | Adicionar `postProcedures` ao type `GlobalDashboardResult` |
| E5 | `GET /analytics/conversion` | Retornava 403 para escopo SECTOR | SECTOR usa `effectiveSector = user.getSector()`; parâmetro `sector` do query é **ignorado** para escopo SECTOR | ADMs de setor recebem dados do próprio setor sem precisar enviar `sector` |
| E6 | `GET /analytics/dropoff` | Retornava 403 para escopo SECTOR | SECTOR retorna array com 1 elemento (setor do usuário) em vez dos 3 setores | Tratar response como array de 1 a 3 elementos conforme o papel |
| E7 | `GET /analytics/user-performance/{targetUserId}` | Escopo OWN checava `callerId` — sempre passava; qualquer `targetUserId` era aceito | OWN: `targetUserId != user.id` → **403** | Papéis OWN devem passar sempre o próprio UUID no path |

---

### ADR-016 — Bônus mensal vs. métricas por range (2026-06-14)

| # | Local | Situação anterior | Situação atual | Ação do frontend |
|---|-------|-------------------|----------------|-----------------|
| F1 | `GET /analytics/user-performance/{targetUserId}` response | `calculatedBonus` sem indicação do mês — derivado silenciosamente do mês do `from` | Campo novo `bonusPeriodRef: string` (`yyyy-MM`) explicita o mês do bônus | Adicionar `bonusPeriodRef` ao type `UserPerformanceResult`; exibir "Bônus de {mês}" |
| F2 | `GET /analytics/user-performance/{targetUserId}` range | Range cruzando meses computava bônus só do mês do `from` e descartava o resto sem aviso | Range deve estar contido em **1 mês calendário**; cross-month → **422** | Restringir o seletor de período a 1 mês quando exibir bônus |
| F3 | `GET /analytics/dashboard` range | aceitava qualquer range | ~~Reutilizava `user-performance` p/ `topPerformers` → guard de mês único (422)~~ → **RESOLVIDO pela ADR-017**: dashboard aceita range livre; `topPerformers` calculado via núcleo sem bônus | ~~Restringir a 1 mês~~ — Ver ADR-017 abaixo |

---

### Fix — getConversionByStage: porcentagem ultrapassava 100% (2026-06-15)

| # | Local | Problema | Correção aplicada | Ação do frontend |
|---|-------|----------|-------------------|-----------------|
| H1 | `GET /analytics/conversion` — `evaluationConversionPct` | `scheduledCount` era calculado com `scheduledAt != null`. Como `scheduledAt` só é persistido quando o cliente envia `returnScheduledAt` no body da transição `→ SCHEDULED`, tickets agendados sem data ficavam fora de `scheduledCount` mas dentro de `dealCreatedCount` → `evaluationConversionPct` podia ultrapassar 100% (ex.: 2 deals fechados / 1 agendado com data = **200%**) | `scheduledCount` agora conta tickets cujo `status` ∈ {`SCHEDULED`, `IN_EVALUATION`, `NEGOTIATION`, `WIN`, `PENDING`, `RECYCLED`, `POST_PROCEDURE`} — todos que passaram pelo estágio de agendamento. `dealStatuses` ⊂ `scheduledStatuses`, logo `dealCreatedCount ≤ scheduledCount` sempre | Nenhuma mudança de contrato de dados — os campos da response são os mesmos. Apenas os valores agora são matematicamente corretos (0–100%). **Remover qualquer lógica de clamp no frontend** se ela existir como workaround |

---

### ADR-017 — Dashboard global com range livre, topPerformers sem bônus (2026-06-15)

| # | Local | Situação anterior (ADR-016) | Situação atual | Ação do frontend |
|---|-------|----------------------------|----------------|-----------------|
| G1 | `GET /analytics/dashboard` range | Guard de mês único herdado de `getUserPerformance` → range cross-month retornava **422** | **Range livre**: aceita qualquer intervalo ("últimos 30 dias", trimestre, etc.) sem 422 | Remover restrição de mês no seletor de período do dashboard |
| G2 | `GET /analytics/dashboard` → `topPerformers[]` | Cada item tinha `calculatedBonus` calculado para o mês e `bonusPeriodRef` preenchido | **`calculatedBonus = 0` e `bonusPeriodRef = null` sempre** — bônus não se aplica a range livre | Não renderizar bônus nos cards do ranking; ocultar ou desabilitar campo `calculatedBonus`/`bonusPeriodRef` no componente do dashboard |
| G3 | `GET /analytics/user-performance/{id}` range | Guard de mês único (ADR-016) | **Inalterado** — guard permanece; endpoint continua exigindo range de 1 mês | Manter restrição de mês no seletor de período da tela de performance individual |

> **Causa-raiz corrigida (ADR-017):** `getUserPerformance()` acumulava duas responsabilidades —
> métricas de performance (range livre) e bônus mensal (mês único). O dashboard reutilizava o
> método inteiro e herdava o guard. A solução foi extrair um núcleo privado `computePerformance()`
> sem bônus; o dashboard usa o núcleo diretamente, e `getUserPerformance()` usa o núcleo + injeta
> o bônus calculado no DTO de retorno.

---

### ADR-018 — Pacientes anonimizados excluídos da listagem (2026-06-16)

| # | Local | Situação anterior | Situação atual | Ação do frontend |
|---|-------|-------------------|----------------|-----------------|
| I1 | `GET /customers` | Clientes com `anonymized=true` podiam aparecer na listagem | **`notAnonymized()` aplicado por default no SQL** — clientes anonimizados nunca aparecem em `search()` | Nenhuma mudança de contrato: a paginação já chega filtrada. Remover qualquer workaround de filter no lado do cliente |

---

### ADR-019 — username do autor gravado no ContactLog (2026-06-16)

| # | Local | Situação anterior | Situação atual | Ação do frontend |
|---|-------|-------------------|----------------|-----------------|
| J1 | `ContactLogResponseDTO` | Campo `username` inexistente — o frontend precisava fazer `GET /users/{userId}` por log para exibir o nome | **Campo `username: string \| null` adicionado** — nome gravado no momento da criação (snapshot imutável, ADR-003) | Usar `username` diretamente para exibir o autor; eliminar chamadas `GET /users/{id}` por linha de log |
| J2 | Logs anteriores à v1.7 | — | `username = null` (coluna adicionada com `nullable=true` via `ddl-auto=update`) | Tratar `null` com fallback: exibir `userId` ou "Sistema" |

---

### Bug #18 — GET /config/recycle retornava 404 quando sem config (2026-06-16, RESOLVIDO)

| # | Local | Situação anterior | Situação atual | Ação do frontend |
|---|-------|-------------------|----------------|-----------------|
| K1 | `GET /api/v1/config/recycle` | `ConfigServiceImpl.getRecycle()` usava `orElseThrow(ResourceNotFoundException)` → **404** quando nenhuma `RecycleConfig` existe no banco | Retorna **`200` com body `null`** quando nenhuma config está cadastrada | Remover tratamento de 404 neste endpoint; exibir estado vazio ("Nenhuma config cadastrada — criar agora") quando `body === null` |

---

### Correções 2026-06-16 — analytics POST_PROCEDURE + scope USER_COMMERCIAL

| # | Local | Problema | Correção aplicada | Ação do frontend |
|---|-------|----------|-------------------|-----------------|
| L1 | `AnalyticsServiceImpl.getConversionByStage()` — `dealStatuses` | `POST_PROCEDURE` ausente em `dealStatuses`: tickets que avançaram de `WIN` para `POST_PROCEDURE` saíam do `dealCreatedCount` enquanto o ticket progredia — o deal ganho desaparecia do funil | `POST_PROCEDURE` adicionado a `dealStatuses` | Nenhuma — valores agora corretos |
| L2 | `AnalyticsServiceImpl.getConversionByStage()` — `closedCount` | `closedCount` usava `t.getStatus() == WIN`: tickets em `POST_PROCEDURE` (que tinham `closedAt` setado na transição WIN e não mais estavam em status WIN) não eram contados → `commercialConversionPct` subestimado | `closedCount` corrigido para `t.getClosedAt() != null` — captura WIN atual + POST_PROCEDURE | Nenhuma — valores agora corretos |
| L3 | `AnalyticsServiceImpl.getConversionByStage()` — filtro de setor `COMMERCIAL` | `applyPostProcedure()` seta `currentSector = LEADS`. Com `effectiveSector = COMMERCIAL`, esses tickets eram excluídos do filtro inteiro — desapareciam de `captureCount`, `scheduledCount`, `dealCreatedCount` e `closedCount` no dashboard comercial | Filtro expandido: `t.getCurrentSector() == effectiveSector \|\| (t.getStatus() == POST_PROCEDURE && effectiveSector == COMMERCIAL)` | Nenhuma — dados do setor COMMERCIAL agora consistentes |
| L4 | `PermissionSeeder` — `USER_COMMERCIAL, TICKET:READ` | Scope `OWN`: vendedor só via os próprios tickets — pipeline de `NEGOTIATION` de outros membros do setor era invisível na listagem | Scope corrigido para `SECTOR` | Atualizar `ROLE_CAPABILITIES.USER_COMMERCIAL['TICKET:READ']` de `'OWN'` para `'SECTOR'` no mapa TypeScript (§14) — já atualizado neste contrato |

---

### Bug M1 — GET /config/recycle retornava 500 (2026-06-17, RESOLVIDO)

| # | Local | Situação anterior | Situação atual | Ação do frontend |
|---|-------|-------------------|----------------|-----------------|
| M1 | `ConfigController` | Endpoint `GET /recycle` ausente — `ConfigService.getRecycle()` implementado no service mas sem `@GetMapping("/recycle")` no controller; Spring não encontrava handler → `GlobalExceptionHandler` genérico → **500** | `@GetMapping("/recycle")` adicionado; retorna `ResponseEntity<RecycleConfigResponseDTO>` com `orElse(null)` | Nenhuma mudança de contrato: comportamento continua `200 + body` ou `200 + null`. Remover qualquer fallback que tratasse o 500 como esperado |

---

### O que está PLANEJADO mas não implementado

| Feature | Descrição |
|---------|-----------|
| Status `NO_SHOW` | Não existe na máquina de estados |
| Refresh token com revogação (Dual Token) | ADR-005 prevê evolução futura |
| ~~Timezone explícito~~ | ✅ **RESOLVIDO (ADR-009)** — fuso da JVM fixado em America/Sao_Paulo; ver §1 |
| Módulo de agendamentos | Previsto para fases futuras |
| Módulo financeiro | Previsto para fases futuras |
| Validação de desconto com aprovação (`DiscountApprovalRequiredException`) | Classe e handler existem mas a condição nunca é disparada. Regra de limite de desconto será implementada no módulo financeiro — por ora qualquer usuário com `DEAL:UPDATE` aplica livremente; `discountApprovedBy` registra quem aplicou |
| `ContactLog.logType` discriminador explícito | Campo `logType: MANUAL \| SYSTEM` para distinguir logs sem depender de null-check em `statusBefore/statusAfter`. Requer migration de schema. Decisão: ADR-008 (proposto). Enquanto não implementado, usar `statusBefore === null && statusAfter === null` como discriminador de log manual — ver Seção 12. |