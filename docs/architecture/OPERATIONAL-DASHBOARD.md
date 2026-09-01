# Dashboard Operacional

## Propósito

O Dashboard Operacional é a camada de acompanhamento diário do Quero Internet GovTech. Ele apresenta a situação da jornada do benefício sem substituir decisões humanas, sem automatizar suspensão e sem revelar dado sensível desnecessário.

## Personas

| Persona | Foco | Limite obrigatório |
|---|---|---|
| Superadmin/Admin | Visão executiva multi-organização autorizada | Não expor CPF bruto, documentos ou topologia sensível. |
| Município | Solicitações, elegibilidade, encaminhamentos e ativações | Ver somente resumo minimizado do provedor. |
| Provedor | Aceite, viabilidade FTTH, instalação e serviço ativo próprio | Ver somente fila do próprio provedor e tenant autorizado. |
| Auditoria | Conformidade, eventos e motivos de decisão | Não ampliar acesso a dados pessoais desnecessários. |
| Suporte | Orientação e triagem | Não decidir benefício nem acessar documentos brutos. |

## Esteira operacional exibida

1. Solicitações submetidas.
2. Elegíveis.
3. Encaminhadas.
4. Viabilidade FTTH.
5. Instalação.
6. Serviço ativo.

Essa esteira reflete o estado implementado no domínio até a Missão 1.6 e deve ser alimentada futuramente por agregações de leitura, não por cálculos frágeis no frontend.

## Dados demonstrativos vs dados reais

Enquanto não houver endpoints agregadores, o dashboard usa dados operacionais de referência explicitamente rotulados. A conexão real deve ser feita em missão própria, preservando:

- RBAC;
- isolamento por tenant;
- minimização de dados;
- mensagens de erro no contrato HTTP v1;
- ausência de documento bruto;
- ausência de inferência automática de cobertura por CEP;
- ausência de decisão automática por IA.

## Contrato futuro de leitura

Endpoints recomendados para próxima fase:

```text
GET /dashboard/municipal/summary
GET /dashboard/provider/summary
GET /dashboard/audit/summary
GET /dashboard/admin/summary
```

Cada endpoint deve retornar apenas o necessário para sua persona. O backend deve ser a fonte da autorização e o frontend deve apenas adaptar a apresentação.

## Segurança e privacidade

- CPF/documento bruto nunca deve aparecer no dashboard.
- Topologia, portas disponíveis, referências internas e detalhes sensíveis de rede não devem aparecer para município.
- Provedor não enxerga fila de outro provedor.
- Suporte não recebe permissão operacional ampliada por conveniência.
- Auditoria consulta conformidade e trilha, mas não ganha acesso ilimitado a dados pessoais.
- Erros devem seguir o envelope HTTP padronizado na Missão 1.7.

## Estado atual

Implementado inicial na camada web:

- modelo tipado de dashboard;
- resolução de persona por papéis;
- tela responsiva;
- KPIs e filas por perfil;
- avisos de privacidade;
- rotulagem de dados de referência.

Pendente:

- endpoints agregadores reais;
- testes E2E com sessão por perfil;
- dashboard com dados reais de banco;
- auditoria de acessibilidade;
- exportações e relatórios oficiais.
