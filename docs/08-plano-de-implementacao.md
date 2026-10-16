# 08 · Plano de implementação

## Ambiente de desenvolvimento

- Node 24, Git, VS Code com as extensões do capítulo anterior, acesso ao GitLab Pitang e à Vercel.
- Clonar o repositório, rodar `npm install` e `npm run dev` em `app/`, abrir no navegador em modo responsivo com viewport 1180 × 820 e 820 × 1180.
- Instalar o app no tablet do laboratório como atalho do navegador e abrir o preview da Vercel.
- Scaffold inicial (Next.js 16 já vem com TypeScript, Tailwind v4, ESLint, App Router e Turbopack):

```bash
npx create-next-app@latest app --src-dir --import-alias "@/*" --yes
cd app && npx shadcn@latest init
npm i zustand idb-keyval zod react-hook-form @hookform/resolvers date-fns recharts @tanstack/react-table lucide-react class-variance-authority
npm i -D vitest @testing-library/react @playwright/test
```

## Incrementos e entregáveis

| Incremento | Escopo | Entregável verificável |
|---|---|---|
| **I1** Fundação | Scaffold, tokens em `@theme`, shell de tablet (header de contexto, barra de sync, navegação por toque), seed da Bis 2, login por matrícula + PIN, seleção de contexto, Minha Rotina com tarefas estáticas | Link na Vercel com login → contexto → Minha Rotina navegável em landscape e portrait |
| **I2** Registro e alerta | Motor de formulários (C/NC/NA, numérico, texto, foto; NC exige justificativa; autosave), PPLI & Centerlining, motor de alertas (A-ATRASO, A-NC), painel de alertas da supervisão, painel de demo (persona, relógio, rede, reset) | NC marcada no PPLI aparece como alerta para a supervisão; avançar o relógio gera alerta de atraso |
| **I3** Produção | Hora x Hora (toneladas, ton/h, GE, meta, farol, gráfico), MTBF por toque com timeline e Pareto, KPIs acumulados do turno, A-GE, A-META, A-REPET | Apontar caixas atualiza farol e gráficos; falhas repetidas geram alerta |
| **I4** Consolidação | Troca de turno guiada e pré-preenchida com aceite, Relatório do turno BIS 1–4, persona Gerência, rastreabilidade visível em todo registro, indicador de sync | Ciclo completo demonstrável sem intervenção técnica |
| **I5** Catálogo | Plano de produção com importação de Excel, Book de defeitos, IT/LPP, Escala, Agenda e recados, Rastreabilidade de PA com foto, Pré-partida HSE e nível de risco, Limpeza semanal, Manutenção autônoma, Sobrepeso/refugo/reprocesso via motor genérico | Todos os 16 módulos navegáveis com estados vazio e erro |
| **I6** Polimento | Revisão de luva e contraste, estados de carregamento e offline, histórico com filtros, testes Vitest do domínio e Playwright do fluxo demo, performance em rede fraca | Pronto para teste com usuários; definição de pronto do protótipo atendida |

## Frentes de trabalho por módulo

| Módulos | Frente | Observação |
|---|---|---|
| Minha Rotina, motor de formulários, motor de alertas, KPIs, PPLI, Hora x Hora, MTBF, Troca de turno, Relatório do turno, painel de demo | Produto e arquitetura | Núcleo (Must); define contratos que as demais frentes consomem |
| Escala, Book de defeitos, IT/LPP, Agenda, Limpeza semanal, Manutenção autônoma, Rastreabilidade de PA | Implementação de módulos | Should; dependem do motor de formulários pronto no I2 |
| Sobrepeso/refugo, Ferramentas de segurança, Plano de produção, Histórico, dashboard gerencial | Implementação de módulos | Should/Could; sequência definida ao fim do I4 |
| Design system (`components/ui`, tokens) | Produto e arquitetura define; todas as frentes estendem | Toda extensão via PR com exemplo na página interna `/dev/componentes` |

## Backlog inicial detalhado (I1 e I2)

1. Tokens de design em `@theme`: cores da marca, escala de toque (`--spacing-touch: 56px`), tipografia (corpo 16 px, rótulos 18 px, títulos 24 px), raios e sombras.
2. Shell de tablet: header com contexto (Chocolate ▸ Bis 2 ▸ Embalagem), usuário atual, indicador de sync, botão de troca de usuário; navegação inferior ou lateral com alvos de 56 px.
3. Seed da Bis 2: planta, linha, posto Embalagem, Loeschpack 2/4/5, operadores Alberto Forte e Graziela Felix, supervisora, gerente, especialista, assistente; plano de produção da semana; templates de rotina por posto e perfil.
4. Login por matrícula + PIN com troca rápida de usuário; seleção de contexto lembrada por dispositivo.
5. `RoutineEngine`: gera `TarefaInstancia` a partir de `RotinaTemplate` × posto × perfil × turno × relógio; estados e ordenação por prazo e criticidade.
6. Componente `TaskCard` com estados *a fazer, em andamento, feita, atrasada, com NC*; lista Minha Rotina com a próxima tarefa em destaque.
7. `FormEngine` e componentes de item (C/NC/NA, numérico com faixa, texto, foto); autosave por item; resumo de conformes e NC ao concluir.
8. PPLI & Centerlining com plano por equipamento, parâmetros de centerline com faixa e valor medido.
9. `AlertEngine` com regras A-ATRASO e A-NC, criticidade, responsável, ciclo de vida e log de envio simulado.
10. Painel de alertas da supervisão: lista por criticidade e idade, detalhe com origem, ações assumir, registrar ação, resolver.
11. Painel de demo: trocar persona, avançar relógio (+15 min, +1 h, fim do turno), simular queda de rede, resetar dados.
12. Testes Vitest de `RoutineEngine`, `AlertEngine` e formatadores pt-BR.

## Critérios de aceite por incremento

- Cada incremento é aceito em demo no link da Vercel, em tablet real com luva, nas duas orientações.
- Nenhum item Must do MoSCoW fica para o incremento seguinte sem decisão registrada em `docs/06-moscow.md`.
- Lint, tipos e testes verdes no CI; nenhum alerta de acessibilidade crítico no Lighthouse.

## Referências técnicas

| Tema | Fonte oficial | Foco |
|---|---|---|
| Next.js 16 App Router | nextjs.org/docs | Layouts, páginas, Server vs Client Components, `proxy.ts` (substitui `middleware`), `cacheComponents`, `next/image`, `next/font` |
| React 19 | react.dev | Componentes, hooks, estado derivado, `useActionState` |
| TypeScript | typescriptlang.org/docs | Tipos de domínio, uniões discriminadas, `satisfies`, nada de `any` |
| Tailwind CSS v4 | tailwindcss.com/docs | `@theme`, tokens, variantes, responsividade, `@container` |
| shadcn/ui | ui.shadcn.com | `npx shadcn@latest init`, instalar e compor componentes, estender com `cva` |
| Zustand | zustand.docs.pmnd.rs | Store por fatia, `persist` com `createJSONStorage` sobre IndexedDB, seletores |
| zod + react-hook-form | zod.dev · react-hook-form.com | Esquemas de formulário, validação condicional (NC exige justificativa) |
| Recharts | recharts.org | Linha, barra, referência de meta |
| Vitest · Playwright | vitest.dev · playwright.dev | Teste de função pura; teste de fluxo no navegador |
| Acessibilidade | web.dev/learn/accessibility · WCAG 2.1 AA | Alvo de toque, contraste, foco, rótulos |
| Documentação atualizada | Documentação oficial de cada biblioteca | Consultar a documentação atual antes de usar uma API de biblioteca |

## Checklist de alinhamento do time

Toda pessoa do projeto deve conseguir responder sem consultar:

1. Por que a home do protótipo é "Minha Rotina" e não a grade de módulos?
2. O que acontece, passo a passo, quando um operador marca um item como não conforme?
3. Quais são as três personas que o protótipo precisa demonstrar e o que cada uma vê primeiro?
4. Qual a diferença entre o protótipo (esta fase) e o piloto (proposta Pitang)?
5. Por que o domínio não pode importar React nem Next?
6. O que é um alvo de toque de 56 px e por que importa aqui?
7. Onde fica registrada uma decisão de arquitetura e quem a toma?
8. O que torna um PR "pronto" neste projeto?
