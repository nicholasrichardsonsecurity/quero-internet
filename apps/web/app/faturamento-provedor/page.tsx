'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, FileText, Loader2, LogOut, RefreshCcw, Send, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './billing.css';

type Measurement = {
  id: string;
  competenceStart: string;
  competenceEnd: string;
  status: string;
  beneficiaryCount: number;
  activeServiceCount: number;
  totalAmount: string;
  submittedAt?: string | null;
  approvedAt?: string | null;
};

function money(value: string) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value)); }
function date(value?: string | null) { return value ? new Intl.DateTimeFormat('pt-BR').format(new Date(value)) : '—'; }

export default function ProviderBillingPage() {
  const router = useRouter();
  const [items, setItems] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true); setMessage(null);
    const response = await fetch('/api/provider-billing/measurements', { cache: 'no-store' });
    const body = await response.json().catch(() => []);
    if (!response.ok) setMessage(body.message ?? 'Não foi possível carregar as medições.');
    else setItems(body as Measurement[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined); router.replace('/login'); router.refresh(); }

  async function submit(id: string) {
    setBusy(id); setMessage(null);
    const response = await fetch(`/api/provider-billing/measurements/${id}/submit`, { method: 'POST' });
    const body = await response.json().catch(() => null);
    setMessage(response.ok ? 'Medição enviada para aprovação municipal.' : (body?.message ?? 'Falha ao enviar medição.'));
    setBusy(null); if (response.ok) await load();
  }

  async function registerInvoice(event: FormEvent<HTMLFormElement>, item: Measurement) {
    event.preventDefault(); setBusy(item.id); setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/provider-billing/measurements/${item.id}/invoice`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        invoiceNumber: String(form.get('invoiceNumber') ?? ''),
        issueDate: String(form.get('issueDate') ?? ''),
        dueDate: String(form.get('dueDate') ?? ''),
        amount: Number(item.totalAmount),
        documentUrl: String(form.get('documentUrl') ?? ''),
        paymentUrl: String(form.get('paymentUrl') ?? ''),
        externalReference: String(form.get('externalReference') ?? '')
      })
    });
    const body = await response.json().catch(() => null);
    setMessage(response.ok ? 'NF registrada com sucesso.' : (body?.message ?? 'Falha ao registrar NF.'));
    setBusy(null); if (response.ok) await load();
  }

  return <main className="billing-page">
    <div className="billing-top"><Link href="/" className="billing-back"><ArrowLeft size={16}/> Visão geral</Link><div className="billing-actions"><button className="billing-refresh" onClick={() => void load()}><RefreshCcw size={15}/> Atualizar</button><button className="billing-logout" onClick={() => void logout()}><LogOut size={15}/> Sair</button></div></div>
    <section className="billing-hero"><div><span className="eyebrow">FATURAMENTO OPERACIONAL • PROVEDOR</span><h1>Medições e notas fiscais</h1><p>Registre o serviço prestado e acompanhe a aprovação municipal. O pagamento continua sendo feito diretamente pela prefeitura ao provedor.</p></div><ShieldCheck size={42}/></section>
    {message ? <div className="billing-message" role="status">{message}</div> : null}
    {loading ? <div className="billing-empty"><Loader2 className="spin" size={20}/> Carregando dados reais...</div> : items.length === 0 ? <div className="billing-empty">Nenhuma medição encontrada no contexto autorizado.</div> : <section className="billing-list">
      {items.map(item => <article className="billing-card" key={item.id}>
        <div className="billing-card-head"><div><strong>Competência {date(item.competenceStart)} — {date(item.competenceEnd)}</strong><small>{item.beneficiaryCount} beneficiário(s) • {item.activeServiceCount} serviço(s)</small></div><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></div>
        <div className="billing-meta"><span>Valor<strong>{money(item.totalAmount)}</strong></span><span>Enviada<strong>{date(item.submittedAt)}</strong></span><span>Aprovada<strong>{date(item.approvedAt)}</strong></span></div>
        {item.status === 'DRAFT' ? <button className="billing-action" disabled={busy === item.id} onClick={() => void submit(item.id)}>{busy === item.id ? <Loader2 className="spin" size={15}/> : <Send size={15}/>} Enviar para aprovação</button> : null}
        {item.status === 'APPROVED' ? <form className="invoice-form" onSubmit={event => void registerInvoice(event, item)}><div className="form-grid"><input name="invoiceNumber" required placeholder="Número da NF"/><input name="issueDate" required type="date"/><input name="dueDate" required type="date"/><input name="documentUrl" placeholder="URL da NF"/><input name="paymentUrl" placeholder="URL de pagamento"/><input name="externalReference" placeholder="Referência externa"/></div><button className="billing-action" disabled={busy === item.id}>{busy === item.id ? <Loader2 className="spin" size={15}/> : <FileText size={15}/>} Registrar NF própria</button></form> : null}
      </article>)}
    </section>}
  </main>;
}
