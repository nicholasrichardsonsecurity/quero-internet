# Quero Internet GovTech — Brand Guidelines v1.1

> Documento canônico resumido de identidade visual do produto. O detalhamento estratégico completo fica em `docs/brand/BRAND-BOOK.md`.

---

## Marca oficial

**Nome:** Quero Internet GovTech  
**Nome curto:** Quero Internet  
**Tagline oficial:** Conectando pessoas, transformando cidades.

O símbolo oficial combina uma letra **Q** arredondada com três elementos centrais: **conectividade**, **território/cidade** e **inclusão do cidadão**. A assinatura institucional é **Quero Internet GOVTECH**.

O símbolo master escalável está em `assets/brand/quero-internet-symbol-official.svg`.

---

## Personalidade visual

A marca deve parecer pública sem ser burocrática, tecnológica sem ser experimental, moderna sem perder credibilidade e acessível sem infantilização.

Referência visual: GovTech + SaaS corporativo + telecom + gestão pública baseada em dados.

A marca deve transmitir:

- confiança pública;
- operação real;
- segurança e rastreabilidade;
- inclusão digital;
- parceria com provedores;
- clareza para o cidadão.

---

## Paleta oficial

| Token | Hex | Uso principal |
|---|---:|---|
| `qi-navy-950` | `#081D3A` | fundos institucionais, sidebar, cabeçalhos escuros |
| `qi-navy-900` | `#0B1730` | superfícies escuras auxiliares |
| `qi-blue-700` | `#0D47C7` | institucional, marca |
| `qi-blue-600` | `#1D4ED8` | ações primárias e marca |
| `qi-blue-500` | `#2563EB` | CTA e elementos interativos |
| `qi-blue-400` | `#60A5FA` | gráficos, destaques e estados informativos |
| `qi-green-600` | `#16A34A` | sucesso e conectividade confirmada |
| `qi-green-500` | `#22C55E` | inclusão e estados positivos |
| `qi-amber-500` | `#F59E0B` | atenção e pendência |
| `qi-red-600` | `#DC2626` | erro, bloqueio e criticidade |
| `qi-slate-900` | `#0F172A` | texto principal |
| `qi-slate-600` | `#475569` | texto secundário |
| `qi-slate-200` | `#E2E8F0` | bordas |
| `qi-slate-50` | `#F8FAFC` | background da aplicação |
| `qi-white` | `#FFFFFF` | superfícies e contraste |

Status nunca deve depender apenas de cor: usar **cor + ícone + texto**.

---

## Gradientes oficiais

```css
/* Institucional */
linear-gradient(135deg, #071B35, #0B2C5E 60%, #1D4ED8)

/* Ação / conectividade */
linear-gradient(90deg, #2563EB, #22C55E)

/* Destaque controlado */
linear-gradient(135deg, #0D47C7, #6D5DFC)
```

---

## Tipografia

Fonte operacional oficial: **Inter**.

- Display/H1: Inter 700–800
- H2/H3: Inter 600–700
- Labels e botões: Inter 500–700
- Corpo: Inter 400–500
- KPIs: Inter 750–800

**Poppins** pode ser usada exclusivamente em peças institucionais de marketing quando houver justificativa visual; a aplicação usa Inter.

---

## Ícones

Biblioteca oficial: **Lucide Icons**.

- Estilo: outline
- Stroke padrão: 2
- Menu: 20–22 px
- Botões: 16–18 px
- Cards: 20–24 px
- Destaques: 24–32 px

Não misturar famílias de ícones na mesma interface.

---

## Grid e espaçamento

Sistema base: **8 px**.

- micro: 4 px
- xs: 8 px
- sm: 12 px
- md: 16 px
- lg: 24 px
- xl: 32 px
- 2xl: 48 px
- 3xl: 64 px

Raios recomendados:

- Cards: 12–16 px
- Painéis hero: 22 px
- Botões: 8–10 px
- Inputs: 8 px

---

## Aplicação no produto

O painel administrativo usa sidebar navy e superfície operacional clara. O contexto atual deve ficar sempre evidente: Plataforma, Município, Provedor, Auditoria ou Suporte.

Estados oficiais:

- Verde: ativo, conectado, concluído.
- Azul: informação ou processamento normal.
- Âmbar: pendência, aguardando ação.
- Vermelho: erro, bloqueio, reprovação, crítico.
- Cinza: inativo, arquivado ou indisponível.

A palavra **aprovado/elegível** deve ser usada com cuidado, sempre vinculada a decisão humana e regra do programa.

---

## Acessibilidade

Meta de projeto: **WCAG 2.2 AA**, sem declaração pública de conformidade antes de auditoria.

Obrigatório:

- foco visível;
- navegação por teclado;
- contraste adequado;
- labels semânticos;
- leitores de tela;
- nenhuma informação transmitida exclusivamente por cor.

---

## Uso da marca

Não deformar, rotacionar, alterar proporções, substituir cores oficiais arbitrariamente, aplicar efeitos não aprovados, adicionar símbolos partidários ou usar a marca de forma a sugerir órgão público específico sem instrumento e autorização adequados.

---

## Governança

Mudanças de logo, paleta, tipografia, tom institucional ou semântica de estados exigem revisão do Brand System e incremento de versão.

O código deve derivar tokens de design desta documentação e de `docs/brand/BRAND-TOKENS.json`, evitando valores soltos e divergentes no frontend.

---

## Documentos relacionados

- `docs/brand/BRAND-BOOK.md`
- `docs/brand/BRAND-TOKENS.json`
- `docs/brand/MESSAGING.md`
- `docs/brand/VISUAL-SYSTEM.md`
