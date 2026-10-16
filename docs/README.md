# Documentação do projeto · Gestão de Rotinas Operacionais (Mondelez)

**Documento completo em PDF:** [`Documentacao-do-Projeto-Mondelez.pdf`](Documentacao-do-Projeto-Mondelez.pdf) (capa, sumário, visão geral e todos os capítulos abaixo). Gerado a partir destes markdowns com `cd docs/pdf && npm install && npm run build`.

| Doc | Conteúdo |
|---|---|
| [00 · Sobre este documento](00-como-usar-este-guia.md) | Propósito, o projeto em dez linhas, ordem de leitura, princípios, onde está tudo, glossário mínimo |
| [01 · Brief consolidado](01-brief-consolidado.md) | Síntese de todas as fontes (briefing Porto Digital, documento V2 Mondelez, proposta Pitang), catálogo dos 15 módulos, dados dos mockups, divergências |
| [02 · Solução e stack](02-solucao-e-stack.md) | Tese da solução, princípios, stack do protótipo web na Vercel, arquitetura, modelo de dados, regras de cálculo, motor de alertas, decisões e riscos |
| [03 · Personas](03-personas.md) | Operador, Supervisora, Gerente de Seção, Especialista, Assistente, secundários e stakeholders |
| [04 · Jobs to be Done](04-jobs-to-be-done.md) | Jobs principais, mapa do turno, jobs por persona com prioridade, forças de progresso, resultados desejados |
| [05 · Requisitos](05-requisitos.md) | Funcionais transversais e por módulo, regras de negócio, matriz de permissões, não funcionais, restrições, glossário |
| [06 · MoSCoW](06-moscow.md) | Priorização protótipo × piloto, definição de pronto, ordem de construção |
| [07 · Processo de trabalho](07-como-trabalhamos.md) | Frentes, ritmo, git e PRs, definição de pronto, convenções, comunicação, ferramentas |
| [08 · Plano de implementação](08-plano-de-implementacao.md) | Ambiente, incrementos, frentes por módulo, backlog inicial, critérios de aceite, referências técnicas |
| [09 · Framework de UX (UI Audit)](09-framework-ux-ui-audit.md) | Deep dive no guia UI Audit: apostas do projeto, leis de psicologia por tela, padrões por template, scaffold de regras, ritual de auditoria |

Fontes originais em `../Documentos/`. Foto de referência do estado atual em `assets/`. Pipeline do PDF em `pdf/` (Node + Edge/Chrome local; sem dependências globais).
