'use client';

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
  Menu,
  Network,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  Wifi
} from 'lucide-react';

const navItems = [
  { label: 'Visão geral', icon: Home, active: true },
  { label: 'Beneficiários', icon: Users },
  { label: 'Cadastros', icon: FileText },
  { label: 'Programas', icon: Gauge },
  { label: 'Provedores', icon: Building2 },
  { label: 'Cobertura', icon: MapPinned },
  { label: 'Relatórios', icon: FileBarChart },
  { label: 'Integrações', icon: Network },
  { label: 'Auditoria', icon: ShieldCheck },
  { label: 'Configurações', icon: Settings }
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

export default function HomePage() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Wifi size={23} strokeWidth={2.2} /></div>
          <div className="brand-copy"><strong>Quero Internet</strong><small>GOVTECH</small></div>
        </div>

        <div className="profile-card">
          <div className="avatar">OG</div>
          <div className="profile-text"><strong>Olá, Operador</strong><small>Operador Municipal</small></div>
          <ChevronDown size={14} style={{ marginLeft: 'auto' }} />
        </div>

        <div className="nav-label">Navegação</div>
        <nav className="nav" aria-label="Navegação principal">
          {navItems.map(({ label, icon: Icon, active }) => (
            <a key={label} href="#" className={`nav-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
              <Icon size={18} strokeWidth={2} /><span>{label}</span>
            </a>
          ))}
        </nav>

        <div className="nav-spacer" />
        <div className="sidebar-bottom">
          <div className="municipality-card"><MapPinned size={18} /><div><small>Município selecionado</small><strong>Paulista - PE</strong></div></div>
          <a className="nav-item" href="#"><CircleHelp size={18} /><span>Ajuda</span></a>
          <a className="nav-item" href="#"><LogOut size={18} /><span>Sair</span></a>
        </div>
      </aside>

      <section className="main">
        <header className="topbar">
          <div className="breadcrumb">Plataforma / Município / Visão geral</div>
          <div className="top-actions">
            <button className="icon-btn" aria-label="Pesquisar"><Search size={18} /></button>
            <button className="icon-btn" aria-label="Notificações"><Bell size={18} /></button>
            <div className="user-chip">
              <div className="avatar">OG</div>
              <div><strong style={{ display:'block', fontSize:12 }}>Operador Municipal</strong><span style={{ color:'#64748b', fontSize:10 }}>Paulista - PE</span></div>
              <ChevronDown size={14} />
            </div>
          </div>
        </header>

        <div className="content">
          <div className="heading-row">
            <div><h1>Visão geral</h1><p>Acompanhe os principais indicadores operacionais do programa municipal.</p></div>
            <span className="demo-badge">DADOS DEMONSTRATIVOS</span>
          </div>

          <section className="kpi-grid" aria-label="Indicadores principais">
            {kpis.map(({ label, value, trend, icon: Icon, tone }) => (
              <article className="card kpi" key={label}>
                <div className="kpi-top"><span className={`kpi-icon ${tone}`}><Icon size={20} /></span><span className="kpi-label">Atualizado agora</span></div>
                <div><div className="kpi-label">{label}</div><div className="kpi-value">{value}</div></div>
                <div className="kpi-trend">{trend}</div>
              </article>
            ))}
          </section>

          <section className="grid-2">
            <article className="card panel">
              <div className="panel-title"><h2>Beneficiários ativos por mês</h2><button>Últimos 6 meses</button></div>
              <div className="chart" aria-label="Gráfico demonstrativo de beneficiários">
                {[48,56,69,74,78,83].map((height, index) => <div className="bar-wrap" key={index}><div className="bar" style={{height:`${height}%`}} /><span>{['Mar','Abr','Mai','Jun','Jul','Ago'][index]}</span></div>)}
              </div>
            </article>

            <article className="card panel">
              <div className="panel-title"><h2>Beneficiários por situação</h2><button>Detalhes</button></div>
              <div style={{ display:'grid', placeItems:'center', padding:'12px 0 22px' }}>
                <div style={{ width:150, height:150, borderRadius:'50%', background:'conic-gradient(#22c55e 0 94%, #f59e0b 94% 97%, #ef4444 97% 99%, #94a3b8 99% 100%)', display:'grid', placeItems:'center' }}>
                  <div style={{ width:102, height:102, borderRadius:'50%', background:'white', display:'grid', placeItems:'center', textAlign:'center' }}><div><small style={{color:'#64748b'}}>Total</small><strong style={{display:'block',fontSize:24}}>2.458</strong></div></div>
                </div>
              </div>
              <div className="status-list">
                <div className="status-row"><span className="dot green"/><span>Ativos</span><strong>2.312 (94%)</strong></div>
                <div className="status-row"><span className="dot amber"/><span>Pendentes</span><strong>86 (3,5%)</strong></div>
                <div className="status-row"><span className="dot red"/><span>Suspensos</span><strong>45 (1,8%)</strong></div>
                <div className="status-row"><span className="dot slate"/><span>Cancelados</span><strong>15 (0,6%)</strong></div>
              </div>
            </article>
          </section>

          <section className="bottom-grid">
            <article className="card panel activity">
              <div className="panel-title"><h2>Atividades recentes</h2><button>Ver todas</button></div>
              {activity.map(([title, subtitle, time]) => (
                <div className="activity-row" key={title}>
                  <div className="activity-icon"><UserRound size={17}/></div>
                  <div className="activity-text"><strong>{title}</strong><small>{subtitle}</small></div>
                  <span className="activity-time">{time}</span>
                </div>
              ))}
            </article>

            <article className="card panel">
              <div className="panel-title"><h2>Mapa de cobertura</h2><button>Ver mapa completo</button></div>
              <div className="map-placeholder"><span className="map-label">Paulista - PE</span></div>
              <div className="map-legend"><span>● Cobertura ativa</span><span>● Expansão planejada</span><span>● Sem cobertura</span></div>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
