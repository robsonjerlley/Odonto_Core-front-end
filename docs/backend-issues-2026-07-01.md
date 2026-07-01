# Issues de backend — levantadas em 2026-07-01

> Relatório de acompanhamento das 17 issues reportadas pelo cliente após a entrada dos
> módulos **appointment**, **financial (installment)** e do **catálogo de procedimentos**.
> As issues de frontend foram corrigidas nesta mesma leva (ver
> `docs/../plan distributed-chasing-thacker`). **Este documento descreve apenas os
> itens que exigem ação no backend** — nada aqui foi implementado no backend.
>
> Repositório backend: `B:\projects\odontocore.crm\odontocore.crm`.

---

## #2 — `USER_ATTENDANT` / `USER_LEADS` não conseguem mudar status (403)

**Sintoma:** mover ticket de NEW → IN_CONTACT, ou agendar avaliação, retorna 403 para o
paciente cadastrado por eles ou por outros.

**Root cause:** em `LeadTicketServiceImpl.changeStatus` (linhas 131-137) a autorização é
`checkOrThrow(user, TICKET, UPDATE, leadTicket.getCurrentSector(), leadTicket.getCreatedBy())`.
O escopo é avaliado contra o **`currentSector` do ticket**, que é escolhido **manualmente na
criação** (`create`, linha 113, a partir de `dto.currentSector()`). Escopos no `PermissionSeeder`:

| Papel | `TICKET:UPDATE` escopo |
|---|---|
| `USER_ATTENDANT` | `INTAKE` |
| `USER_LEADS` | `SECTOR` (LEADS) |
| `ADM_LEADS` | `INTAKE` |

Se um ticket é criado com `currentSector` diferente do setor do papel (ex.: atendente cria com
setor LEADS, ou vice-versa), o escopo `SECTOR` não bate e dá 403. Além disso o `USER_ATTENDANT` é
**explicitamente bloqueado** de `IN_CONTACT` e `LOSS` (linhas 139-143) — isso é intencional
(US-FUND-02), mas se confunde com o 403 de escopo.

**Correção sugerida:**
1. Padronizar o `currentSector` inicial do ticket pelo fluxo (ex.: sempre `LEADS`/`ATTENDANT`
   conforme o papel do criador) em vez de aceitar um setor arbitrário do DTO; **ou**
2. Revisar os escopos de `TICKET:UPDATE` para os papéis de captação (leads/atendente) de forma
   que enxerguem os tickets da fase inicial independentemente do setor gravado.
3. Documentar claramente que o bloqueio de `IN_CONTACT`/`LOSS` do `USER_ATTENDANT` é de negócio,
   para não ser confundido com falha de escopo.

> **Impacto no frontend:** por decisão do cliente, a UI do funil **não foi alterada** nesta leva.
> Os botões de transição continuam guiados por `transitions.ts` (espelho do backend). Reavaliar
> após a correção de escopo.

---

## #4 — Botão "Entrar em contato" retorna 403

Mesma raiz do #2: para o papel que enxerga o botão (leads/atendente conforme o caso), o ticket
está num `currentSector` fora do escopo `TICKET:UPDATE` do papel, ou o papel está bloqueado da
transição. Resolver junto com o #2 (padronização de setor + revisão de escopo). Enquanto isso, a
UI mantém o botão (decisão do cliente: só documentar).

---

## #8 — `ADM_LEADS` consegue mudar status do ticket e agendar consulta

**Observação:** hoje o `PermissionSeeder` concede `ADM_LEADS → TICKET:UPDATE:INTAKE`, então a
capacidade existe por design. O item é uma **decisão de produto**: se o `ADM_LEADS` **não** deve
poder alterar status/agendar, remover/estreitar a regra no seeder e ajustar `TRANSITION_ROLES`
em `LeadTicketServiceImpl` (linhas 60-64). Caso seja aceitável, apenas confirmar o comportamento.

---

## #10 — Após agendar, o ticket some do pipeline e não há como direcionar a um EVALUATOR

**Root cause:** em `changeStatus`, a transição `→ SCHEDULED` (linhas 194-195) faz
`leadTicket.setCurrentSector(EVALUATOR)` e grava `scheduledAt`, **sem** definir um `assignedTo`
de avaliador específico. Usuários com escopo `INTAKE`/`SECTOR(LEADS)` deixam de enxergar o ticket
(comportamento esperado do escopo), dando a sensação de que "sumiu". Não há campo/fluxo para
escolher **qual** avaliador recebe o agendamento.

**Correção sugerida:**
1. Permitir informar o `assignedTo` (avaliador) na transição `→ SCHEDULED` (novo campo no
   `LeadTicketChangeStatusRequestDTO` + persistência).
2. Definir/expor uma listagem "agendados do meu setor" para o EVALUATOR (ver #3/#12).
3. Opcional: manter o ticket visível para quem agendou (histórico), via escopo de leitura.

---

## #3 / #12 — Agenda vazia para EVALUATOR; "consultar agenda" não traz nada

**Root cause (arquitetural):** `Appointment`s são criados **exclusivamente** no `DealWonEvent`
(`AppointmentEventListener.onDealWon`) — uma sessão `PROCEDURE` por quantidade de cada item do
deal, em `AWAITING_SCHEDULE`, atribuída ao `evaluatorId` do evento. **Não existe** criação de
appointment quando um lead é **agendado para avaliação** (funil `→ SCHEDULED`). Logo, a agenda do
avaliador só passa a ter itens **depois** que um deal é ganho — antes disso fica vazia, mesmo o
avaliador tendo agendamentos "de avaliação" no funil.

**Fluxo novo sugerido (a desenhar no backend):**
1. Ao mover o lead para `SCHEDULED` (agendamento de **avaliação**), publicar um evento e criar um
   `Appointment` do tipo **EVALUATION** (novo `AppointmentType`), com `assignedTo` = avaliador
   escolhido (ver #10), `scheduledAt` = data do funil, status `SCHEDULED`.
2. Garantir que `GET /appointments?assignedTo&from&to` cubra também esses appointments de avaliação.
3. Ao concluir a avaliação, ligar o fluxo ao deal (mantendo o `DealWonEvent` para as sessões de
   procedimento pós-fechamento, que já funciona).

> **Frontend:** a `AgendaPage` já consome `?assignedTo&from&to` e a worklist `AWAITING_SCHEDULE`;
> assim que o backend passar a emitir os appointments de avaliação, a agenda do avaliador se
> preenche sem mudança de frontend.

---

## #11 — Drop-off por setor mostra `saída = 1` com apenas 1 entrada

Revisar o cálculo de `SectorDropOffResultDTO` em `AnalyticsServiceImpl` (contagem de
`exitCount`/`dropOffPct`). Com 1 entrada registrada (pelo `USER_ATTENDANT`) e nenhuma saída real,
`exitCount` não deveria ser 1. Provável contagem indevida de transição inicial como "saída".

---

## #14 / #15 — Conversão por setor não atribui captação/agendamento aos setores certos

**#14:** a conversão não registra a **captação** feita pelo `USER_ATTENDANT` (que criou o
Customer), nem o **agendamento** feito pelo `ADM_LEADS`.

**#15:** todos os setores aparecem com "captados" e "fechados", quando o esperado é:
- Atendente/Leads → **captados**, em contato e agendados;
- Evaluator → **agendados** e com orçamento;
- Commercial → **com orçamento** e **fechados**.

Revisar `StageConversionResultDTO` / `computeStageConversion` em `AnalyticsServiceImpl`: a
atribuição de cada métrica ao setor responsável está genérica. Definir, por setor, quais estágios
contam como captação/agendamento/orçamento/fechamento e atribuir corretamente (provavelmente via
os `ContactLog` de transição `statusBefore/statusAfter` + `currentSector` do momento).

---

## #17 — Negociações não são mais visíveis para `USER_COMMERCIAL` / `ADM_COMMERCIAL`

**Root cause:** a transição `→ NEGOTIATION` em `LeadTicketServiceImpl.changeStatus` **não** move o
`currentSector` do ticket para `COMMERCIAL` (só `→ SCHEDULED` move p/ EVALUATOR e
`→ POST_PROCEDURE` p/ LEADS). Como `USER_COMMERCIAL`/`ADM_COMMERCIAL` têm `TICKET:READ` escopo
`SECTOR(COMMERCIAL)`, tickets em NEGOTIATION (que permanecem no setor EVALUATOR) ficam fora do
escopo → não aparecem na tela de Negociações (que filtra tickets por status comercial).

**Correção sugerida:** ao transicionar `→ NEGOTIATION`, setar `currentSector = COMMERCIAL`
(análogo ao que já é feito para EVALUATOR/LEADS). Assim o escopo `SECTOR` do comercial volta a
enxergar as negociações.

---

## #13 (infra de backend) — Catálogo de procedimentos

O frontend foi migrado para o novo contrato de deal
(`POST /deals/{ticketId}` com `{ items: [{ procedureId, priceOverride, quantity, note }] }`) e
ganhou uma tela de cadastro de procedimentos (`/procedimentos`). Dois pontos de backend:

1. **RBAC ausente:** não há regras no `PermissionSeeder` para o recurso de **catálogo**
   (`/api/v1/procedures`). Confirmar como o endpoint está autorizado (o commit
   `c5ee25d` adicionou "filtro explícito para procedures") e, se necessário, seedar as regras
   (ex.: `ADM_SYSTEM` cria/edita/exclui; leitura para quem monta orçamento — evaluators).
2. **Response empobrecido:** `DealResponseDTO.items` devolve `List<DealItemRequestDTO>` (só
   `procedureId`), embora já exista `DealProcedureResponseDTO` (name, tableValue, priceOverride,
   effectivePrice, subtotal). O ideal é o response retornar `DealProcedureResponseDTO` para que o
   frontend renderize o deal sem precisar resolver nomes pelo catálogo. **Workaround atual no
   frontend:** os nomes/preços são resolvidos client-side via `GET /api/v1/procedures`.

---

## #5 — "Salvar" do registro de contato não funciona (regressão) — PRECISA REPRO EM RUNTIME

**Análise por código (frontend + backend):**
- O frontend envia o DTO correto: `{ ticketId, channel, note, occurredAt }` (bate com
  `ContactLogCreateRequestDTO`). `nowBrasiliaISO` não mudou no último commit.
- `ContactLogServiceImpl.create` valida `CONTACT_LOG:CREATE` contra o **próprio setor/id** do
  usuário (linhas 58-64) — para papéis que têm a capacidade (ADM_SYSTEM, ADM_LEADS, USER_LEADS,
  USER_ATTENDANT) o create passa; para evaluators/commercial (que só têm READ) o **frontend já
  oculta** o botão.
- **Não há defeito reproduzível por inspeção no caminho do frontend.**

**Como diagnosticar (com app rodando):** reproduzir e capturar o status HTTP no Network:
- **403** → confirmar o papel do usuário e se ele realmente tem `CONTACT_LOG:CREATE` no seeder
  (candidato a correção de RBAC — adicionar ao topo deste relatório).
- **400/422** → inspecionar o corpo enviado (`occurredAt`/`channel`) → correção de frontend.
- **200 mas some da timeline** → problema de invalidação/render da lista (frontend).

Registrar o resultado após a reprodução.
