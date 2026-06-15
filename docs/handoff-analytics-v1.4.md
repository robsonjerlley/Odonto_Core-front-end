# Handoff — Alinhamento do módulo Analytics ao contrato v1.4 (ADR-015)

**Autor:** Product Owner
**Data:** 2026-06-14
**Status:** ✅ CONCLUÍDO — Item A implementado em 2026-06-14; ADR-017 (2026-06-15) encerrou o bloqueio
do dashboard (range livre; `DateRangeFilter` no lugar do `MonthFilter`). Item B implementado em
2026-06-15 (`SectorAnalyticsPage`). Documento histórico — não requer mais ação.
**Origem:** ADR-015 (contrato v1.4, `frontend-integration-contract.md` §13 e §15 tabela E1–E7)
**Severidade:** Pré-lançamento (sem usuário real afetado) — Must-Have de sprint, **não** hotfix.

---

## 1. Contexto (por que este trabalho existe)

A ADR-015 tornou o analytics do backend **scope-aware** e **removeu 3 endpoints** que o frontend
ainda chama. Eles passarão a responder **404**. O dado não sumiu — foi **consolidado dentro de
endpoints sobreviventes**. Este handoff aponta **onde** cada chamada vive hoje e **de onde** o dado
deve passar a ser lido.

| Endpoint removido (v1.4) | De onde ler agora |
|---|---|
| `GET /analytics/ads-roi` | `dashboard.adsRoi` (já vem de `GET /analytics/dashboard`) |
| `GET /analytics/bonus/{id}` | `UserPerformanceResultDTO.calculatedBonus` (já vem de `user-performance/{id}`) |
| `GET /analytics/post-procedure` | `dashboard.postProcedures` (campo novo no dashboard) |

> ⚠️ Apenas a documentação foi atualizada (este doc + `CLAUDE.md` + cópia do contrato em
> `frontend-integration-contract.md`). **Nenhum código foi alterado ainda.**

---

## 2. Sprint Goal

> "Alinhar o módulo Analytics ao contrato v1.4: nenhuma chamada a endpoint removido; dashboard e
> desempenho pessoal lendo dos endpoints sobreviventes."

| Item | Descrição | MoSCoW | Dono principal |
|---|---|---|---|
| **A** | Migrar os 3 endpoints removidos + adicionar campo `postProcedures` ao DTO | **Must** | Arquiteto + UI |
| **C** | Confirmar guarda OWN no `user-performance` (carona no PR do A) | Could | Arquiteto |
| **B** | Expor analytics SECTOR a ADMs de setor (E5/E6) | Should — **backlog, aguardando demanda** | Arquiteto + UI (futuro) |

---

## 3. Mapa de arquivos — ONDE mexer (Item A)

Linhas verificadas por leitura direta dos fontes em 2026-06-14.

### 3.1 ROI de Ads (`ads-roi`) — 🟢 SÓ CÓDIGO MORTO (zero UI)

`useAdsRoi`/`getAdsRoi` **não são consumidos por ninguém**. O `DashboardPage` já lê
`dashboard.adsRoi`. É remoção pura.

| Arquivo | Linha | O que está lá | Ação |
|---|---|---|---|
| `src/modules/analytics/analytics.service.ts` | 24 | `getAdsRoi(...)` → `GET /api/v1/analytics/ads-roi` | **Remover** |
| `src/modules/analytics/analytics.queries.ts` | 12 | `useAdsRoi(...)` (hook órfão) | **Remover** |
| `src/modules/analytics/DashboardPage.tsx` | 83, 439 | `AdsRoiChart` lê `dashboard.adsRoi` | ✅ **Já correto — não tocar** |

### 3.2 Bônus (`bonus/{id}`) — 🟡 MUDA DADO + RENDER

Consumido em duas telas. O bônus agora vem de `UserPerformanceResultDTO.calculatedBonus`, que essas
telas **já buscam** via `user-performance/{id}`.

| Arquivo | Linha | O que está lá | Ação |
|---|---|---|---|
| `src/modules/analytics/analytics.service.ts` | 50 | `getBonus(...)` → `GET /api/v1/analytics/bonus/{id}` | **Remover** |
| `src/modules/analytics/analytics.queries.ts` | 36 | `useBonus(...)` | **Remover** |
| `src/modules/analytics/DashboardPage.tsx` | 7, 216 | importa e usa `useBonus(performer.userId, periodRef)` por performer | **Trocar** por `performer.calculatedBonus` (já presente no `UserPerformanceResultDTO` do ranking) |
| `src/modules/analytics/MyPerformancePage.tsx` | 3, 65 | importa e usa `useBonus(userId, periodRef)` | **Trocar** por `data.calculatedBonus` do `useUserPerformance` que a tela já chama |

> ✅ **DECIDIDO pelo Arquiteto (ADR-FE-001, `docs/adr-frontend-001-analytics-bonus-periodref.md`):**
> **remover** o controle `periodRef`. A leitura do backend mostrou que `calculatedBonus` é calculado
> sobre o **mês-calendário inteiro do `from`** (o `to` é ignorado) — o input de mês seria um controle
> "fantasma" ignorado pelo backend. O bônus passa a vir de `perf.calculatedBonus` e deve ser exibido
> com **rótulo honesto** "Bônus de {from formatado MMM/yyyy}" (ex.: "Bônus de jun/2026").

### 3.3 Pós-procedimento (`post-procedure`) — 🟡 MUDA DADO + RENDER

| Arquivo | Linha | O que está lá | Ação |
|---|---|---|---|
| `src/modules/analytics/analytics.service.ts` | 55 | `getPostProcedure(...)` → `GET /api/v1/analytics/post-procedure` | **Remover** |
| `src/modules/analytics/analytics.queries.ts` | 44 | `usePostProcedure(...)` | **Remover** |
| `src/modules/analytics/DashboardPage.tsx` | 355 | card pós-procedimento usa `usePostProcedure(period)` | **Trocar** por `dashboard.postProcedures` |

### 3.4 Tipo desatualizado (E4)

| Arquivo | Linha | O que está lá | Ação |
|---|---|---|---|
| `src/types/models.ts` | 183 | `GlobalDashBoardResultDTO` **sem** `postProcedures` | **Adicionar** `postProcedures: PostProcedureResultDTO` |
| `src/types/models.ts` | 175 | `PostProcedureResultDTO` **já existe** | ✅ Reaproveitar — não recriar |

---

## 4. Separação de responsabilidades

### 🏛️ Para o ARQUITETO

1. **Contrato de dados / serviço** — remover os 3 métodos do `analytics.service.ts` e os 3 hooks de
   `analytics.queries.ts` (seções 3.1–3.3); ajustar o tipo em `models.ts` (3.4).
2. ✅ **Decisão de `periodRef`** (3.2) — **RESOLVIDA**: remover (ADR-FE-001). Backend calcula bônus
   pelo mês do `from`; rótulo honesto na UI. Pendência aberta com o time backend (vazamento de
   semântica: bônus mensal vs. métricas por range) registrada na ADR — **não bloqueia este sprint**.
3. ✅ **Item C — guarda OWN (E7) — VALIDADA**: backend *enforce* em `AnalyticsServiceImpl:203-205`
   (`scope == OWN && id != targetUserId → 403`). `MyPerformancePage` passa o próprio id ✅;
   `UserPerformanceDetail` (dashboard) só é alcançável por ADM_SYSTEM/GLOBAL, que pode consultar
   qualquer um ✅. **Nenhuma correção de código — apenas cobrir com teste.**
4. **Item B (backlog, NÃO neste sprint):** `conversion`/`dropoff` agora aceitam escopo `SECTOR`.
   Habilitar exigiria revisar `analyticsScope`/`canAccessRoute` em `lib/permissions.ts` e a guarda
   `RequireRoute`. Decisão de arquitetura + UX adiada até haver demanda.

### 🎨 Para o UI/UX

> Itens onde o **render** muda (origem do dado troca; o componente continua, mas a fonte e possíveis
> estados de loading/empty mudam):

1. **Ranking de performance (Dashboard)** — `DashboardPage.tsx:216`: o bônus por performer deixa de
   ter um loading próprio (`useBonus`) e passa a ser um campo já presente na linha
   (`performer.calculatedBonus`). **Some um spinner/estado de loading por linha** — revisar a UI da
   tabela/ranking.
2. **Card "Meu desempenho"** — `MyPerformancePage.tsx:65`: idem; bônus vem junto do resto da
   performance, sem fetch separado. Revisar estados de loading/erro da tela (de 2 requisições para 1).
3. **Card pós-procedimento (Dashboard)** — `DashboardPage.tsx:355`: deixa de ter fetch próprio e passa
   a ler de `dashboard.postProcedures`. Se o dashboard inteiro já tem um único estado de loading, o
   card pode perder o seu — revisar consistência visual.
4. **Seletor de mês (`periodRef`)** — ✅ **DECIDIDO: remover** (ADR-FE-001). Sai o input AAAA-MM de
   `MyPerformancePage` (112-121) e de `UserPerformanceDetail` (254-259). O card de bônus passa a usar
   `perf.calculatedBonus` e o rótulo muda de "Bônus do período" para **"Bônus de {from MMM/yyyy}"**
   (ex.: "Bônus de jun/2026") — para não dar a entender que o bônus segue o range de datas.
5. **ROI de Ads** — ✅ **nenhuma mudança visual.** Já lê do dashboard.

---

## 5. Definition of Done (Item A + C) — ✅ TODOS CONCLUÍDOS

- [x] `analytics.service.ts` sem `getAdsRoi`/`getBonus`/`getPostProcedure`.
- [x] `analytics.queries.ts` sem `useAdsRoi`/`useBonus`/`usePostProcedure`.
- [x] `GlobalDashBoardResultDTO` com `postProcedures: PostProcedureResultDTO`.
- [x] `DashboardPage` lê bônus de `calculatedBonus` e pós-procedimento de `dashboard.postProcedures`;
      nenhuma chamada a endpoint removido.
- [x] `MyPerformancePage` lê bônus de `calculatedBonus` (sem `useBonus`).
- [x] Guarda OWN do `user-performance` confirmada (Item C).
- [x] Decisão de `periodRef`: removido — `MonthFilter` substituído por `DateRangeFilter` no dashboard
      (ADR-017); `MyPerformancePage` mantém `MonthFilter` (mês único obrigatório em `user-performance`).
- [x] `npm run build` e lint limpos.

---

## 6. Critérios de Aceite (BDD)

```
Dado que estou logado como ADM_SYSTEM na Dashboard,
Quando a página carrega,
Então ROI por canal, ranking (com bônus) e card pós-procedimento exibem dados,
E nenhuma requisição a /ads-roi, /bonus/{id} ou /post-procedure é disparada.

Dado que estou em /meu-desempenho (papel OWN),
Quando a página carrega,
Então o bônus vem de UserPerformanceResultDTO.calculatedBonus,
E o path de user-performance usa o meu próprio UUID.

Dado o type GlobalDashBoardResultDTO,
Quando o dashboard é tipado,
Então existe o campo postProcedures: PostProcedureResultDTO.
```

---

## 7. Referências

- Contrato v1.4: `frontend-integration-contract.md` — §13 (Analytics), §14 (apêndice TS,
  `GlobalDashboardResult`/`PostProcedureResult`), §15 tabela **E1–E7** (ADR-015).
- `CLAUDE.md` → seção "Pendências de implementação — contrato v1.4 (ADR-015)".
