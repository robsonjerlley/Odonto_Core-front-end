# ADR-Frontend-003 — Tela Appointment: Agenda completa

**Status:** ✅ Implementado (2026-07-01) — módulo `src/modules/appointment` (`AgendaPage`, `AppointmentRow`, `ScheduleSheet`, service/queries). Rota `/agenda`, nav e RBAC (`APPOINTMENT`) integrados. Ver "Estado da implementação" ao fim.
**Data:** 2026-06-30
**Autoria:** Carla (UI/UX Agent) + Robson
**Relaciona:** ADR-029 (backend `appointment`), ADR-030 (Home Modo Operação — worklist "A agendar" + Sheet "Agendar"), ADR-032 (financeiro).
**Master espelhada em:** `.claude/adr/ADR-033-ux-appointment-agenda.md` (repo backend) — manter as duas em sincronia.

> ⚠️ **Contrato ancorado no código real** (`AppointmentController`, `AppointmentResponseDTO`, enums, `PermissionSeeder` em 2026-06-30). Onde há dependência de dado/endpoint que **não existe**, está marcado **[IMPACTO BACKEND]**. Não presumir — alinhar back/front antes de implementar.

---

## 1. Problema de produto

A ADR-030 entregou o **worklist "A agendar"** (o que falta marcar) e o **Sheet "Agendar"** (marcar 1 sessão ou N em lote). Falta a outra metade: **ver e operar o que já está agendado** — a agenda do dia. Sem ela, o dono-faz-tudo não tem onde "tocar o dia": ver o próximo paciente, concluir, remarcar, cancelar. Hoje esses dados existem no backend mas não têm tela.

## 2. Personas e JTBD (2 dispositivos, 2 jobs — ADR-030)

| Dispositivo | Job | JTBD |
|---|---|---|
| **Desktop** (na clínica, executar) | tocar o dia | *Quando estou atendendo, quero ver a agenda do dia e concluir/remarcar cada atendimento sem sair da tela, para não re-navegar a cada paciente.* |
| **Mobile** (antes da clínica, planejar) | preparar o dia | *Quando planejo o dia, quero ver o que está agendado e o que falta agendar, para chegar preparado.* |

## 3. Contrato de backend (fonte da verdade)

**Base:** `/api/v1/appointments` · **Auth:** Bearer · **Datas:** `LocalDateTime` naïve = horário de Brasília (ADR-009, **não** converter UTC).

### AppointmentResponseDTO
```ts
{
  id: string; clinicId: string;
  dealId: string; procedureId: string; procedureName: string;   // nome pronto ✅
  type: "EVALUATION" | "PROCEDURE";
  customerId: string; customerName: string;                     // nome pronto ✅
  evaluatorId: string; assignedTo: string;                      // executor efetivo
  status: "AWAITING_SCHEDULE" | "SCHEDULED" | "DONE" | "CANCELLED";
  scheduledAt: string | null;   // ISO sem offset (Brasília); null enquanto AWAITING_SCHEDULE
  sessionIndex: number; plannedSessions: number;                // "Sessão X de N"
  note: string | null; cancelReason: string | null;
}
```

### Endpoints
| Método | Path | Body | Resposta | Uso na tela |
|---|---|---|---|---|
| GET | `?status=SCHEDULED` | — | `Page<Appointment>` | agendados (todos, paginado — **sem filtro de data**) |
| GET | `?status=AWAITING_SCHEDULE` | — | `Page<Appointment>` | worklist "A agendar" (ADR-030) |
| GET | `?assignedTo={id}&from={dt}&to={dt}` | — | `Page<Appointment>` | **agenda do dia de UM executor** |
| PATCH | `/{id}/schedule` | `{scheduledAt*, assignedTo?}` | `Appointment` | agendar (Sheet ADR-030) |
| PATCH | `/{id}/reschedule` | `{scheduledAt*}` | `Appointment` | remarcar |
| PATCH | `/{id}/assignee` | `{assignedTo*}` | `Appointment` | reatribuir executor |
| PATCH | `/{id}/cancel` | `{cancelReason*}` (NotBlank) | `Appointment` | cancelar — **motivo obrigatório** |
| PATCH | `/{id}/complete` | — | **202, sem corpo** | concluir |
| PATCH | `/schedule-batch` | `[{appointmentId*, scheduledAt*, assignedTo?}]` | `{scheduled[], warnings[]}` | agendar N sessões |

`ConflictWarning = { assignedTo, slot, appointmentIds[] }` — retornado pelo batch quando o executor já tem atendimento na janela. **Conflito = aviso, não bloqueio** (ADR-030).

### RBAC (PermissionSeeder)
`APPOINTMENT` só tem ações **READ/UPDATE** (nasce por evento no WIN — sem CREATE; cancelar é UPDATE, não DELETE). ADM_SYSTEM: GLOBAL. USER_ATTENDANT: GLOBAL. ADM_EVALUATOR: SECTOR. USER_EVALUATOR: OWN. **Clínica solo (ADM_SYSTEM) enxerga tudo.** O scope é aplicado no servidor — o front não envia scope.

### ⚠️ Furos [IMPACTO BACKEND]
- **[A1] Agenda do dia multi-executor não existe.** `?assignedTo&from&to` exige UM executor; `?status=SCHEDULED` não filtra data. Para o dia de **todos** os profissionais numa clínica com >1 executor, falta `GET /appointments?from&to` (scope-aware, sem assignedTo). **MVP solo:** usar `?assignedTo={idDoÚnicoUsuário}&from&to`. Não hardcodar a suposição "1 executor" no código — derivar do usuário logado.
- **[A2] `/complete` responde 202 sem corpo** → não há DTO atualizado pra fundir no estado. Fazer update otimista (linha → DONE) e/ou refetch da seção.

## 4. Especificação da tela

### Estrutura — 2 visões (segmented control no header)
```
┌─────────────────────────────────────────────────────────┐
│  Agenda            [ Dia ▸ ]  ‹  qui, 30 jun  ›   [Hoje] │  ← navegador de data
│  ○ Agenda   ○ A agendar (3)                              │  ← segmented
├─────────────────────────────────────────────────────────┤
│  Executor: [ Todos ▾ ]   (oculto/travado se clínica solo)│
│                                                          │
│  09:00  🟠 Maria Oliveira · Avaliação                    │
│         Sessão 1/1 · Dr. Ana          [Concluir] [⋯]     │
│  10:30  🟢 João Pinto · Clareamento                      │
│         Sessão 2/6 · Dr. Ana          [Concluir] [⋯]     │
│  14:00  🟢 João Pinto · Clareamento (Sessão 3/6) …       │
└─────────────────────────────────────────────────────────┘
```
- **Visão "Agenda":** lista de `status=SCHEDULED` do dia selecionado, **ordenada por `scheduledAt`**. Cada linha = `AppointmentRow`.
- **Visão "A agendar":** o worklist da ADR-030 (`status=AWAITING_SCHEDULE`) → abre o Sheet "Agendar". (Contador no segmented.)
- **Cor por `type`:** `EVALUATION` = laranja (avaliação), `PROCEDURE` = esmeralda (deal) — linguagem de cor da ADR-030. Nunca só cor: sempre rótulo textual ("Avaliação"/"Procedimento").

### Componente `AppointmentRow`
```
Conteúdo: hora · 🎨type · customerName · procedureName · "Sessão X/N" · executor(assignedTo)
Ação primária inline: [Concluir]  → PATCH /complete (otimista; linha → DONE, fade 200ms)
Menu [⋯]:
  • Remarcar   → sheet (nova data/hora) → PATCH /reschedule
  • Reatribuir → sheet (dropdown executor) → PATCH /assignee
  • Cancelar   → sheet DESTRUTIVA (motivo* obrigatório, confirm) → PATCH /cancel

Estados:
  padrão · hover(desktop, realça fundo) · executando(botão→spinner) ·
  concluído(fade-out + some da lista) · cancelado(riscado + "Cancelado: {motivo}")
Responsividade:
  < 768px: ações no menu; tap na linha = sheet de detalhe; swipe ← = Concluir
  ≥ 768px: [Concluir] visível + [⋯]
A11y: alvo ≥44×44px; contraste ≥4.5:1; foco por teclado; Enter=Concluir; Esc fecha sheet;
      urgência/estado sempre com texto, nunca só cor.
```

### Cancelar = destrutivo com motivo obrigatório
O backend exige `cancelReason` (NotBlank). Portanto **cancelar nunca é 1 tap** — sempre abre sheet com campo "Motivo do cancelamento *" (obrigatório, valida inline) + confirmação. Cor vermelha (hierarquia de ação destrutiva). Sucesso: linha vira "Cancelado", sai da agenda ativa.

### Remarcar / Reatribuir
- **Remarcar:** sheet com só data/hora nova (`RescheduleRequestDTO` = `scheduledAt`). Mesma validação de "data no passado = erro inline" do Sheet Agendar (ADR-030).
- **Reatribuir:** dropdown de executor → `assignedTo`. Default = executor atual.

### Estados da tela
- **Vazio (dia sem agenda):** "Nenhum atendimento para {data} ✨" + atalho "Ver o que falta agendar →" (leva à visão "A agendar").
- **Carregando:** skeleton de 3 linhas.
- **Erro:** falha da agenda não derruba o header/navegador; card de erro com "tentar de novo".
- **Offline/lento (mobile):** último cache com selo "atualizado às HH:MM" (ADR-030).

### Navegação de data
`‹ dia ›` + botão "Hoje". Default = hoje. (Visão semana = stretch, fora do MVP.) A cada troca de dia, refetch `?assignedTo&from&to` com `from`=00:00 e `to`=23:59 do dia.

## 5. Decisões registradas
- Agenda = 2 visões (Agenda do dia + A agendar), segmented no header — **não** duas telas separadas.
- Concluir = micro-ação inline otimista (202 sem corpo). Cancelar = destrutivo com motivo obrigatório (nunca 1 tap). Remarcar/Reatribuir = sheet.
- Cor por `type`, sempre com rótulo textual.
- Filtro de executor **oculto/travado** quando a clínica é solo (deriva do usuário, não hardcode).
- Conflito = aviso, não bloqueio (herda ADR-030).

## 6. Próximos passos
1. Alinhar **[A1]** (endpoint de agenda por período multi-executor) — hoje o MVP solo usa `?assignedTo`.
2. ~~Implementar `AppointmentRow` + visão Agenda; reusar Sheet "Agendar".~~ ✅
3. Spec visual fina (tokens/breakpoints/microcopy) segue o design system existente.

## 7. Estado da implementação (2026-07-01)

- **`AgendaPage`** (`/agenda`): segmented **Agenda** / **A agendar (n)** + navegador de dia (‹ ›, "Hoje").
  Visão Agenda lista `SCHEDULED` do dia via `?assignedTo={executor}&from&to`, ordenada por `scheduledAt`.
  Executor default = usuário logado; seletor **oculto quando clínica solo** (`useExecutors().solo`). "Todos"
  multi-executor não implementado (depende de **[A1]**). Visão "A agendar" abre o `ScheduleSheet`.
- **`AppointmentRow`:** hora · dot+rótulo do `type` · paciente · procedimento · "Sessão X/N" · executor.
  Ação inline **Concluir** (`/complete`, 202 → invalida `['appointments']`); menu **[⋯]** → Remarcar
  (`/reschedule`), Reatribuir (`/assignee`), **Cancelar** (destrutivo, motivo `NotBlank` obrigatório,
  `/cancel`). Atrasado (agendado vencido) realçado com rótulo textual.
- **`ScheduleSheet`** (compartilhado com a ADR-002): agendamento de 1 sessão ou batch das sessões irmãs.
- **[A2]** `/complete` sem corpo → resolvido por invalidação da query (refetch), não fusão de estado.
- **RBAC:** recurso `APPOINTMENT` (READ/UPDATE) adicionado a `permissions.ts` para ADM_SYSTEM,
  USER_ATTENDANT, ADM_EVALUATOR, USER_EVALUATOR; o backend aplica o escopo.
