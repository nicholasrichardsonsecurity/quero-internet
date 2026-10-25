'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, Info, KeyRound, Loader2, LogOut, PlugZap, RefreshCcw, Save, ShieldCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../faturamento-provedor/billing.css';
import './integrations.css';

type Provider = 'IXC' | 'SGP';
type Connection = {
  provider: Provider;
  configured: boolean;
  source: 'SCREEN' | 'ENVIRONMENT' | null;
  baseUrl: string | null;
  apiUser: string | null;
  apiApp: string | null;
  tokenLast4: string | null;
  status: 'UNTESTED' | 'OK' | 'FAILED' | null;
  lastTestedAt: string | null;
  lastTestMessage: string | null;
};
type Overview = { realReadsEnabled: boolean; encryptionConfigured: boolean; connections: Connection[] };

const MANAGER_ROLES = ['ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROVIDER_MANAGER'];

const COPY: Record<Provider, { name: string; intro: string; urlHint: string; steps: string[] }> = {
  IXC: {
    name: 'IXC Provedor',
    intro: 'Webservice do IXCSoft.',
    urlHint: 'Só o endereço, por exemplo https://ixc.seuprovedor.com.br',
    steps: [
      'No IXC, abra Configurações → Usuários e crie um usuário só para o Quero Internet.',
      'Marque “Permite acesso ao webservice” e dê permissão de leitura em clientes e contratos.',
      'Copie o token na aba Token (formato ID:token) e libere o IP do servidor do Quero Internet.'
    ]
  },
  SGP: {
    name: 'SGP',
    intro: 'API URA do SGP.',
    urlHint: 'Só o endereço, por exemplo https://seuprovedor.sgp.net.br',
    steps: [
      'No SGP, abra Administração → Integrações → Tokens e crie um token novo.',
      'Libere somente a rota de consulta de cliente (consultacliente).',
      'Anote o nome do app exatamente como foi cadastrado (maiúsculas contam).'
    ]
  }
};

function errorMessage(body: unknown, fallback: string): string {
  const message = (body as { message?: string | string[] } | null)?.message;
  return Array.isArray(message) ? message.join(' ') : message || fallback;
}

function statusOf(c: Connection): { label: string; css: string } {
  if (c.source === 'ENVIRONMENT') return { label: 'Configurado no servidor', css: 'env' };
  if (!c.configured) return { label: 'Não configurado', css: 'none' };
  if (c.status === 'OK') return { label: 'Conectado', css: 'ok' };
  if (c.status === 'FAILED') return { label: 'Falhou no teste', css: 'failed' };
  return { label: 'Salvo, ainda não testado', css: 'untested' };
}

function when(value: string | null) {
  return value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : null;
}

function ConnectionCard({ connection, canManage, encryptionConfigured, onChange }: {
  connection: Connection; canManage: boolean; encryptionConfigured: boolean; onChange: (overview: Overview) => void;
}) {
  const { provider } = connection;
  const copy = COPY[provider];
  const [busy, setBusy] = useState<'save' | 'test' | 'remove' | null>(null);
  const [dirty, setDirty] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const status = statusOf(connection);
  const editable = canManage && encryptionConfigured && busy === null;

  async function call(kind: 'save' | 'test' | 'remove', init: RequestInit, url: string) {
    setBusy(kind); setFeedback(null);
    const response = await fetch(url, { cache: 'no-store', ...init });
    const body = await response.json().catch(() => null);
    setBusy(null);
    if (!response.ok) { setFeedback({ ok: false, text: errorMessage(body, 'Não foi possível concluir a operação.') }); return null; }
    return body;
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      baseUrl: String(data.get('baseUrl') ?? ''),
      user: provider === 'IXC' ? String(data.get('user') ?? '') : undefined,
      app: provider === 'SGP' ? String(data.get('app') ?? '') : undefined,
      token: String(data.get('token') ?? '') || undefined
    };
    const body = await call('save', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }, `/api/integrations/${provider}/connection`);
    if (body) { form.reset(); setDirty(false); onChange(body as Overview); setFeedback({ ok: true, text: 'Credenciais salvas. Teste a conexão para confirmar.' }); }
  }

  async function test() {
    const body = await call('test', { method: 'POST' }, `/api/integrations/${provider}/connection/test`) as { ok: boolean; message: string } | null;
    if (!body) return;
    setFeedback({ ok: body.ok, text: body.message });
    const refreshed = await fetch('/api/integrations/connections', { cache: 'no-store' });
    if (refreshed.ok) onChange(await refreshed.json() as Overview);
  }

  async function remove() {
    if (!window.confirm(`Remover as credenciais do ${copy.name}? A conciliação volta ao modo simulado.`)) return;
    const body = await call('remove', { method: 'DELETE' }, `/api/integrations/${provider}/connection`);
    if (body) { setDirty(false); onChange(body as Overview); }
  }

  const saved = connection.source === 'SCREEN';
  const lastTested = when(connection.lastTestedAt);

  return <article className="connection-card" aria-labelledby={`conn-${provider}`}>
    <div className="connection-head">
      <div><h2 id={`conn-${provider}`}>{copy.name}</h2><p>{copy.intro} Somente leitura.</p></div>
      <span className={`conn-status ${status.css}`}>{status.label}</span>
    </div>
    <ol className="help-steps">{copy.steps.map(step => <li key={step}>{step}</li>)}</ol>
    <form className="connection-form" onSubmit={(event) => void save(event)} onChange={() => setDirty(true)} key={`${provider}-${connection.baseUrl}-${connection.tokenLast4}`}>
      <div className="field">
        <label htmlFor={`${provider}-url`}>Endereço do sistema</label>
        <input id={`${provider}-url`} name="baseUrl" type="url" required defaultValue={connection.baseUrl ?? ''} placeholder="https://" disabled={!editable} autoComplete="off" />
        <small>{copy.urlHint}</small>
      </div>
      {provider === 'IXC' ? <div className="field">
        <label htmlFor="IXC-user">Usuário (ID)</label>
        <input id="IXC-user" name="user" defaultValue={connection.apiUser ?? ''} disabled={!editable} autoComplete="off" />
        <small>Pode ficar em branco se o token já vier no formato ID:token.</small>
      </div> : <div className="field">
        <label htmlFor="SGP-app">Nome do app</label>
        <input id="SGP-app" name="app" required defaultValue={connection.apiApp ?? ''} disabled={!editable} autoComplete="off" />
      </div>}
      <div className="field">
        <label htmlFor={`${provider}-token`}>Token</label>
        <input id={`${provider}-token`} name="token" type="password" required={!saved} disabled={!editable} autoComplete="new-password" spellCheck={false}
          placeholder={saved ? `•••••••• ${connection.tokenLast4}` : 'Cole o token aqui'} />
        <small>{saved ? 'Deixe em branco para manter o token salvo.' : 'Guardado cifrado. Depois de salvo, ele não aparece mais.'}</small>
      </div>
      {canManage ? <div className="connection-actions">
        <button type="submit" className="billing-action" disabled={!editable || (saved && !dirty)}>{busy === 'save' ? <Loader2 className="spin" size={15} /> : <Save size={15} />} Salvar</button>
        <button type="button" className="btn-secondary" disabled={!saved || dirty || busy !== null} onClick={() => void test()}>{busy === 'test' ? <Loader2 className="spin" size={15} /> : <PlugZap size={15} />} Testar conexão</button>
        <button type="button" className="btn-danger" disabled={!saved || busy !== null} onClick={() => void remove()}><Trash2 size={15} /> Remover</button>
      </div> : <p className="billing-note">Só dono, administrador ou gestor do provedor altera as credenciais.</p>}
    </form>
    {feedback ? <div className={`connection-result ${feedback.ok ? 'ok' : 'failed'}`} role="status">{feedback.text}</div>
      : saved && connection.lastTestMessage ? <div className={`connection-result ${connection.status === 'OK' ? 'ok' : 'failed'}`}>{connection.lastTestMessage}{lastTested ? ` · testado em ${lastTested}` : ''}</div> : null}
  </article>;
}

export default function IntegrationsPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const [connections, me] = await Promise.all([
      fetch('/api/integrations/connections', { cache: 'no-store' }),
      fetch('/api/auth/me', { cache: 'no-store' })
    ]);
    const body = await connections.json().catch(() => null);
    if (connections.status === 401) { router.replace('/login'); return; }
    if (!connections.ok) setError(errorMessage(body, 'Não foi possível carregar as integrações.'));
    else setOverview(body as Overview);
    const session = me.ok ? await me.json().catch(() => null) as { roles?: string[] } | null : null;
    setCanManage(Boolean(session?.roles?.some(role => MANAGER_ROLES.includes(role))));
    setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined); router.replace('/login'); router.refresh(); }

  return <main className="billing-page">
    <div className="billing-top"><Link href="/" className="billing-back"><ArrowLeft size={16} /> Visão geral</Link><div className="billing-actions"><button className="billing-refresh" onClick={() => void load()}><RefreshCcw size={15} /> Atualizar</button><button className="billing-logout" onClick={() => void logout()}><LogOut size={15} /> Sair</button></div></div>
    <section className="billing-hero"><div><span className="eyebrow">INTEGRAÇÕES • ERP DO PROVEDOR</span><h1>Conecte o IXC ou o SGP</h1><p>O Quero Internet só lê o seu sistema para conferir se o serviço de cada beneficiário está ativo. Não altera cadastro, não cobra e não grava nada no ERP.</p></div><KeyRound size={42} /></section>
    {overview && !overview.encryptionConfigured ? <div className="integrations-banner warn" role="alert"><AlertTriangle size={16} /><span>O cadastro de credenciais está desligado neste ambiente: falta a chave de criptografia no servidor. Peça ao responsável pela implantação para configurar <strong>INTEGRATION_ENCRYPTION_KEY</strong>.</span></div> : null}
    {overview && !overview.realReadsEnabled ? <div className="integrations-banner info"><Info size={16} /><span>A conciliação está em modo simulado neste ambiente. O botão “Testar conexão” fala com o seu ERP de verdade.</span></div> : null}
    {error ? <div className="billing-message" role="alert">{error}</div> : null}
    {loading ? <div className="billing-empty"><Loader2 className="spin" size={20} /> Carregando integrações...</div> : overview ? <section className="integrations-grid">
      {overview.connections.map(connection => <ConnectionCard key={connection.provider} connection={connection} canManage={canManage} encryptionConfigured={overview.encryptionConfigured} onChange={setOverview} />)}
    </section> : null}
    <p className="billing-note" style={{ marginTop: 18, display: 'flex', gap: 8, alignItems: 'center' }}><ShieldCheck size={15} />Tokens ficam cifrados, nunca voltam para a tela e cada alteração entra na trilha de auditoria.</p>
  </main>;
}
