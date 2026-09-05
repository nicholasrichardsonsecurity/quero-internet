# Política de licenças de dependências

O projeto é proprietário. O arquivo raiz `LICENSE` é a fonte jurídica principal do código próprio.

O Security Gate gera um inventário das dependências de produção e bloqueia automaticamente licenças copyleft não aprovadas:

- AGPL;
- GPL;
- SSPL;
- Business Source License (BSL);
- Commons Clause.

A política não substitui a análise jurídica de um novo fornecedor ou biblioteca. Dependências com licença diferente devem ser avaliadas antes do merge e, quando aprovadas, registradas como exceção documentada.

O inventário da execução do CI é publicado como artefato `production-license-inventory`.

## Limitações

A auditoria cobre as dependências instaladas na execução do CI. Um `pnpm-lock.yaml` versionado continua sendo necessário para garantir reprodutibilidade completa das versões e do grafo transitivo.
