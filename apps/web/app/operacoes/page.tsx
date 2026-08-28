'use client';

import { AlertTriangle, ArrowLeft, CheckCircle2, ClipboardList, Network, RefreshCw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import './page.css';

type Overview = {
  context: 'municipality' | 'provider';
  generatedAt: string;
  counters: {
    submittedApplications: number;
    eligibleApplications: number;
    pendingReferrals: number;
    feasibleAssessments: number;
    openInstallations: number;
    activeServices: number;
    attentionItems: number;
  };
  items: Array<{
    applicationId: string;
    referralId: string | null;
    programName: string;
    organizationName: string | null;
    applicationStatus: string;
    referralStatus: string | null;
    feasibilityResult: string | null;
    installationStatus: string | null;
    serviceStatus: string | null;
    submittedAt: string;
    lastUpdatedAt: string;
  }>;
};

const statusLabels: Record<string, string> = {
  SUBMITTED: 'Enviada',
  UNDER_REVIEW: 'Em análise',
  ELIGIBLE: 'Elegível',
  INELIGIBLE: 'Inelegível',
  REFERRED: 'Encaminhada',
  CANCELLED: 'Cancelada',
  PENDING: 'Pendente',
  ACCEPTED: 'Aceita',
  DECLINED: 'Recusada',
  FEASIBLE: 'Viável',
  EXPANSION_REQUIRED: 'Expansão necessária',
  NOT_FEASIBLE: 'Não viável',
  INSTALLATION_PENDING: 'Instalação pendente',
  SCHEDULED: 'Agendada',
  IN_PROGRESS: 'Em execução',
  INSTALLED: 'Instalada',
  ACTIVATED: 'Ativada',
  FAILED: 'Falhou',
  ACTIVE: 'Ativo',
  SUSPENDED: 'Suspenso',
  INTERRUPTED: 'Interrompido',
  ENDED: 'Encerrado'
};

function label(value: string | null) {
  if (!value) return '—';
  return statusLabels[value] ?? value;
}

function shortId(value: string | null) {
  if (!value) return '—';
  return value.slice(0, 8);
}

export default function OperationsPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/operations/overview', { cache: 'no-store' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message ?? 'Não foi possível carregar a visão operacional.');
      setData(body as Overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha inesperada ao carregar a visão operacional.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const cards = useMemo(() => {
    if (!data) return [];
    return [
      { label: 'Solicitações', value: data.counters.submittedApplications, helper: 'Entradas/encaminhamentos no funil', icon: ClipboardList },
      { label: 'Elegíveis', value: data.counters.eligibleApplications, helper: 'Prontas para avanço operacional', icon: CheckCircle2 },
      { label: 'Encaminhamentos pendentes', value: data.counters.pendingReferrals, helper: 'Aguardando resposta do provedor', icon: Network },
      { label: 'Instalações abertas', value: data.counters.openInstallations, helper: 'Pendente, agendada ou em campo', icon: RefreshCw },
      { label: 'Serviços ativos', value: data.counters.activeServices, helper: 'Ativados e acompanháveis', icon: ShieldCheck },
      { label: 'Atenção', value: data.counters.attentionItems, helper: 'Falhas, suspensões ou interrupções', icon: AlertTriangle }
    ];
  }, [data]);

  return (
    <main className="operations-page">
      <div className="operations-topbar">
        <Link href="/" className="operations-back"><ArrowLeft size={17} /> Visão geral</Link>
        <span className="operations-badge">MISSÃO 1.7 • SOMENTE LEITURA</span>
      </div>

      <section className="operations-hero">
        <div>
          <span className="operations-eyebrow">Painel operacional MVP</span>
          <h1>Acompanhe o funil do programa sem expor dados sensíveis.</h1>
          <p>
            Consolida solicitação, elegibilidade, encaminhamento, viabilidade, instalação, ativação e serviço ativo com
            escopo por organização e DTO minimizado.
          </p>
        </div>
        <button className="operations-refresh" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={16} /> Atualizar
        </button>
      </section>

      {error ? <div className="operations-error">{error}</div> : null}
      {loading ? <div className="operations-loading">Carregando visão operacional...</div> : null}

      {data ? (
        <>
          <section className="operations-context">
            <strong>Contexto:</strong> {data.context === 'municipality' ? 'Município' : 'Provedor'}
            <span>Atualizado em {new Date(data.generatedAt).toLocaleString('pt-BR')}</span>
          </section>

          <section className="operations-cards">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <article className="operations-card" key={card.label}>
                  <span className="operations-card-icon"><Icon size={18} /></span>
                  <strong>{card.value}</strong>
                  <h2>{card.label}</h2>
                  <p>{card.helper}</p>
                </article>
              );
            })}
          </section>

          <section className="operations-table-card">
            <div className="operations-table-head">
              <div>
                <span className="operations-eyebrow">Fila operacional</span>
                <h2>Últimos itens movimentados</h2>
              </div>
              <span>{data.items.length} itens</span>
            </div>

            <div className="operations-table-wrap">
              <table className="operations-table">
                <thead>
                  <tr>
                    <th>Solicitação</th>
                    <th>Programa</th>
                    <th>{data.context === 'municipality' ? 'Provedor' : 'Município'}</th>
                    <th>Elegibilidade</th>
                    <th>Encaminhamento</th>
                    <th>Viabilidade</th>
                    <th>Instalação</th>
                    <th>Serviço</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={`${item.applicationId}-${item.referralId ?? 'no-referral'}`}>
                      <td>
                        <strong>#{shortId(item.applicationId)}</strong>
                        <small>{new Date(item.submittedAt).toLocaleDateString('pt-BR')}</small>
                      </td>
                      <td>{item.programName}</td>
                      <td>{item.organizationName ?? '—'}</td>
                      <td>{label(item.applicationStatus)}</td>
                      <td>{label(item.referralStatus)}</td>
                      <td>{label(item.feasibilityResult)}</td>
                      <td>{label(item.installationStatus)}</td>
                      <td>{label(item.serviceStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
