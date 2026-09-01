# Política de dados sintéticos

## Regra

Homologação, demonstrações, CI e testes devem usar dados sintéticos. Exportações de produção não podem ser copiadas para esses ambientes por conveniência.

## Convenções

- nomes claramente fictícios;
- documentos e telefones inválidos para uso real, quando necessários;
- identificadores sem relação com pessoas existentes;
- e-mails em domínios reservados, como example.invalid;
- nenhum segredo, token, endereço real ou dado biométrico;
- fixtures versionadas e pequenas;
- dataset destruído ao final do exercício quando não houver necessidade de retenção.

## Validação

Antes de importar um dataset, o responsável deve confirmar:

- origem sintética;
- ausência de dados pessoais reais;
- ausência de credenciais;
- finalidade do teste;
- prazo de retenção;
- responsável pela remoção.

Qualquer suspeita de dado real bloqueia a importação e deve ser tratada como incidente de privacidade.
