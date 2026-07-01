# ADR-Frontend-002 — Scheduling: Home "Modo Operação" + Sheet "Agendar"

**Status:** ✅ Implementado (2026-07-01) — Home Modo Operação (`OperationHome`), preferência tri-estado `homeMode` (`store/homeMode.store.ts`, persistida no navegador) e Sheet "Agendar" (`ScheduleSheet`, reusado na ADR-003). Ver "Estado da implementação" ao fim.
**Data:** 2026-06-27
**Autoria:** Carla (UI/UX Agent) + Robson
**Relaciona:** Backend ADR-029 (módulo `scheduling`), ADR-023 (TicketWonEvent — promovido ao MVP)
**Escopo:** Frontend (React 19 + TS + shadcn + TanStack Query + Zustand). Backend pode precisar de ajustes — ver seção "Necessidades de dados / impactos no backend".

> ⚠️ **Aviso ao agente frontend:** este doc NÃO presume o formato final do backend. Onde há dependência de dado novo ou de endpoint que talvez não exista, está marcado como **[IMPACTO BACKEND]**. Confirme contra os fontes em `B:\projects\odontocore.crm\odontocore.crm` antes de implementar; se o contrato não existir, escale para alinhamento back/front.

---

## 1. Problema de produto

O sistema cresce em número de telas (funil, pacientes, avaliações, negociações, e agora agenda; financeiro virá). A `HomePage` atual é um **lançador de cards** (menu), não um cockpit. A navegação é filtrada por papel — mas em clínica pequena **um único usuário acumula todos os papéis**, então vê todos os ~10 atalhos e a home não diz "o que fazer agora".

Risco estratégico: a fatia de mercado de **clínicas pequenas** (1–2 pessoas) é perdida por exaustão operacional (saltar entre telas + redigitar dados).

## 2. Personas e contextos de uso

| Persona | Contexto | Necessidade |
|---|---|---|
| **Dona-faz-tudo** (solo, todos os papéis) | clínica pequena | resolver o dia sem caçar menus |
| **Time** (papéis separados) | clínica média | a home de cards atual já serve |

**Dois dispositivos, dois jobs (igualmente importantes):**
- **Mobile — antes da clínica (planejamento):** "como vai ser meu dia?" → LER muito, digitar pouco.
- **Desktop — dentro da clínica (execução):** "próximo paciente, executa, marca" → AGIR muito, formulários.

## 3. Decisão central

Home **adaptativa ao modo de operação**, não ao módulo:
- Solo / papel amplo → **Home "Modo Operação"** (feed de ação).
- Time → mantém o grid de cards atual.
- **Sem toggle proeminente.** O perfil define a home; a sidebar segue dando acesso aos módulos para o detalhe.

> ⚠️ **Revisão 2026-06-30 — a escolha da home deve ser REVERSÍVEL.** A detecção do "modo solo"
> (item #10, §6) é heurística e pode errar. Escolha **irreversível** viola Nielsen #3 (controle e
> liberdade) e #5 (prevenção de erro). **Decisão:** preferência tri-estado **`homeMode: AUTO |
> OPERATION | CARDS`**, persistida por usuário, **default `AUTO`** (heurística escolhe); o usuário
> sobrescreve e volta atrás. **"Reversível" ≠ "toggle proeminente"** — o controle mora de baixa
> proeminência (configurações ou ícone sutil no header da home), preservando o anti-clutter.
> **[IMPACTO BACKEND]** persistir preferência por usuário (endpoint novo) — resolve parcialmente o item #10.

> A "Home Modo Operação" **não é um dashboard** (gráficos) nem um **módulo novo**. É uma tela que *consome* dados já existentes (funil, avaliações, deals) + os novos (agenda, a-agendar, status de pagamento) e os apresenta como **tarefas em ordem de ação**, com **micro-ações inline** para não navegar a cada item.

## 4. Home "Modo Operação" — especificação

### Hierarquia (ordem por urgência do dia)
1. **Resumo do dia** (1 linha: "X atrasados · Y tarefas hoje")
2. **⚠️ Atrasado** — lead sem contato, atendimento sem desfecho (vermelho + rótulo textual)
3. **📅 Hoje** — agenda do dia (avaliações + procedimentos), ordem de horário
4. **🗓️ A agendar** — worklist do WIN (procedimentos fechados sem data)
5. **💰 Pagamentos pendentes** — status, não módulo

### Layout
Feed de **coluna única**, largura controlada. Cada seção: header (ícone + rótulo + contador + "ver tudo →") e N linhas (`TaskRow`). Reusar os acentos de cor já existentes por módulo (azul=funil, laranja=avaliação, esmeralda=deal, etc.).

### Responsividade (conteúdo adaptativo, não só reflow)
| | Mobile (< 768px) — planejar | Desktop (≥ 768px) — executar |
|---|---|---|
| Resumo do topo | protagonista | linha discreta |
| Seção "Hoje" | expandida (herói) | expandida |
| Demais seções | recolhidas (chip + contador, tap p/ abrir) | expandidas |
| Ações | swipe na linha + sheet | botões inline visíveis |
| Densidade | enxuta | completa |

### Componente `TaskRow`
```
Estados:
- padrão: ícone(cor do módulo) · título · subtítulo(contexto) · ações
- hover (desktop): realça fundo
- swipe (mobile, ←): revela 1–2 ações; >50% confirma a primária
- carregando ação: botão → spinner
- concluído: fade-out 200ms + contador da seção decrementa
Responsividade:
- < 768px: ações ocultas; tap = sheet de detalhe; swipe = ação rápida
- ≥ 768px: ações inline; tap na linha = sheet só se precisar form
Acessibilidade:
- alvo de toque ≥ 44×44px; contraste ≥ 4.5:1
- urgência com rótulo textual ("Atrasado"), nunca só cor
- toda ação por swipe tem equivalente por tap
- foco por teclado na linha; Enter = ação primária; Esc fecha sheet
```

### Estados da Home
- **Vazio (dia limpo):** "Tudo em dia ✨" + atalho discreto p/ o funil.
- **Seção vazia:** não renderizar (sem "(0)").
- **Carregando:** skeleton 2–3 linhas por seção.
- **Erro isolado:** falha de uma seção não derruba o feed ("Não foi possível carregar pagamentos · tentar de novo").
- **Offline/lento (mobile no trânsito):** último cache com selo "atualizado às HH:MM".

### Micro-ações (deep-link só quando precisa de form)
- 1 clique no card: ligar, concluir atendimento, marcar pago.
- Abre sheet/modal: agendar, remarcar (precisam de input).

## 5. Sheet "Agendar" — especificação

**Gatilho:** ação "Agendar" numa linha de "A agendar" (appointment em `AWAITING_SCHEDULE`).
**Tipo:** side sheet (desktop) / bottom sheet (mobile).
**Objetivo:** `AWAITING_SCHEDULE → SCHEDULED` definindo data/hora.

**Princípio "digite uma vez":** dados conhecidos vêm preenchidos e travados; o usuário só insere o que é novo.

```
Read-only (snapshot):
  Paciente       (deal → ticket → customer)
  Procedimento + duração estimada (snapshot + catálogo)
  Plano: "Sessão X de N" (DealProcedure.quantity)

Inputs:
  Data e hora *           ← único obrigatório
  Profissional (executor) ← default = evaluator; dropdown; grava assignedTo
  Anotação (opcional)
  ☐ Planejar as N sessões de uma vez → a cada [k] dias, mesmo horário (opt-in)

Calculado / feedback:
  "Termina HH:MM · N min" (de estimatedDuration)
  Conflito inline se o executor já tiver atendimento na janela (aviso, não bloqueio)
```

**Decisões:**
- Default = agendar **só a sessão 1**. "Planejar N de uma vez" é opt-in → botão vira "Agendar N sessões" + lista de datas propostas **editáveis** antes de confirmar.
- Conflito = **warning, não bloqueio** (clínica encaixa).
- `estimatedDuration` nulo → "duração não definida" + campo manual; não trava.

**Estados:** validando · conflito · data no passado (erro inline) · salvando · sucesso (fecha, item sai da worklist, toast) · erro (mantém dados, msg humana).
**A11y:** labels visíveis; foco inicial no campo de data; `Esc` fecha (confirma se houver edição).

## 6. Necessidades de dados / impactos no backend  ⚠️ NÃO PRESUMIR

> Cada item lista o que o **frontend precisa** e o provável **estado do backend**. Confirmar nos fontes; se faltar, alinhar antes de codar.

| # | Necessidade do frontend | Provável estado no backend | Ação |
|---|---|---|---|
| 1 | Worklist "A agendar": itens com `appointmentId, paciente(nome), procedimento(nome), duraçãoEstimada, sessão X/N, executorPadrão(evaluator), dealId, ticketId` | Appointment nasce no WIN (ADR-029), mas **endpoint de listagem da worklist ainda não existe** | **[IMPACTO BACKEND]** definir `GET /appointments?status=AWAITING_SCHEDULE` (scope-aware) com nome do paciente/procedimento resolvidos |
| 2 | Nome do paciente e do procedimento prontos para exibir | Appointment guarda `customerId`/`procedureId`; nomes via snapshot do deal ou resolução | **[IMPACTO BACKEND]** decidir se a resposta já traz nomes (preferível p/ "digite uma vez") ou se o front resolve |
| 3 | Agenda do dia por executor + período | listagem scope-aware prevista (ADR-013/015) mas **endpoint a definir** | **[IMPACTO BACKEND]** `GET /appointments?assignedTo&from&to` |
| 4 | Detecção de conflito de horário do executor | não existe | **[IMPACTO BACKEND]** ou endpoint de disponibilidade, ou o front deriva da agenda do dia já carregada (preferir derivar p/ evitar round-trip) |
| 5 | Agendar 1 sessão (set data/hora + assignedTo) | operação prevista, **contrato REST não definido** | **[IMPACTO BACKEND]** `PATCH /appointments/{id}/schedule` |
| 6 | Reatribuir executor | previsto (assignedTo mutável) | **[IMPACTO BACKEND]** `PATCH /appointments/{id}/assignee` |
| 7 | Remarcar / cancelar / concluir | máquina de estados `AWAITING_SCHEDULE → SCHEDULED → DONE \| CANCELLED` | **[IMPACTO BACKEND]** endpoints + `cancelReason` obrigatório no cancelar |
| 8 | "Planejar N sessões de uma vez" (batch + recorrência) | não existe | **[IMPACTO BACKEND]** endpoint batch OU o front faz N chamadas (decidir; batch é melhor p/ consistência) |
| 9 | 💰 Status de pagamento (pago/pendente) por deal/appointment | **módulo financeiro não existe**; P.O. recomenda apenas um status, não tela | **[IMPACTO BACKEND]** campo de status de pagamento — escopo mínimo, não ERP |
| 10 | Detecção do perfil "solo / papel amplo" p/ escolher a home | há role/sector no `auth`; "clínica tem 1 usuário" não é exposto | **[IMPACTO BACKEND/REGRA]** definir o critério (papel amplo? nº de usuários da clínica?) e de onde o front lê |

## 7. Decisões registradas (resumo)

- Home adaptativa por **modo de operação**; feed de ação para o solo-operador; **sem toggle**.
- Mobile = **planejar** (ler), Desktop = **executar** (agir) — conteúdo adaptativo.
- Micro-ações inline; sheet/modal só para input.
- Sheet "Agendar" com "digite uma vez": só data/hora obrigatória; default 1 sessão, batch opt-in.
- Conflito de horário = aviso, não bloqueio.
- Financeiro no feed = **status pago/pendente**, não módulo (escopo MoSCoW: Won't-have agora a tela completa).

## 8. Próximos passos

1. Alinhar os **[IMPACTO BACKEND]** da seção 6 com o time de backend (contratos REST).
2. Spec visual fina (tokens, breakpoints exatos, microcopy) quando os contratos fecharem.
3. ~~Implementar `TaskRow` + Home Modo Operação; depois o Sheet "Agendar".~~ ✅

## 9. Estado da implementação (2026-07-01)

- **Home adaptativa:** `HomePage` resolve o modo via `resolveHomeMode(mode, role)` — `AUTO` escolhe
  `OPERATION` para `ADM_SYSTEM` (dono-faz-tudo, único papel com acesso a agenda+financeiro no feed) e
  `CARDS` para os demais. Seletor tri-estado de baixa proeminência no header da home (ícone → dropdown).
- **`OperationHome`:** feed de coluna única com seções **Atrasado** (agendados do dia já vencidos),
  **Hoje** (agendados futuros), **A agendar** (`AWAITING_SCHEDULE`) e **Pagamentos pendentes** (parcelas
  `overdue`). Seção vazia não renderiza; estado "Tudo em dia ✨". Micro-ações inline (Concluir, Marcar pago);
  Agendar abre o `ScheduleSheet`. Cada seção gateada por permissão (`APPOINTMENT:READ` / `INSTALLMENT:READ`).
- **Sheet "Agendar" (`ScheduleSheet`):** snapshot read-only (paciente/procedimento/"Sessão X de N"), data/hora
  obrigatória, executor (oculto se clínica solo), opt-in "Planejar N sessões de uma vez" (batch das sessões
  irmãs do mesmo deal, intervalo em dias). Conflito = aviso via warnings do batch, não bloqueia.
- **[IMPACTO BACKEND] não resolvidos:** persistência da preferência por-usuário (item #10) → hoje no
  `localStorage`; `note` no agendamento não existe no `ScheduleRequestDTO` → removido do form; duração
  estimada não existe no DTO → "Termina HH:MM" omitido.
