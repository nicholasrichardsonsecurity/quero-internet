'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Building2,
  ChevronDown,
  CircleHelp,
  FileBarChart,
  FileText,
  Gauge,
  Home,
  LogOut,
  MapPinned,
  Network,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  Wifi
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buildOperationalDashboard, type SessionSummary } from '../lib/operational-dashboard';

const navItems = [
  { label: 'Visão geral', icon: Home, href: '/', section: 'dashboard' },
  { label: 'Beneficiários', icon: Users, href: '/beneficiarios', section: 'beneficiarios' },
  { label: 'Cadastros', icon: FileText, href: '/cadastros', section: 'cadastros' },
  { label: 'Programas', icon: Gauge, href: '/programas', section: 'programas' },
  { label: 'Provedores', icon: Building2, href: '/provedores', section: 'provedores' },
  { label: 'Cobertura', icon: MapPinned, href: '/cobertura', section: 'cobertura' },
  { label: 'Relatórios', icon: FileBarChart, href: '/relatorios', section: 'relatorios' },
  { label: 'Integrações', icon: Network, href: '/integracoes', section: 'integracoes' },
  { label: 'Auditoria', icon: ShieldCheck, href: '/auditoria', section: 'auditoria' },
  { label: 'Configurações', icon: Settings, href: '/configuracoes', section: 'configuracoes' }
];

const roleLabels: Record<string, string> = {
  ORGANIZATION_OWNER: 'Dono da organização',
  ORGANIZATION_ADMIN: 'Administrador',
  SUPER_ADMIN: 'Superadministrador',
  MUNICIPAL_MANAGER: 'Gestor Municipal',
  MUNICIPAL_OPERATOR: 'Operador Municipal',
  PROVIDER_MANAGER: 'Gestor do Provedor',
  PROVIDER_OPERATOR: 'Operador do Provedor',
  PROVIDER_TECHNICIAN: 'Técnico do Provedor',
  AUDITOR: 'Auditor',
  SUPPORT: 'Suporte'
};

const stageMax = 126;
const icons = [Users, ShieldCheck, Building2, Wifi, FileText, Gauge];

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionSummary | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('unauthorized');
        setSession((await response.json()) as SessionSummary);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  const dashboard = useMemo(() => buildOperationalDashboard(session), [session]);
  const displayName = session?.user.displayName || session?.user.email || 'Usuário';
  const initials = useMemo(
    () => displayName.split(/\s|@/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'QI',
    [displayName]
  );
  const roleLabel = session?.roles?.map((role) => roleLabels[role] ?? role).join(' • ') || 'Validando perfil';

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.replace('/login');
    router.refresh();
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Wifi size={23} /></div>
          <div className="brand-copy"><strong>Quero Internet</strong><small>GOVTECH</small></div>
        </div>

        <div className="profile-card">
          <div className="avatar">{initials}</div>
          <div className="profile-text"><strong>{displayName}</strong><small>{roleLabel}</small></div>
          <ChevronDown size={14} style={{ marginLeft: 'auto' }} />
        </div>

        <div className="nav-label">Navegação</div>
        <nav className="nav" aria-label="Navegação principal">
          {navItems.map(({ label, icon: Icon, href, section }) => (
            <Link key={label} href={href} className={`nav-item${section === 'dashboard' ? ' active' : ''}`} aria-current={section === 'dashboard' ? 'page' : undefined}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="nav-spacer" />
        <div className="sidebar-bottom">
          <div className="municipality-card">
            <MapPinned size={18} />
            <div><small>Contexto seguro</small><strong>{dashboard.scopeLabel}</strong></div>
          </div>
          <Link className="nav-item" href="/ajuda"><CircleHelp size={18} /><span>Ajuda</span></Link>
          <button className="nav-item nav-button" type="button" onClick={logout}><LogOut size={18} /><span>Sair</span></button>
        </div>
      </aside>

      <section className="main">
        <header className="topbar">
          <div className="breadcrumb">Plataforma / Operação / {dashboard.persona}</div>
          <div className="top-actions">
            <button className="icon-btn" aria-label="Pesquisar"><Search size={18} /></button>
            <button className="icon-btn" aria-label="Notificações"><Bell size={18} /></button>
            <div className="user-chip">
              <div className="avatar">{initials}</div>
              <div><strong>{roleLabel}</strong><span>{session?.user.email ?? 'Validando sessão...'}</span></div>
              <ChevronDown size={14} />
            </div>
          </div>
        </header>

        <div className="content operational-content">
          <section className="hero-panel">
            <div>
              <span className="eyebrow">MISSÃO 1.8 • DASHBOARD OPERACIONAL</span>
              <h1>{dashboard.title}</h1>
              <p>{dashboard.subtitle}</p>
            </div>
            <div className="hero-side">
              <span className="demo-badge">DADOS OPERACIONAIS DE REFERÊNCIA</span>
              <strong>{dashboard.scopeLabel}</strong>
              <small>Preparado para conectar aos endpoints reais sem ampliar permissões.</small>
            </div>
          </section>

          <section className="kpi-grid operational-kpis">
            {dashboard.kpis.map(({ label, value, detail, tone }) => (
              <article className="card kpi" key={label}>
                <div className="kpi-top"><span className={`kpi-icon ${tone}`}><Gauge size={20} /></span><span className="kpi-label">Perfil autorizado</span></div>
                <div><div className="kpi-label">{label}</div><div className="kpi-value">{value}</div></div>
                <div className="kpi-trend">{detail}</div>
              </article>
            ))}
          </section>

          <section className="grid-2 operational-grid">
            <article className="card panel journey-panel">
              <div className="panel-title"><h2>Esteira operacional do benefício</h2><Link href="/relatorios">Ver relatórios</Link></div>
              <div className="journey-list">
                {dashboard.stages.map(({ label, value, description }, index) => {
                  const Icon = icons[index % icons.length];
                  return (
                    <div className="journey-row" key={label}>
                      <span className="journey-icon"><Icon size={17} /></span>
                      <div className="journey-body">
                        <div className="journey-head"><strong>{label}</strong><span>{value}</span></div>
                        <div className="progress"><span style={{ width: `${Math.max(12, Math.round((value / stageMax) * 100))}%` }} /></div>
                        <small>{description}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="card panel">
              <div className="panel-title"><h2>Fila prioritária</h2><Link href="/cadastros">Abrir fila</Link></div>
              <div className="queue-list">
                {dashboard.queues.map((item) => (
                  <div className="queue-row" key={item.title}>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.owner} • SLA {item.sla}</small>
                    </div>
                    <span className={`priority ${item.priority.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`}>{item.priority}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="bottom-grid operational-bottom">
            <article className="card panel action-panel">
              <div className="panel-title"><h2>Próximas ações recomendadas</h2><ShieldCheck size={18} /></div>
              {dashboard.nextActions.map((action) => (
                <div className="action-row" key={action}><span>✓</span><strong>{action}</strong></div>
              ))}
            </article>

            <article className="card panel privacy-panel">
              <div className="panel-title"><h2>Privacidade e limite do perfil</h2><Link href="/auditoria">Auditoria</Link></div>
              <p>{dashboard.privacyNote}</p>
              <div className="privacy-grid">
                <span>Sem CPF bruto</span>
                <span>Sem decisão por IA</span>
                <span>Tenant isolado</span>
                <span>RBAC obrigatório</span>
              </div>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
