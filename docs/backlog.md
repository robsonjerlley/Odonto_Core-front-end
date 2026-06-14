# Backlog do Produto — OdontoCore CRM (frontend)

> Índice de itens **fora do sprint atual**. Itens entram aqui quando têm valor reconhecido mas
> **não estão priorizados agora** (sem demanda validada, dependência aberta, ou esforço não justificado
> ainda). Cada item carrega RICE + MoSCoW + gatilho de entrada.

| ID | Título | MoSCoW | RICE (rel.) | Gatilho de entrada |
|----|--------|--------|-------------|--------------------|
| **B-001** | Expor analytics por setor (scope SECTOR) a ADMs de setor | Should | Médio | Demanda de um gestor de setor por métricas próprias |

---

## B-001 — Expor analytics por setor (scope SECTOR) a ADMs de setor

**Status:** 🔜 Backlog — aguardando demanda
**Origem:** ADR-015 (contrato v1.4), §15 tabela E5/E6
**Relacionado:** `docs/handoff-analytics-v1.4.md` (Item B), `docs/analise-contrato-v1.2.md`

### Contexto

A v1.4 do backend passou a aceitar **escopo `SECTOR`** nos endpoints `GET /analytics/conversion` e
`GET /analytics/dropoff`. Hoje os papéis `ADM_LEADS`, `ADM_EVALUATOR` e `ADM_COMMERCIAL` têm
`ANALYTICS:READ:SECTOR` semeado, **mas o frontend não expõe essas telas a eles** — a guarda de rota
atual só mapeia `GLOBAL` (ADM_SYSTEM → `/`) e `OWN` (atendente → `/meu-desempenho`).

Comportamento do backend já disponível (não precisa de mudança lá):
- `conversion`: em escopo SECTOR, **ignora** o `sector` do query param e usa `user.getSector()`.
- `dropoff`: em escopo SECTOR, retorna **array de 1 elemento** (o setor do usuário), vs. 3 para GLOBAL.

### Por que está no backlog (e não no sprint)

⚠️ **Sem demanda validada.** Nenhum gestor de setor pediu essa visão até agora. Construir capacidade
analítica antes de haver sinal de uso é o oposto de MVP — gasta esforço de UI + guarda de rota +
teste sem garantia de valor. Entra quando um gestor real pedir métricas do próprio setor.

⚠️ **Não é trivial.** Exige decisão de UX (que tela um ADM de setor vê — uma versão recortada do
dashboard? uma tela nova?) + revisão de `analyticsScope`/`canAccessRoute` em `lib/permissions.ts` e da
guarda `RequireRoute`. Agrupar isso no fix da v1.4 seria scope creep.

### User Story

```
Como um gestor de setor (ADM_LEADS / ADM_EVALUATOR / ADM_COMMERCIAL),
Eu quero ver as métricas de conversão e drop-off do MEU setor,
Para acompanhar o desempenho da minha equipe sem depender do administrador do sistema.
```

### Critérios de Aceite (BDD)

```
Dado que estou logado como ADM de setor (ex.: ADM_COMMERCIAL),
Quando acesso a rota de analytics de setor,
Então vejo conversão e drop-off filtrados ao MEU setor,
E não preciso (nem consigo) escolher outro setor.

Dado que sou ADM de setor e o backend retorna dropoff com 1 elemento,
Quando a tela renderiza,
Então ela trata corretamente o array de 1 elemento (não assume os 3 setores).

Dado que sou ADM de setor,
Quando tento acessar GET /analytics/dashboard (GLOBAL only),
Então a UI não me oferece esse caminho (evita 403 visível ao usuário).
```

### RICE (relativo, revisar quando priorizar)

| Fator | Valor | Nota |
|-------|-------|------|
| Reach | Médio | 3 papéis ADM de setor |
| Impact | 1.5 | Autonomia de gestão; não desbloqueia nada crítico hoje |
| Confidence | 80% | Backend pronto; UX a definir |
| Effort | ~0.5 PM | Guarda de rota + tela(s) + tratamento de array variável |

### Dependências / decisões abertas

1. **UX (UI/UX agent):** dashboard recortado vs. tela dedicada de setor.
2. **Arquitetura (Arquiteto agent):** modelo de guarda de rota para scope SECTOR em
   `lib/permissions.ts` (`analyticsScope`/`canAccessRoute`) + `RequireRoute`.
3. Tratamento de `dropoff` como array de **1 a 3 elementos** conforme o papel.

### Arquivos prováveis (a confirmar no refinamento)

- `src/lib/permissions.ts` — `analyticsScope`, `canAccessRoute`
- `src/modules/analytics/DashboardPage.tsx` ou nova tela de setor
- guarda `RequireRoute`
