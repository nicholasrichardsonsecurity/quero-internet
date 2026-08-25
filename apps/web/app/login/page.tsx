import { ArrowRight, LockKeyhole, ShieldCheck, Wifi } from 'lucide-react';
import Link from 'next/link';
import './login.css';

export default function LoginPage() {
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
        <form><label htmlFor="email">E-mail institucional</label><input id="email" name="email" type="email" autoComplete="username" placeholder="nome@instituicao.gov.br"/><label htmlFor="password">Senha</label><input id="password" name="password" type="password" autoComplete="current-password" placeholder="Sua senha"/><div className="form-meta"><label className="remember"><input type="checkbox"/> Manter sessão neste dispositivo</label><a href="#">Esqueci minha senha</a></div><Link className="login-submit" href="/">Entrar no sistema <ArrowRight size={17}/></Link></form>
        <div className="security-note"><LockKeyhole size={16}/><span>O acesso é restrito e auditado. Não compartilhe suas credenciais.</span></div><p className="login-demo-note">Interface de homologação. A autenticação real será conectada ao contrato de sessão do backend.</p>
      </div></section>
    </main>
  );
}
