'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck, Wifi } from 'lucide-react';
import { useRouter } from 'next/navigation';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const data = new FormData(event.currentTarget);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: String(data.get('email') ?? ''),
        password: String(data.get('password') ?? '')
      })
    }).catch(() => null);

    if (!response?.ok) {
      let message = 'Não foi possível entrar. Verifique suas credenciais e tente novamente.';
      if (response) {
        try {
          const body = (await response.json()) as { message?: string };
          if (body.message) message = body.message;
        } catch {
          // mantém mensagem genérica
        }
      }
      setError(message);
      setLoading(false);
      return;
    }

    router.replace('/');
    router.refresh();
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="login-brand"><span className="brand-mark"><Wifi size={24} /></span><div><strong>Quero Internet</strong><small>GOVTECH</small></div></div>
        <div className="login-message"><span className="eyebrow">GESTÃO PÚBLICA DIGITAL</span><h1>Conectividade pública com governança de ponta a ponta.</h1><p>Gestão segura de beneficiários, programas, provedores e evidências operacionais em uma única plataforma.</p><div className="trust-row"><ShieldCheck size={18}/><span>LGPD • RBAC • Auditoria • Multi-organização</span></div></div>
        <small className="login-foot">Quero Internet GovTech • Ambiente institucional</small>
      </section>
      <section className="login-form-wrap"><div className="login-form-card">
        <div className="mobile-login-brand"><span className="brand-mark"><Wifi size={22}/></span><strong>Quero Internet</strong></div>
        <span className="eyebrow">ACESSO INSTITUCIONAL</span><h2>Bem-vindo</h2><p className="form-intro">Entre com suas credenciais para acessar o ambiente autorizado.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">E-mail institucional</label>
          <input id="email" name="email" type="email" autoComplete="username" placeholder="nome@instituicao.gov.br" required disabled={loading}/>
          <label htmlFor="password">Senha</label>
          <input id="password" name="password" type="password" autoComplete="current-password" placeholder="Sua senha" required disabled={loading}/>
          {error ? <div className="login-error" role="alert">{error}</div> : null}
          <button className="login-submit" type="submit" disabled={loading}>{loading ? 'Validando acesso...' : 'Entrar no sistema'} {!loading ? <ArrowRight size={17}/> : null}</button>
        </form>
        <div className="security-note"><LockKeyhole size={16}/><span>O acesso é restrito e auditado. O token de sessão fica protegido em cookie HttpOnly.</span></div>
      </div></section>
    </main>
  );
}
