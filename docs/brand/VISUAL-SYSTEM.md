# Quero Internet GovTech — Sistema Visual

> Sistema visual oficial para produto, landing page, apresentações, propostas e materiais institucionais.

---

## 1. Direção visual

A identidade deve parecer:

- institucional;
- moderna;
- segura;
- operacional;
- acessível;
- confiável para gestão pública;
- conectada ao universo telecom.

A tela deve transmitir que o sistema é usado para gerir uma política pública real, não apenas vender internet.

---

## 2. Estrutura visual principal

### Produto web

- Sidebar navy;
- área operacional clara;
- cards brancos;
- KPIs com alto contraste;
- badges de origem de dados;
- ícones lineares;
- avisos de privacidade visíveis;
- textos objetivos e rastreáveis.

### Landing page

- Hero com fundo navy/azul;
- ilustração ou mockup de dashboard;
- CTA azul;
- cards por público: prefeitura, provedor, cidadão e auditoria;
- seção de segurança/LGPD;
- seção de jornada operacional;
- seção de próximos passos.

### Apresentações

- Capa com fundo navy e logo central;
- títulos curtos;
- diagramas de fluxo;
- ícones consistentes;
- blocos visuais por etapa;
- evitar slides com excesso de texto.

---

## 3. Layout base

### Grid

- Base de 8 px.
- Cards em múltiplos de 8.
- Espaçamento mínimo entre blocos: 16 px.
- Espaçamento de seção: 32 a 64 px.

### Cards

- Raio: 16 px.
- Borda: `#E2E8F0`.
- Sombra: suave, sem excesso.
- Fundo: branco.
- Título: curto e direto.
- Descrição: objetiva, sem jargão desnecessário.

### Painel escuro

Usar para hero, sidebar e blocos de autoridade institucional.

Gradiente aprovado:

```css
linear-gradient(135deg, #071B35, #0B2C5E 60%, #1D4ED8)
```

---

## 4. Estados visuais

| Estado | Cor | Regra |
|---|---|---|
| Informação | Azul | Fluxo normal, dados e orientação |
| Sucesso | Verde | Ativo, concluído, conectado |
| Atenção | Âmbar | Pendente, aguardando ação |
| Crítico | Vermelho | Erro, bloqueio, falha grave |
| Neutro | Slate | Inativo, arquivado, indisponível |

Nenhum estado pode depender apenas de cor. Sempre usar texto claro e, quando possível, ícone.

---

## 5. Aplicação em dashboard

### KPIs

Cada KPI deve responder uma pergunta operacional:

- Quantos beneficiários/solicitações existem?
- O que precisa de análise?
- O que está com o provedor?
- O que está instalado/ativo?
- Onde há risco ou gargalo?

### Esteira operacional

Representa a jornada:

1. Solicitação;
2. Elegibilidade;
3. Encaminhamento;
4. Viabilidade técnica;
5. Instalação;
6. Ativação;
7. Serviço ativo.

### Fila prioritária

Deve mostrar:

- ação necessária;
- responsável;
- prazo/SLA;
- prioridade;
- sem expor dado sensível desnecessário.

---

## 6. Ícones oficiais sugeridos

Usar Lucide Icons.

| Uso | Ícone |
|---|---|
| Marca/conectividade | `Wifi` |
| Organizações públicas | `Building2` ou `Landmark` |
| Beneficiários | `Users` |
| Segurança | `ShieldCheck` |
| Auditoria | `FileSearch` ou `History` |
| Dashboard | `Gauge` ou `BarChart3` |
| Dados reais | `Database` |
| Alerta | `AlertTriangle` |
| Atualizar | `RefreshCcw` |
| Rede | `Network` |

---

## 7. Imagens e mockups

### Mockups recomendados

- dashboard com KPIs;
- mapa de cobertura por município;
- fluxo município → provedor → beneficiário;
- status de instalação;
- painel de auditoria;
- tela de acompanhamento do cidadão.

### Fotografia recomendada

- técnico de fibra em campo;
- família usando internet em casa;
- gestor público acompanhando painel;
- cidade/bairro conectado;
- escola, estudo, trabalho e serviços digitais.

### Cuidados

- não explorar vulnerabilidade social;
- não usar criança identificável sem autorização;
- não sugerir benefício garantido;
- não usar brasões oficiais sem autorização.

---

## 8. Materiais físicos

### Folder

Formato recomendado: A4 dobrado ou A5.

Conteúdo mínimo:

- promessa da marca;
- fluxo operacional;
- benefícios para prefeitura;
- benefícios para provedor;
- segurança/LGPD;
- CTA para demonstração.

### Cartaz institucional

Uso: eventos, reuniões com secretarias, demonstrações.

Mensagem curta:

> Conectividade pública com gestão, segurança e transparência.

### Crachá/evento

Usar logo, nome, função, QR Code para página institucional e aviso de contato oficial.

---

## 9. Design de produto: princípios

1. **Clareza antes de beleza.**
2. **Dado sensível minimizado por padrão.**
3. **Ação prioritária sempre visível.**
4. **Status com texto, não só cor.**
5. **Sem parecer planilha.**
6. **Sem parecer propaganda política.**
7. **Cada tela deve explicar o próximo passo.**

---

## 10. Checklist visual

Antes de aprovar uma tela ou material:

- o logo está legível?
- o contraste está adequado?
- a hierarquia está clara?
- existe excesso de informação?
- o usuário sabe o próximo passo?
- há algum dado pessoal exposto sem necessidade?
- a peça promete algo que depende de análise humana?
- a peça parece institucional sem parecer campanha política?
- os ícones estão consistentes?
- a fonte segue Inter no produto?
