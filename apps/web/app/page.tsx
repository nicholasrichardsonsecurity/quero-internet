'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Building2,
  ChevronDown,
  CircleHelp,
  Database,
  FileBarChart,
  FileText,
  Gauge,
  Home,
  Loader2,
  LogOut,
  MapPinned,
  Network,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Wifi
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  buildReferenceOperationalDashboard,
  type OperationalDashboard,
  type SessionSummary
} from '../lib/operational-dashboard';

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

const icons = [Users, ShieldCheck, Building2, Wifi, FileText, Gauge];

type DashboardLoadState = 'loading-session' | 'loading-dashboard' | 'ready' | 'fallback';

function formatGeneratedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'horário indisponível';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
}

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [dashboard, setDashboard] = useState<OperationalDashboard | null>(null);
  const [status, setStatus] = useState<DashboardLoadState>('loading-session');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setErrorMessage(null);
    setStatus((current) => (current === 'loading-session' ? current : 'loading-dashboard'));
    let sessionData: SessionSummary | null = null;

    try {
      const sessionResponse = await fetch('/querointernet/api/auth/me', { cache: 'no-store' });
      if (!sessionResponse.ok) throw new Error('unauthorized');
      sessionData = (await sessionResponse.json()) as SessionSummary;
      setSession(sessionData);

      const dashboardResponse = await fetch('/querointernet/api/dashboard/operational', { cache: 'no-store' });
      if (!dashboardResponse.ok) {
        const problem = (await dashboardResponse.json().catch(() => null)) as { message?: string } | null;
        throw new Error(problem?.message || 'Não foi possível carregar o dashboard real.');
      }

      setDashboard((await dashboardResponse.json()) as OperationalDashboard);
      setStatus('ready');
    } catch (error) {
      if (error instanceof Error && error.message === 'unauthorized') {
        router.replace('/login');
        return;
      }

      const fallback = buildReferenceOperationalDashboard(sessionData);
      setDashboard(fallback);
      setErrorMessage(error instanceof Error ? error.message : 'Falha inesperada ao carregar os dados reais.');
      setStatus('fallback');
    }
  }, [router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const currentDashboard = dashboard ?? buildReferenceOperationalDashboard(session);
  const displayName = session?.user.displayName || session?.user.email || 'Usuário';
  const initials = useMemo(
    () => displayName.split(/\s|@/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'QI',
    [displayName]
  );
  const roleLabel = session?.roles?.map((role) => roleLabels[role] ?? role).join(' • ') || 'Validando perfil';
  const stageMax = Math.max(1, ...currentDashboard.stages.map((stage) => stage.value));
  const isLoading = status === 'loading-session' || status === 'loading-dashboard';
  const sourceLabel = currentDashboard.dataSource === 'database' ? 'DADOS DO BANCO' : 'FALLBACK CONTROLADO';
  const sourceDetail = currentDashboard.dataSource === 'database'
    ? `Atualizado em ${formatGeneratedAt(currentDashboard.generatedAt)}`
    : 'Exibindo referência segura até o endpoint responder.';

  async function logout() {
    await fetch('/querointernet/api/auth/logout', { method: 'POST' }).catch(() => undefined);
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
            <div><small>Contexto seguro</small><strong>{currentDashboard.scopeLabel}</strong></div>
          </div>
          <Link className="nav-item" href="/ajuda"><CircleHelp size={18} /><span>Ajuda</span></Link>
          <button className="nav-item nav-button" type="button" onClick={logout}><LogOut size={18} /><span>Sair</span></button>
        </div>
      </aside>

      <section className="main">
        <header className="topbar">
          <div className="breadcrumb">Plataforma / Operação / {currentDashboard.persona}</div>
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
              <span className="eyebrow">MISSÃO 1.10 • DASHBOARD COM DADOS REAIS</span>
              <h1>{currentDashboard.title}</h1>
              <p>{currentDashboard.subtitle}</p>
            </div>
            <div className="hero-side">
              <span className={`source-badge ${currentDashboard.dataSource}`}>{sourceLabel}</span>
              <strong>{currentDashboard.scopeLabel}</strong>
              <small>{sourceDetail}</small>
              <button className="refresh-button" type="button" onClick={() => void loadDashboard()} disabled={isLoading}>
                {isLoading ? <Loader2 size={15} className="spin" /> : <RefreshCcw size={15} />}
                <span>{isLoading ? 'Carregando...' : 'Atualizar dados'}</span>
              </button>
            </div>
          </section>

          {errorMessage ? (
            <section className="status-alert" role="status">
              <AlertTriangle size={18} />
              <div>
                <strong>Dashboard real indisponível no momento.</strong>
                <span>{errorMessage}</span>
              </div>
            </section>
          ) : null}

          {isLoading ? (
            <section className="status-alert loading" role="status">
              <Loader2 size={18} className="spin" />
              <div>
                <strong>Carregando dados operacionais do banco.</strong>
                <span>Validando sessão, permissões e escopo autorizado.</span>
              </div>
            </section>
          ) : null}

          <section className="kpi-grid operational-kpis">
            {currentDashboard.kpis.map(({ label, value, detail, tone }) => (
              <article className={`card kpi${isLoading ? ' skeleton-soft' : ''}`} key={label}>
                <div className="kpi-top"><span className={`kpi-icon ${tone}`}><Database size={20} /></span><span className="kpi-label">{sourceLabel}</span></div>
                <div><div className="kpi-label">{label}</div><div className="kpi-value">{value}</div></div>
                <div className="kpi-trend">{detail}</div>
              </article>
            ))}
          </section>

          <section className="grid-2 operational-grid">
            <article className="card panel journey-panel">
              <div className="panel-title"><h2>Esteira operacional do benefício</h2><Link href="/relatorios">Ver relatórios</Link></div>
              <div className="journey-list">
                {currentDashboard.stages.map(({ label, value, description }, index) => {
                  const Icon = icons[index % icons.length];
                  return (
                    <div className="journey-row" key={label}>
                      <span className="journey-icon"><Icon size={17} /></span>
                      <div className="journey-body">
                        <div className="journey-head"><strong>{label}</strong><span>{value}</span></div>
                        <div className="progress"><span style={{ width: `${Math.max(8, Math.round((value / stageMax) * 100))}%` }} /></div>
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
                {currentDashboard.queues.map((item) => (
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
              {currentDashboard.nextActions.map((action) => (
                <div className="action-row" key={action}><span>✓</span><strong>{action}</strong></div>
              ))}
            </article>

            <article className="card panel privacy-panel">
              <div className="panel-title"><h2>Privacidade e limite do perfil</h2><Link href="/auditoria">Auditoria</Link></div>
              <p>{currentDashboard.privacyNote}</p>
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
