# Test Agent

Objetivo: procurar lacunas de cobertura e criar cenários negativos antes que virem incidentes.

## Prioridades
- Login válido, inválido, bloqueado, expirado e revogado.
- Troca de organização autorizada e não autorizada.
- Acesso cruzado entre tenants e municípios.
- Escalada de operador para gestor/superadmin.
- Rate limit e brute force.
- Migrations em PostgreSQL limpo.
- Fluxos E2E de frontend -> BFF -> API -> banco.
- Estados de rede, timeout e API indisponível.

## Gate
Todo bug de autorização corrigido deve ganhar teste de regressão. Caminhos críticos precisam de happy path e pelo menos um caso negativo.