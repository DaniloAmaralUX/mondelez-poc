# Sobre este documento

## Propósito

Este documento reúne, em um só lugar, tudo o que foi lido, decidido e planejado para o protótipo funcional de **Gestão de Rotinas Operacionais** da Mondelez: contexto, pessoas, jobs, solução, requisitos, prioridades e forma de trabalho. Serve como referência única do time e como base para qualquer pessoa que entre no projeto.

Ele é um **retrato datado** dos arquivos em `docs/`. Os markdowns são a fonte viva; este PDF é regenerado a partir deles com um comando (ver capítulo "Processo de trabalho"). Se o PDF e o markdown divergirem, vale o markdown.

## O projeto em dez linhas

1. A Mondelez gere a rotina de manufatura (checklists, apontamentos, ocorrências) em papel, cadernos e planilhas dispersas.
2. A liderança descobre desvios tarde e consolida o turno à mão; a operação não sabe o que priorizar.
3. A Mondelez pediu, via Porto Digital, um software para tablets que centralize, registre, direcione e alerte.
4. A Pitang propôs uma plataforma React + Ionic + NestJS, on-premise, com piloto na linha **Bis 2** (fábrica de Chocolate), posto Embalagem.
5. Antes do piloto, será construído um **protótipo funcional web**, publicado na **Vercel**, para validar o produto com usuários reais.
6. São 15 módulos de rotina (PPLI, Hora x Hora, MTBF, Troca de turno, Alertas, Relatório do turno, etc.) mais Agenda da fábrica.
7. A tese de design: a home é "**Minha Rotina do turno**" (o que falta fazer agora), não um menu de módulos.
8. Toda não conformidade ou atraso vira **alerta automático** com criticidade e responsável; o supervisor trata e registra a ação.
9. Tudo é pensado para **tablet com luva**: alvos grandes, poucos toques, offline-first, rastreabilidade em cada registro.
10. Stack: Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui, Zustand + IndexedDB; sem backend nesta fase.

## Ordem de leitura

| Ordem | Capítulo | O que levar |
|---|---|---|
| 1 | Visão geral | O mapa do turno, as personas e o MoSCoW em uma olhada |
| 2 | 01 · Brief consolidado | O problema, o que o cliente pediu, o catálogo dos 15 módulos |
| 3 | 03 · Personas | Quem usa, de luva, no barulho, em tablet compartilhado |
| 4 | 04 · Jobs to be Done | O que cada pessoa precisa conseguir fazer, em ordem de prioridade |
| 5 | 02 · Solução e stack | Como o protótipo é montado e por que cada decisão foi tomada |
| 6 | 05 · Requisitos | O que cada módulo faz, regras de negócio, permissões, não funcionais |
| 7 | 06 · MoSCoW | O que entra agora, o que fica para depois, a ordem de construção |
| 8 | 07 · Processo de trabalho | Papéis, git, PRs, definição de pronto, convenções |
| 9 | 08 · Plano de implementação | Incrementos, frentes de trabalho, ambiente, referências técnicas |
| 10 | 09 · Framework de UX (UI Audit) | Apostas do projeto, leis de psicologia por tela, padrões por template, regras pré-decididas, ritual de auditoria |

## Princípios do projeto

1. **Nenhum requisito é inventado.** O que não está nos documentos nem foi combinado é pergunta, não código.
2. **Perguntar cedo é barato; descobrir tarde é caro.** Trinta minutos travado em um problema é o limite antes de pedir ajuda.
3. **PR pequeno, com evidência no tablet.** Uma tela ou um componente por PR; print ou vídeo sempre.
4. **Toque de luva.** Nenhum alvo abaixo de 56 px, nenhuma interação que dependa de hover ou de precisão.
5. **Domínio puro.** Regras de negócio (alertas, GE, MTBF) vivem em `domain/`, sem React e sem Next, com teste.
6. **Decisão vira texto.** Mudou arquitetura, requisito ou prioridade: nota em `docs/` antes do código.
7. **Linguagem do cliente.** PPLI, centerlining, LPP, GE, MTBF, etiqueta aberta: os nomes são os da Mondelez.

## Onde está tudo

| O quê | Onde |
|---|---|
| Repositório | `gitlab.pitang.com/pitang-labs/mondelez` (pasta local `mondelez-main/`) |
| Documentos originais da Mondelez e da Pitang | `Documentos/` |
| Documentação do projeto (esta) | `docs/` |
| Foto do estado atual (papel na máquina) | `docs/assets/foto-papel-chao-fabrica.png` |
| Aplicação (a criar no incremento I1) | `app/` na raiz do repositório |
| Ambiente publicado | Vercel, com um link de preview por PR e produção em `main` |

## Glossário mínimo

| Termo | Significado |
|---|---|
| Rotina | Tarefa recorrente de um posto (por hora, turno, dia, semana ou mês) |
| PPLI | Plano de limpeza, lubrificação e inspeção de um equipamento |
| Centerlining | Manter os parâmetros da máquina nos valores-alvo definidos |
| NC | Não conformidade: item de checklist fora do padrão |
| GE | Eficiência global da linha (definição oficial a validar com a Mondelez) |
| MTBF | Tempo médio entre falhas |
| Troca de turno | Formulário de passagem entre turnos |
| Posto | Ponto de trabalho de uma linha (ex.: Embalagem da Bis 2) |
| Loeschpack | Modelo de máquina de embalagem; a Bis 2 tem as de número 2, 4 e 5 |

O glossário completo está no capítulo de requisitos.
