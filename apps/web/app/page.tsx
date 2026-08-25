'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bell, Building2, ChevronDown, CircleHelp, FileBarChart, FileText, Gauge, Home, LogOut,
  MapPinned, Network, Search, Settings, ShieldCheck, UserRound, Users, Wifi
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Session = {
  sessionId: string;
  user: { id: string; email: string; displayName: string | null };
  organizationId: string;
  tenantIds: string[];
  roles: string[];
};

const navItems = [
  { label: 'Visão geral', icon: Home, href: '/', active: true },
  { label: 'Beneficiários', icon: Users, href: '/beneficiarios' },
  { label: 'Cadastros', icon: FileText, href: '/cadastros' },
  { label: 'Programas', icon: Gauge, href: '/programas' },
  { label: 'Provedores', icon: Building2, href: '/provedores' },
  { label: 'Cobertura', icon: MapPinned, href: '/cobertura' },
  { label: 'Relatórios', icon: FileBarChart, href: '/relatorios' },
  { label: 'Integrações', icon: Network, href: '/integracoes' },
  { label: 'Auditoria', icon: ShieldCheck, href: '/auditoria' },
  { label: 'Configurações', icon: Settings, href: '/configuracoes' }
];

const kpis = [
  { label: 'Beneficiários ativos', value: '2.458', trend: '+12% este mês', icon: Users, tone: 'blue' },
  { label: 'Conexões ativas', value: '2.312', trend: '+9% este mês', icon: Wifi, tone: 'green' },
  { label: 'Provedores parceiros', value: '7', trend: 'Sem alterações', icon: Building2, tone: 'violet' },
  { label: 'Ocorrências abertas', value: '18', trend: '-8% este mês', icon: FileText, tone: 'amber' }
];

const activity = [
  ['Novo beneficiário aprovado', 'Maria da Silva • Bairro do Nobre', 'Hoje, 10:34'],
  ['Conexão ativada', 'João Pereira • Bairro do Janga', 'Hoje, 09:21'],
  ['Ocorrência resolvida', 'Instabilidade de conexão • #1248', 'Ontem, 16:45'],
  ['Provedor cadastrado', 'Net Conecta Telecom', 'Ontem, 11:32']
];

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Superadministrador',
  MUNICIPAL_MANAGER: 'Gestor Municipal',
  MUNICIPAL_OPERATOR: 'Operador Municipal',
  PROVIDER_MANAGER: 'Gestor do Provedor',
  PROVIDER_TECHNICIAN: 'Técnico do Provedor',
  BENEFICIARY: 'Beneficiário',
  AUDITOR: 'Auditor'
};

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('unauthorized');
        setSession((await response.json()) as Session);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  const displayName = session?.user.displayName || session?.user.email || 'Usuário';
  const initials = useMemo(() => displayName.split(/\s|@/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'QI', [displayName]);
  const roleLabel = session?.roles?.map((role) => roleLabels[role] ?? role).join(' • ') || 'Validando perfil';

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.replace('/login');
    router.refresh();
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Wifi size={23}/></div><div className="brand-copy"><strong>Quero Internet</strong><small>GOVTECH</small></div></div>
        <div className="profile-card"><div className="avatar">{initials}</div><div className="profile-text"><strong>{displayName}</strong><small>{roleLabel}</small></div><ChevronDown size={14} style={{marginLeft:'auto'}}/></div>
        <div className="nav-label">Navegação</div>
        <nav className="nav" aria-label="Navegação principal">{navItems.map(({label,icon:Icon,href,active}) => <Link key={label} href={href} className={`nav-item${active?' active':''}`} aria-current={active?'page':undefined}><Icon size={18}/><span>{label}</span></Link>)}</nav>
        <div className="nav-spacer"/>
        <div className="sidebar-bottom">
          <div className="municipality-card"><MapPinned size={18}/><div><small>Contexto organizacional</small><strong>{session?.organizationId ? `Org. ${session.organizationId.slice(0, 8)}` : 'Validando...'}</strong></div></div>
          <Link className="nav-item" href="/ajuda"><CircleHelp size={18}/><span>Ajuda</span></Link>
          <button className="nav-item nav-button" type="button" onClick={logout}><LogOut size={18}/><span>Sair</span></button>
        </div>
      </aside>

      <section className="main">
        <header className="topbar">
          <div className="breadcrumb">Plataforma / Município / Visão geral</div>
          <div className="top-actions"><button className="icon-btn" aria-label="Pesquisar"><Search size={18}/></button><button className="icon-btn" aria-label="Notificações"><Bell size={18}/></button><div className="user-chip"><div className="avatar">{initials}</div><div><strong style={{display:'block',fontSize:12}}>{roleLabel}</strong><span style={{color:'#64748b',fontSize:10}}>{session?.user.email ?? 'Validando sessão...'}</span></div><ChevronDown size={14}/></div></div>
        </header>

        <div className="content">
          <div className="heading-row"><div><h1>Visão geral</h1><p>Acompanhe os principais indicadores operacionais do programa municipal.</p></div><span className="demo-badge">DADOS DEMONSTRATIVOS</span></div>
          <section className="kpi-grid">{kpis.map(({label,value,trend,icon:Icon,tone}) => <article className="card kpi" key={label}><div className="kpi-top"><span className={`kpi-icon ${tone}`}><Icon size={20}/></span><span className="kpi-label">Atualizado agora</span></div><div><div className="kpi-label">{label}</div><div className="kpi-value">{value}</div></div><div className="kpi-trend">{trend}</div></article>)}</section>
          <section className="grid-2"><article className="card panel"><div className="panel-title"><h2>Beneficiários ativos por mês</h2><button>Últimos 6 meses</button></div><div className="chart">{[48,56,69,74,78,83].map((height,index) => <div className="bar-wrap" key={index}><div className="bar" style={{height:`${height}%`}}/><span>{['Mar','Abr','Mai','Jun','Jul','Ago'][index]}</span></div>)}</div></article><article className="card panel"><div className="panel-title"><h2>Beneficiários por situação</h2><Link href="/beneficiarios">Detalhes</Link></div><div className="status-list"><div className="status-row"><span className="dot green"/><span>Ativos</span><strong>2.312 (94%)</strong></div><div className="status-row"><span className="dot amber"/><span>Pendentes</span><strong>86 (3,5%)</strong></div><div className="status-row"><span className="dot red"/><span>Suspensos</span><strong>45 (1,8%)</strong></div><div className="status-row"><span className="dot slate"/><span>Cancelados</span><strong>15 (0,6%)</strong></div></div></article></section>
          <section className="bottom-grid"><article className="card panel activity"><div className="panel-title"><h2>Atividades recentes</h2><Link href="/auditoria">Ver todas</Link></div>{activity.map(([title,subtitle,time]) => <div className="activity-row" key={title}><div className="activity-icon"><UserRound size={17}/></div><div className="activity-text"><strong>{title}</strong><small>{subtitle}</small></div><span className="activity-time">{time}</span></div>)}</article><article className="card panel"><div className="panel-title"><h2>Mapa de cobertura</h2><Link href="/cobertura">Ver mapa completo</Link></div><div className="map-placeholder"><span className="map-label">Paulista - PE</span></div><div className="map-legend"><span>● Cobertura ativa</span><span>● Expansão planejada</span><span>● Sem cobertura</span></div></article></section>
        </div>
      </section>
    </main>
  );
}
