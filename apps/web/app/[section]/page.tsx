import { ArrowLeft, Construction, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import './module.css';

const modules: Record<string, { title: string; description: string }> = {
  beneficiarios:{title:'Beneficiários',description:'Gestão de elegibilidade, cadastro, situação e vínculo com programas.'},cadastros:{title:'Cadastros',description:'Fila operacional de inscrições, validações e pendências documentais.'},programas:{title:'Programas',description:'Configuração e acompanhamento dos programas públicos de conectividade.'},provedores:{title:'Provedores',description:'Gestão dos provedores credenciados, capacidade e operação FTTH.'},cobertura:{title:'Cobertura',description:'Visão territorial de disponibilidade, expansão e capacidade de atendimento.'},relatorios:{title:'Relatórios',description:'Indicadores, snapshots e evidências para gestão e prestação de contas.'},integracoes:{title:'Integrações',description:'Conectores com ERPs de provedores e serviços externos autorizados.'},auditoria:{title:'Auditoria',description:'Trilha imutável de eventos relevantes, acessos e decisões operacionais.'},configuracoes:{title:'Configurações',description:'Parâmetros do município, organização, perfis e políticas do ambiente.'},ajuda:{title:'Ajuda',description:'Central de orientação operacional e suporte institucional.'}
};

export default async function ModulePage({params}:{params:Promise<{section:string}>}){
  const {section}=await params; const module=modules[section];
  if(!module)return <main className="module-page"><div className="module-card"><h1>Módulo não encontrado</h1><Link href="/">Voltar à visão geral</Link></div></main>;
  return <main className="module-page"><div className="module-top"><Link href="/" className="back-link"><ArrowLeft size={17}/> Visão geral</Link><span className="demo-badge">DADOS DEMONSTRATIVOS</span></div><section className="module-card"><span className="module-icon"><Construction size={25}/></span><span className="eyebrow">MISSÃO 1.1 • NAVEGAÇÃO</span><h1>{module.title}</h1><p>{module.description}</p><div className="module-gate"><ShieldCheck size={18}/><div><strong>Rota real criada</strong><span>O módulo já possui endereço próprio. Regras, dados e ações serão liberados por missão, sempre respeitando RBAC e isolamento organizacional.</span></div></div></section></main>;
}
