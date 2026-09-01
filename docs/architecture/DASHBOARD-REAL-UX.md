# Dashboard Real — UX, Fallback e Segurança

## Decisão

O dashboard web deve priorizar dados reais do backend, mas nunca deve quebrar a operação visual por falha temporária da agregação. Quando o endpoint real falhar, a interface exibe um fallback de referência explicitamente rotulado, sem fingir que são dados oficiais.

## Fluxo de carregamento

1. O navegador consulta `/api/auth/me`.
2. A sessão é validada pela BFF usando cookie HttpOnly.
3. A tela consulta `/api/dashboard/operational`.
4. A BFF chama a API interna `GET /dashboard/operational` com Bearer token server-side.
5. O backend aplica RBAC, tenant isolation e minimização por perfil.
6. A interface exibe o payload recebido com selo `DADOS DO BANCO`.

## Fallback controlado

O fallback só existe para manter a tela navegável em homologação e desenvolvimento. Ele deve ser exibido com:

- selo `FALLBACK CONTROLADO`;
- alerta de indisponibilidade do dashboard real;
- mensagem do erro sem vazar detalhe sensível;
- botão para tentar carregar novamente.

## Regras permanentes

- A fonte de verdade dos números operacionais é o backend.
- A interface não calcula escopo autorizado.
- A interface não amplia permissão.
- A interface não acessa token diretamente fora do cookie HttpOnly/BFF.
- A interface não exibe documento bruto, hash de documento ou dado técnico interno indevido.
- O estado visual deve diferenciar dados reais, carregamento e fallback.

## Riscos evitados

- Usuário acreditar que dados de referência são dados oficiais.
- Exposição de token no client.
- Dashboard quebrar por indisponibilidade temporária do endpoint.
- Barra de progresso distorcida por denominador fixo.
- Suporte ou auditoria interpretarem o fallback como evidência operacional.

## Próximas evoluções

- Remover fallback de referência no gate de produção.
- Adicionar testes de componente para estados `loading`, `ready` e `fallback`.
- Incluir telemetria de falhas do dashboard.
- Adicionar filtros por programa/período quando os contratos de paginação e filtro forem padronizados.
