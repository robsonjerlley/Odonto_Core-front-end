import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Workflow, Users, Stethoscope, Handshake,
  LayoutDashboard, LineChart, UserCog, Settings,
  ArrowRight, type LucideIcon,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { can, analyticsScope } from '@/lib/permissions'
import { ROLE_LABELS } from '@/lib/labels'
import type { Role } from '@/types/enums'

// ─── Configuração dos cards de acesso ────────────────────────────────────────

interface SectionCard {
  to: string
  icon: LucideIcon
  title: string
  description: string
  show: (role: Role | undefined | null) => boolean
  accent?: string
}

const SECTION_CARDS: SectionCard[] = [
  {
    to: '/analytics',
    icon: LayoutDashboard,
    title: 'Analytics',
    description: 'Dashboard global, ROI de campanhas e desempenho da clínica.',
    show: (r) => analyticsScope(r) === 'GLOBAL',
    accent: 'text-brand',
  },
  {
    to: '/funnel',
    icon: Workflow,
    title: 'Pipeline',
    description: 'Gerencie tickets de leads, registre contatos e avance no funil.',
    show: (r) => can(r, 'TICKET', 'READ'),
    accent: 'text-sky-600',
  },
  {
    to: '/customers',
    icon: Users,
    title: 'Pacientes',
    description: 'Cadastro de clientes, histórico e dados de captação.',
    show: (r) => can(r, 'CUSTOMER', 'READ'),
    accent: 'text-violet-600',
  },
  {
    to: '/avaliacoes',
    icon: Stethoscope,
    title: 'Avaliações',
    description: 'Pacientes agendados e em avaliação. Crie orçamentos e encaminhe para negociação.',
    show: (r) => can(r, 'DEAL', 'CREATE'),
    accent: 'text-teal-600',
  },
  {
    to: '/commercial',
    icon: Handshake,
    title: 'Negociações',
    description: 'Deals ativos, descontos, fechamento e histórico de propostas.',
    show: (r) => can(r, 'DEAL', 'READ'),
    accent: 'text-emerald-600',
  },
  {
    to: '/meu-desempenho',
    icon: LineChart,
    title: 'Meu Desempenho',
    description: 'Suas métricas pessoais de atendimento e bônus do período.',
    show: (r) => analyticsScope(r) === 'OWN',
    accent: 'text-amber-600',
  },
  {
    to: '/users',
    icon: UserCog,
    title: 'Equipe',
    description: 'Gerenciamento de usuários, papéis e setores.',
    show: (r) => can(r, 'USER', 'READ'),
    accent: 'text-slate-600',
  },
  {
    to: '/config',
    icon: Settings,
    title: 'Configurações',
    description: 'Reciclagem de leads, bônus e investimentos em ADS.',
    show: (r) => can(r, 'CONFIG', 'CONFIGURE'),
    accent: 'text-slate-600',
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
      <div className={`flex size-10 items-center justify-center rounded-lg bg-muted ${card.accent ?? 'text-foreground'}`}>
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

// ─── Página ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role

  const visibleCards = SECTION_CARDS.filter((c) => c.show(role))
  const today = format(new Date(), "EEEE',' dd 'de' MMMM", { locale: ptBR })

  return (
    <div className="p-8 max-w-4xl space-y-8">
      {/* ── Saudação ── */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">
          {greeting()}, {firstName(user?.name)}
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground capitalize">{today}</span>
          {role && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-xs font-medium text-muted-foreground">
                {ROLE_LABELS[role]}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Cards de acesso ── */}
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
