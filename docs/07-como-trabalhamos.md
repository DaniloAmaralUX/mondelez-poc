# 07 · Processo de trabalho

## Responsabilidades por frente

| Frente | Responsável por | Decide sobre |
|---|---|---|
| **Produto e arquitetura** | Tese do produto, design system, motores de domínio (rotina, formulários, alertas, KPIs), relação com a Mondelez e a Pitang | Requisitos, prioridades, decisões técnicas, aceite de PRs |
| **Implementação de módulos** | Telas e componentes a partir do design system, módulos de consulta e checklists genéricos, seed de dados, verificação no tablet | Implementação dentro do combinado; propõe melhorias via PR ou nota em `docs/` |
| **Qualidade** | Testes de domínio e de fluxo, revisão de acessibilidade e toque, estados de erro e vazio | Bloqueio de PR que não atende à definição de pronto |

As frentes podem ser ocupadas por uma ou mais pessoas; a divisão inicial de módulos está no plano de implementação.

## Ritmo

- **Incrementos I1 a I6** (capítulo MoSCoW) são a unidade de planejamento. Cada incremento termina com algo demonstrável no link da Vercel.
- **Sincronização diária de 10 minutos**: o que foi feito, o que vem a seguir, onde travou.
- **Revisão de PR em até um dia útil.** PR parado é desperdício.
- **Demo semanal**: 15 minutos navegando no protótipo publicado, do login ao relatório do turno, anotando o que incomodou.

## Git e PRs

- `main` é protegida e sempre publicável. Ninguém faz commit direto.
- Uma branch por tarefa: `feat/i2-ppli-checklist`, `fix/hora-x-hora-farol`, `docs/plano-implementacao`.
- Commits no padrão `tipo: descrição curta no imperativo` (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`). Mensagens em português.
- PR pequeno: idealmente até 300 linhas alteradas. Acima disso, divide.
- Descrição do PR com cinco blocos: **o quê**, **por quê** (link para o requisito, ex.: RM-15), **como testar**, **evidência** (print ou vídeo no tablet, landscape e portrait quando houver UI) e **checklist de pronto**.
- Preview da Vercel no PR é o lugar da revisão visual. Comentários de código no GitLab.

## Definição de pronto por PR

1. Atende o requisito citado, sem escopo extra.
2. Textos de interface em português do Brasil, com os termos do cliente.
3. Alvos de toque ≥ 56 px, contraste AA, sem dependência de hover; funciona em landscape e portrait de tablet e em desktop.
4. Estados cobertos: vazio, carregando, erro, sucesso, offline (quando aplicável).
5. Lógica de negócio em `domain/` com teste unitário passando; nada de regra dentro de componente.
6. `npm run lint`, `npm run typecheck` e `npm run test` verdes; build de preview na Vercel verde.
7. Sem `any`, sem `console.log` esquecido, sem dado sensível no seed.
8. Se mudou comportamento ou decisão, `docs/` atualizado no mesmo PR.

## Convenções de código

| Tema | Convenção |
|---|---|
| Idioma | Código, nomes de arquivos, tipos e commits em inglês; textos de UI, docs e comentários de negócio em português |
| Pastas | `app/` rotas · `components/ui` shadcn · `components/rotina` componentes de domínio · `domain/` lógica pura · `data/` repositório, seed, fila de sync · `lib/` utilitários |
| Componentes | Função nomeada por arquivo, props tipadas, sem lógica de negócio; recebem dados prontos e emitem eventos |
| Domínio | Funções puras, relógio injetado (`Clock`), sem imports de React ou Next; cada regra tem teste |
| Estado | Zustand por fatia (`useRoutineStore`, `useAlertStore`); persistência com `persist` + `createJSONStorage` sobre IndexedDB (`idb-keyval`), atrás de `Repository` |
| Estilo | Tailwind v4 com tokens do `@theme`; nada de cor ou tamanho "mágico" inline; variantes com `cva` |
| Acessibilidade | Elementos nativos antes de ARIA; foco visível; rótulos em todo campo; ícones sempre com texto ou `aria-label` |
| Datas e números | `date-fns` com `ptBR`; `Intl.NumberFormat('pt-BR')`; nunca formatar à mão |
| Testes | Vitest para `domain/` e `lib/`; Playwright para o fluxo demo completo; nome do teste descreve a regra em português |

## Como decidir e registrar

- Dúvida de **implementação** (como fazer): resolve no PR, com comentário se for não óbvio.
- Dúvida de **requisito ou prioridade** (o que fazer): pergunta antes de codar; a resposta vai para `docs/05-requisitos.md` ou `docs/06-moscow.md`.
- Mudança de **arquitetura ou stack**: nota curta no formato da tabela "Decisões registradas" do capítulo 02 (decisão, alternativa descartada, motivo), combinada antes.
- Perguntas para a **Mondelez** entram na lista "Pontos a validar" e não bloqueiam: assume-se a hipótese mais simples, marca-se na UI quando fizer diferença (ex.: "GE, definição a validar") e segue-se.

## Comunicação

- Perguntas em bloco, com contexto: o que foi tentado, o que se esperava, o que aconteceu, print.
- "Não sei" e "não entendi" são respostas válidas e esperadas.
- Travou por 30 minutos: pede ajuda. Não é falha, é processo.
- No fim da semana, cada pessoa escreve três linhas: o que aprendeu, o que atrapalhou, o que mudaria.

## Ferramentas

| Ferramenta | Uso |
|---|---|
| Node 24 + npm | Runtime e pacotes |
| VS Code com ESLint, Tailwind CSS IntelliSense, Prettier | Editor |
| Git + GitLab Pitang | Versionamento, PRs, revisão |
| Vercel (CLI e painel) | Preview por PR, produção, logs |
| Tablet do laboratório (10.9", com luva) | Teste real de toque e layout |
| Documentação oficial das bibliotecas | Apoio de desenvolvimento com documentação atualizada das bibliotecas |

## Gerar este documento em PDF

O PDF é montado a partir dos markdowns de `docs/` pelo script em `docs/pdf/`:

```bash
cd docs/pdf
npm install
npm run build
```

O resultado fica em `docs/Documentacao-do-Projeto-Mondelez.pdf`. Atualizou um markdown, gera de novo e versiona o PDF junto.
