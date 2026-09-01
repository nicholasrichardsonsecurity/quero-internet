export type SessionSummary = {
  sessionId: string;
  user: { id: string; email: string; displayName: string | null };
  organizationId: string;
  tenantIds: string[];
  roles: string[];
};

export type DashboardPersona = 'superadmin' | 'municipal' | 'provider' | 'auditor' | 'support';

export type OperationalKpi = {
  label: string;
  value: string;
  detail: string;
  tone: 'blue' | 'green' | 'violet' | 'amber' | 'red' | 'slate';
};

export type OperationalStage = {
  label: string;
  value: number;
  description: string;
};

export type WorkQueueItem = {
  title: string;
  owner: string;
  sla: string;
  priority: 'Alta' | 'Média' | 'Baixa';
};

export type DashboardDataSource = 'database' | 'reference';

export type OperationalDashboard = {
  persona: DashboardPersona;
  title: string;
  subtitle: string;
  scopeLabel: string;
  dataSource: DashboardDataSource;
  generatedAt: string;
  kpis: OperationalKpi[];
  stages: OperationalStage[];
  queues: WorkQueueItem[];
  nextActions: string[];
  privacyNote: string;
};

const personaByRole: Array<{ persona: DashboardPersona; roles: string[] }> = [
  { persona: 'superadmin', roles: ['ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN'] },
  { persona: 'municipal', roles: ['MUNICIPAL_MANAGER', 'MUNICIPAL_OPERATOR'] },
  { persona: 'provider', roles: ['PROVIDER_MANAGER', 'PROVIDER_OPERATOR', 'PROVIDER_TECHNICIAN'] },
  { persona: 'auditor', roles: ['AUDITOR'] },
  { persona: 'support', roles: ['SUPPORT'] }
];

export function resolveDashboardPersona(roles: readonly string[] = []): DashboardPersona {
  for (const rule of personaByRole) {
    if (rule.roles.some((role) => roles.includes(role))) return rule.persona;
  }
  return 'support';
}

export function buildReferenceOperationalDashboard(session: SessionSummary | null): OperationalDashboard {
  const persona = resolveDashboardPersona(session?.roles ?? []);
  const org = session?.organizationId ? session.organizationId.slice(0, 8) : 'sessão';

  const sharedStages: OperationalStage[] = [
    { label: 'Solicitações submetidas', value: 126, description: 'Entradas aguardando análise ou documentação.' },
    { label: 'Elegíveis', value: 88, description: 'Decisões humanas aprovadas para encaminhamento.' },
    { label: 'Encaminhadas', value: 72, description: 'Casos enviados a provedores participantes.' },
    { label: 'Viabilidade FTTH', value: 61, description: 'Casos com análise técnica registrada.' },
    { label: 'Instalação', value: 43, description: 'Ordens em agendamento, execução ou conclusão.' },
    { label: 'Serviço ativo', value: 37, description: 'Ativações registradas no ciclo de vida do serviço.' }
  ];

  const dashboards: Record<DashboardPersona, OperationalDashboard> = {
    superadmin: {
      persona,
      title: 'Painel executivo GovTech',
      subtitle: 'Visão consolidada da operação multi-organização, com foco em risco, adoção e gargalos.',
      scopeLabel: `Organização ${org} • Visão global autorizada`,
      dataSource: 'reference',
      generatedAt: new Date().toISOString(),
      kpis: [
        { label: 'Municípios em implantação', value: '4', detail: '2 prontos para homologação', tone: 'blue' },
        { label: 'Provedores participantes', value: '11', detail: '8 ativos na operação', tone: 'violet' },
        { label: 'Jornadas em andamento', value: '126', detail: 'Da solicitação ao serviço ativo', tone: 'green' },
        { label: 'Riscos operacionais', value: '7', detail: 'Exigem revisão antes do piloto', tone: 'amber' }
      ],
      stages: sharedStages,
      queues: [
        { title: 'Homologar município piloto', owner: 'Superadmin', sla: '48h', priority: 'Alta' },
        { title: 'Revisar provedores sem aceite recente', owner: 'Operação', sla: '72h', priority: 'Média' },
        { title: 'Validar pendências de contrato API', owner: 'Produto', sla: '5 dias', priority: 'Baixa' }
      ],
      nextActions: ['Liberar dashboard por perfil', 'Priorizar DMS/evidências', 'Planejar gate de piloto com backup e observabilidade'],
      privacyNote: 'Painel executivo não deve exibir CPF, documento bruto, portas internas ou topologia sensível.'
    },
    municipal: {
      persona,
      title: 'Operação municipal',
      subtitle: 'Fila diária do programa público: cadastros, elegibilidade humana, encaminhamentos e ativações.',
      scopeLabel: `Organização ${org} • Prefeitura/gestão municipal`,
      dataSource: 'reference',
      generatedAt: new Date().toISOString(),
      kpis: [
        { label: 'Solicitações abertas', value: '126', detail: '38 aguardam primeira análise', tone: 'blue' },
        { label: 'Elegíveis para encaminhar', value: '88', detail: 'Decisão humana registrada', tone: 'green' },
        { label: 'Instalações em andamento', value: '43', detail: 'Resumo sem dados internos do provedor', tone: 'amber' },
        { label: 'Serviços ativos', value: '37', detail: 'Ativação registrada', tone: 'violet' }
      ],
      stages: sharedStages,
      queues: [
        { title: 'Revisar cadastros com pendência documental', owner: 'Operador municipal', sla: '24h', priority: 'Alta' },
        { title: 'Encaminhar elegíveis sem provedor', owner: 'Gestor municipal', sla: '48h', priority: 'Alta' },
        { title: 'Acompanhar instalações sem atualização', owner: 'Operação municipal', sla: '72h', priority: 'Média' }
      ],
      nextActions: ['Analisar elegibilidade com motivo', 'Encaminhar apenas para provedor ativo', 'Cobrar atualização sem expor topologia'],
      privacyNote: 'Município vê resumo operacional minimizado; dados técnicos internos do provedor permanecem ocultos.'
    },
    provider: {
      persona,
      title: 'Operação do provedor',
      subtitle: 'Fila técnica FTTH: aceite, viabilidade, instalação, ativação e serviço ativo.',
      scopeLabel: `Organização ${org} • Provedor participante`,
      dataSource: 'reference',
      generatedAt: new Date().toISOString(),
      kpis: [
        { label: 'Encaminhamentos pendentes', value: '18', detail: 'Aguardam aceite ou recusa justificada', tone: 'amber' },
        { label: 'Viabilidades favoráveis', value: '61', detail: 'Cobertura confirmada tecnicamente', tone: 'green' },
        { label: 'Ordens de instalação', value: '43', detail: 'Agendadas, em campo ou concluídas', tone: 'blue' },
        { label: 'Serviços ativos', value: '37', detail: 'Ciclo inicial ativo', tone: 'violet' }
      ],
      stages: sharedStages.slice(2),
      queues: [
        { title: 'Aceitar/recusar encaminhamentos pendentes', owner: 'Gestor do provedor', sla: '12h', priority: 'Alta' },
        { title: 'Registrar viabilidade FTTH', owner: 'Equipe técnica', sla: '24h', priority: 'Alta' },
        { title: 'Atualizar instalações paradas', owner: 'Campo', sla: '48h', priority: 'Média' }
      ],
      nextActions: ['Confirmar cobertura sem inferir por CEP', 'Registrar motivo técnico quando não viável', 'Ativar serviço somente após instalação concluída'],
      privacyNote: 'Provedor vê sua própria fila e dados técnicos necessários; nunca enxerga fila de outro provedor.'
    },
    auditor: {
      persona,
      title: 'Painel de auditoria',
      subtitle: 'Visão de conformidade: decisões humanas, trilha de eventos e separação entre arquitetura e produção.',
      scopeLabel: `Organização ${org} • Auditoria`,
      dataSource: 'reference',
      generatedAt: new Date().toISOString(),
      kpis: [
        { label: 'Decisões auditáveis', value: '88', detail: 'Elegibilidade com motivo obrigatório', tone: 'green' },
        { label: 'Eventos operacionais', value: '349', detail: 'Trilha append-only no backend', tone: 'blue' },
        { label: 'Exceções a revisar', value: '7', detail: 'Sem bloqueio automático por IA', tone: 'amber' },
        { label: 'Gates pendentes', value: '5', detail: 'Antes de piloto público', tone: 'slate' }
      ],
      stages: sharedStages,
      queues: [
        { title: 'Verificar decisões sem evidência suficiente', owner: 'Auditoria', sla: '72h', priority: 'Alta' },
        { title: 'Revisar eventos de transição operacional', owner: 'Auditoria', sla: '5 dias', priority: 'Média' },
        { title: 'Conferir separação entre demo e produção', owner: 'Compliance', sla: '5 dias', priority: 'Média' }
      ],
      nextActions: ['Validar motivos de elegibilidade', 'Conferir escopo tenant/organização', 'Exigir DMS mínimo no próximo gate'],
      privacyNote: 'Auditoria acessa rastreabilidade e conformidade, sem ampliar acesso a dado sensível desnecessário.'
    },
    support: {
      persona,
      title: 'Suporte operacional',
      subtitle: 'Acompanhamento seguro de contexto, saúde operacional e orientação sem acesso sensível ampliado.',
      scopeLabel: `Organização ${org} • Suporte`,
      dataSource: 'reference',
      generatedAt: new Date().toISOString(),
      kpis: [
        { label: 'Chamados abertos', value: '14', detail: 'Triagem sem dado pessoal bruto', tone: 'amber' },
        { label: 'Ambientes acompanhados', value: '3', detail: 'Homologação e preparação', tone: 'blue' },
        { label: 'Incidentes críticos', value: '0', detail: 'Sem bloqueio operacional ativo', tone: 'green' },
        { label: 'Pendências técnicas', value: '5', detail: 'Antes de piloto', tone: 'slate' }
      ],
      stages: sharedStages.slice(0, 4),
      queues: [
        { title: 'Orientar gestor sobre filas paradas', owner: 'Suporte', sla: '24h', priority: 'Média' },
        { title: 'Escalar erro recorrente de login', owner: 'Suporte', sla: '12h', priority: 'Alta' },
        { title: 'Registrar dúvida de operação municipal', owner: 'Suporte', sla: '48h', priority: 'Baixa' }
      ],
      nextActions: ['Ajudar sem decidir elegibilidade', 'Escalar falhas técnicas', 'Não acessar documento bruto'],
      privacyNote: 'Suporte atua com mínimo privilégio e não decide benefício, suspensão ou autorização administrativa.'
    }
  };

  return dashboards[persona];
}

export const buildOperationalDashboard = buildReferenceOperationalDashboard;
