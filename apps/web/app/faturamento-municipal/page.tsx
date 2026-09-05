'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, RefreshCcw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import './billing.css';

type Measurement = { id:string; competenceStart:string; competenceEnd:string; status:string; beneficiaryCount:number; activeServiceCount:number; totalAmount:string; submittedAt?:string|null; approvedAt?:string|null };
function money(value:string){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value));}
function date(value?:string|null){return value?new Intl.DateTimeFormat('pt-BR').format(new Date(value)):'—';}

export default function MunicipalBillingPage(){
  const [items,setItems]=useState<Measurement[]>([]); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState<string|null>(null); const [message,setMessage]=useState<string|null>(null);
  async function load(){setLoading(true);setMessage(null);const response=await fetch('/api/provider-billing/measurements',{cache:'no-store'});const body=await response.json().catch(()=>[]);if(!response.ok)setMessage(body.message??'Não foi possível carregar as medições.');else setItems(body as Measurement[]);setLoading(false);}
  useEffect(()=>{void load();},[]);
  async function approve(id:string){setBusy(id);setMessage(null);const response=await fetch(`/api/provider-billing/measurements/${id}/approve`,{method:'POST'});const body=await response.json().catch(()=>null);setMessage(response.ok?'Medição aprovada. O provedor já pode registrar a própria NF.':(body?.message??'Falha ao aprovar medição.'));setBusy(null);if(response.ok)await load();}
  return <main className="billing-page"><div className="billing-top"><Link href="/" className="billing-back"><ArrowLeft size={16}/> Visão geral</Link><button className="billing-refresh" onClick={()=>void load()}><RefreshCcw size={15}/> Atualizar</button></div><section className="billing-hero municipal"><div><span className="eyebrow">FATURAMENTO OPERACIONAL • MUNICÍPIO</span><h1>Conferência de serviços</h1><p>Analise a medição enviada pelo provedor e aprove somente o valor efetivamente comprovado. A NF do provedor não é emitida pela Aplivora.</p></div><ShieldCheck size={42}/></section>{message?<div className="billing-message" role="status">{message}</div>:null}{loading?<div className="billing-empty"><Loader2 className="spin" size={20}/> Carregando dados reais...</div>:items.length===0?<div className="billing-empty">Nenhuma medição encontrada no contexto autorizado.</div>:<section className="billing-list">{items.map(item=><article className="billing-card" key={item.id}><div className="billing-card-head"><div><strong>Competência {date(item.competenceStart)} — {date(item.competenceEnd)}</strong><small>{item.beneficiaryCount} beneficiário(s) • {item.activeServiceCount} serviço(s)</small></div><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></div><div className="billing-meta"><span>Valor<strong>{money(item.totalAmount)}</strong></span><span>Enviada<strong>{date(item.submittedAt)}</strong></span><span>Aprovada<strong>{date(item.approvedAt)}</strong></span></div>{item.status==='SUBMITTED'?<button className="billing-action approve" disabled={busy===item.id} onClick={()=>void approve(item.id)}>{busy===item.id?<Loader2 className="spin" size={15}/>:<CheckCircle2 size={15}/>} Aprovar medição</button>:<div className="billing-note">Esta medição está em <strong>{item.status}</strong>.</div>}</article>)}</section>}</main>;
}
