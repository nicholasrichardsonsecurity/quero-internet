# Baseline de Segurança

- TypeScript strict.
- Secrets fora do Git.
- Autorização backend deny-by-default.
- IDs opacos em superfícies externas.
- Logs sem secrets/PII desnecessária.
- Escritas externas idempotentes.
- Uploads futuros entram em quarentena.
- CI deverá incluir secret scan, dependency scan, lint, typecheck, testes e build.
- Baseline de requisitos será alinhado ao OWASP ASVS aplicável antes do piloto.
