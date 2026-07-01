import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Workflow, Users, Stethoscope, Handshake, CalendarDays, Wallet,
  LayoutDashboard, LineChart, UserCog, Settings,
  ArrowRight, LayoutList, LayoutGrid, Wand2, Check, type LucideIcon,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { canAccessRoute, analyticsScope } from '@/lib/permissions'
import { ROLE_LABELS } from '@/lib/labels'
import type { Role } from '@/types/enums'
import { useHomeModeStore, resolveHomeMode, type HomeMode } from '@/store/homeMode.store'
import OperationHome from './OperationHome'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

// ─── Configuração dos cards de acesso ────────────────────────────────────────

interface SectionCard {
  to: string
  icon: LucideIcon
  title: string
  description: string
  show: (role: Role | undefined | null) => boolean
  accent: string
  iconBg: string
}

const SECTION_CARDS: SectionCard[] = [
  {
    to: '/analytics',
    icon: LayoutDashboard,
    title: 'Analytics',
    description: 'Dashboard global, ROI de campanhas e desempenho da clínica.',
    show: (r) => canAccessRoute(r, '/analytics'),
    accent: 'text-teal-700 dark:text-teal-400',
    iconBg: 'bg-teal-100 dark:bg-teal-950/50',
  },
  {
    to: '/analytics-setor',
    icon: LayoutDashboard,
    title: 'Analytics do Setor',
    description: 'Conversão e drop-off do seu setor, mais seu desempenho pessoal.',
    show: (r) => analyticsScope(r) === 'SECTOR',
    accent: 'text-teal-700 dark:text-teal-400',
    iconBg: 'bg-teal-100 dark:bg-teal-950/50',
  },
  {
    to: '/funnel',
    icon: Workflow,
    title: 'Pipeline',
    description: 'Gerencie tickets de leads, registre contatos e avance no funil.',
    show: (r) => canAccessRoute(r, '/funnel'),
    accent: 'text-blue-700 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-950/50',
  },
  {
    to: '/customers',
    icon: Users,
    title: 'Pacientes',
    description: 'Cadastro de clientes, histórico e dados de captação.',
    show: (r) => canAccessRoute(r, '/customers'),
    accent: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-100 dark:bg-violet-950/50',
  },
  {
    to: '/agenda',
    icon: CalendarDays,
    title: 'Agenda',
    description: 'Atendimentos do dia e o que ainda falta agendar. Conclua, remarque ou cancele.',
    show: (r) => canAccessRoute(r, '/agenda'),
    accent: 'text-orange-700 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-950/50',
  },
  {
    to: '/avaliacoes',
    icon: Stethoscope,
    title: 'Avaliações',
    description: 'Pacientes agendados e em avaliação. Crie orçamentos e encaminhe para negociação.',
    show: (r) => canAccessRoute(r, '/avaliacoes'),
    accent: 'text-orange-700 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-950/50',
  },
  {
    to: '/commercial',
    icon: Handshake,
    title: 'Negociações',
    description: 'Deals ativos, descontos, fechamento e histórico de propostas.',
    show: (r) => canAccessRoute(r, '/commercial'),
    accent: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/50',
  },
  {
    to: '/financeiro',
    icon: Wallet,
    title: 'Financeiro',
    description: 'Parcelas do mês, atrasados e fluxo de caixa. Marque recebimentos.',
    show: (r) => canAccessRoute(r, '/financeiro'),
    accent: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-950/50',
  },
  {
    to: '/meu-desempenho',
    icon: LineChart,
    title: 'Meu Desempenho',
    description: 'Suas métricas pessoais de atendimento e bônus do período.',
    show: (r) => analyticsScope(r) === 'OWN',
    accent: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-950/50',
  },
  {
    to: '/users',
    icon: UserCog,
    title: 'Equipe',
    description: 'Gerenciamento de usuários, papéis e setores.',
    show: (r) => canAccessRoute(r, '/users'),
    accent: 'text-slate-600 dark:text-slate-400',
    iconBg: 'bg-slate-100 dark:bg-slate-800/50',
  },
  {
    to: '/config',
    icon: Settings,
    title: 'Configurações',
    description: 'Reciclagem de leads, bônus e investimentos em ADS.',
    show: (r) => canAccessRoute(r, '/config'),
    accent: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-100 dark:bg-indigo-950/50',
  },
]

// ─── Saudação por horário ─────────────────────────────────────────────────────

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function firstName(name: string | undefined): string {
  return name?.split(' ')[0] ?? ''
}

// ─── Card de seção ────────────────────────────────────────────────────────────

function SectionCardItem({ card }: { card: SectionCard }) {
  const Icon = card.icon
  return (
    <Link
      to={card.to}
      className="group flex flex-col gap-3 rounded-xl border bg-card p-5 hover:bg-muted/40 hover:border-brand/40 transition-all duration-150"
    >
      <div className={`flex size-10 items-center justify-center rounded-lg ${card.iconBg} ${card.accent}`}>
        <Icon className="size-5" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold leading-tight">{card.title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-brand opacity-0 group-hover:opacity-100 transition-opacity">
        Acessar <ArrowRight className="size-3" />
      </div>
    </Link>
  )
}

// ─── Seletor de modo de home (baixa proeminência — ADR-002 §3) ──────────────────

const MODE_OPTIONS: { value: HomeMode; label: string; icon: LucideIcon }[] = [
  { value: 'AUTO', label: 'Automático', icon: Wand2 },
  { value: 'OPERATION', label: 'Modo operação', icon: LayoutList },
  { value: 'CARDS', label: 'Grade de atalhos', icon: LayoutGrid },
]

function HomeModeSwitch() {
  const { mode, setMode } = useHomeModeStore()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="Modo de exibição da home">
          <LayoutList className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {MODE_OPTIONS.map((opt) => {
          const Icon = opt.icon
          return (
            <DropdownMenuItem key={opt.value} onSelect={() => setMode(opt.value)}>
              <Icon /> {opt.label}
              {mode === opt.value && <Check className="ml-auto size-3.5" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Grade de atalhos (home clássica de cards) ──────────────────────────────────

function CardsHome({ role }: { role: Role | undefined | null }) {
  const user = useAuthStore((s) => s.user)
  const visibleCards = SECTION_CARDS.filter((c) => c.show(role))
  const today = format(new Date(), "EEEE',' dd 'de' MMMM", { locale: ptBR })

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">
          {greeting()}, {firstName(user?.name)}
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground capitalize">{today}</span>
          {role && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-xs font-medium text-muted-foreground">{ROLE_LABELS[role]}</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Suas áreas de trabalho
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visibleCards.map((card) => (
            <SectionCardItem key={card.to} card={card} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  const role = useAuthStore((s) => s.user?.role)
  const mode = useHomeModeStore((s) => s.mode)
  const effective = resolveHomeMode(mode, role)

  return (
    <div className="relative">
      <div className="absolute right-3 top-3 z-10">
        <HomeModeSwitch />
      </div>
      {effective === 'OPERATION' ? <OperationHome /> : <CardsHome role={role} />}
    </div>
  )
}
