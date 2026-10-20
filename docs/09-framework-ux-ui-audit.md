# 09 · Framework de decisão de UX (UI Audit) aplicado ao projeto

Deep dive no repositório `tommygeoco/ui-audit` (v1.0.2, MIT), o framework de auditoria baseado no livro *Making UX Decisions*, de Tommy Geoco (uxtools.co). Lido a partir de um clone local, fora deste repositório.

## 1. O que é

Não é uma biblioteca de componentes nem um linter. É um **conjunto de referências em markdown** (26 arquivos) para tomar e auditar decisões de interface de forma estruturada. Três camadas:

| Camada | Arquivos | Função |
|---|---|---|
| **Fundamentos** | `00-core-framework`, `01-anchors`, `02-information-scaffold` | Processo de decisão, apostas (macro bets), JTBD, 7 mentalidades, leis de psicologia, POUR, defaults de tipografia e espaçamento, heurísticas de Nielsen |
| **Checklists de execução** | `10` novas interfaces (6 passos), `11` fidelidade (estados, interações, escalabilidade de conteúdo, feedback), `12` estilo visual, `13` níveis de originalidade | O que verificar antes de considerar uma tela pronta |
| **Padrões** | `20` chunking, `21` progressive disclosure, `22` carga cognitiva, `23` hierarquia visual, `24` prova social, `25` feedback, `26` erros, `27` acessibilidade, `28` personalização, `29` onboarding, `30` informação, `31` navegação | Para cada padrão: quando usar, princípio psicológico, faça/não faça, tabela de seleção |

A saída canônica é um **relatório de auditoria em JSON** com macro bets, JTBD, seções obrigatórias (hierarquia visual, estilo visual, acessibilidade), seções contextuais (navegação, usabilidade, onboarding, prova social, formulários), 6 a 10 verificações por seção com status `pass/warn/fail/na`, e uma lista de **correções prioritárias** com referência ao arquivo do framework.

## 2. A ideia central

> Rapidez não é imprudência. Projetar rápido de forma imprudente é imprudência. A diferença é a intencionalidade.

Três pilares: **Scaffolding** (regras pré-decididas para não re-decidir o recorrente), **Decisioning** (processo para decisões novas) e **Crafting** (checklists para executar). O processo de decisão pesa a informação nesta ordem: **conhecimento institucional → familiaridade do usuário → pesquisa**. Toda micro-decisão de design só é válida se sustenta uma **macro-aposta** da empresa: Velocidade, Eficiência, Acurácia ou Inovação.

## 3. O que ele acrescenta ao que já temos, e o que não cobre

| Acrescenta | Não cobre (nossas regras preenchem) |
|---|---|
| Processo explícito de decisão com ordem de pesos e registro do porquê | Toque com luva (ele fixa 44 px; nós fixamos 56 px) |
| Vocabulário de apostas para justificar escolhas ao cliente | Offline-first, fila de sincronização, tablet compartilhado |
| Catálogo de leis de psicologia ligadas a problemas concretos | Ambiente industrial: ruído, mãos ocupadas, iluminação, pressa |
| Checklists de fidelidade e estilo que viram definição de pronto | Nada específico sobre formulários de chão de fábrica ou KPIs de produção |
| Regras numéricas de feedback (tempos), validação, toasts, modais, undo, autosave | Prova social, onboarding por tour, personalização e localização são irrelevantes aqui |
| Formato de auditoria repetível, comparável entre telas e sprints | Não mede nada sozinho; depende de quem audita olhar a tela real |

## 4. As apostas deste projeto

| Macro-aposta | Peso | Por quê | Implicação de design |
|---|---|---|---|
| **Velocidade** | Forte | Protótipo em semanas para validar antes do piloto de 13 semanas | Originalidade nível 1 e 2 (cópias diretas e remixes de padrões conhecidos); dez templates; shadcn |
| **Acurácia** | Forte | O protótipo existe para medir adoção e tempo de registro com usuários reais | Instrumentação de uso (RNF-08), painel de demo para cenários reprodutíveis, auditoria por incremento |
| **Eficiência** | Moderada | Replicar para 12 linhas por configuração | Motores genéricos (rotina, formulário, alerta), design system |
| **Inovação** | Fraca | O desafio pede digitalizar, não reinventar | Só dois pontos de originalidade nível 3: Minha Rotina como home e MTBF por toque |

Regra de bolso para toda decisão de tela: se não acelera a validação nem melhora a medição, não entra.

## 5. Onde estamos no processo de seis passos

| Passo | Estado | Evidência |
|---|---|---|
| 1. Definir o sistema | Feito | Doc 02 (stack, restrições, offline) e 05 (RNF) |
| 2. Modelar tarefas | Feito | Docs 03, 04 e 05 (personas, JTBD, CRUD por módulo, entidades) |
| 3. Organizar informação | Feito | Arquitetura de informação (áreas, rotas, templates, vocabulário) |
| 4. Reunir inspiração | **Próximo** | Fontes do framework: Mobbin e Pageflows para fluxos; paralelos de outros domínios: apps de inspeção industrial, PDV com luva, prontuário hospitalar em tablet, checklists de aviação |
| 5. Gerar ideias rápidas | **Próximo** | Seis ou mais wireframes de baixa fidelidade para cada template crítico: Minha Rotina, Checklist, Hora x Hora, Fila de alertas. Caixas e rótulos, sem cor |
| 6. Elevar fidelidade | Depois | Checklists 11 e 12 viram a definição de pronto (seção 8) |

O framework insiste: não pular para o passo 6. Os passos 4 e 5 são o trabalho de design engineering antes do primeiro componente.

## 6. Leis de psicologia aplicadas às nossas telas

| Lei | O que diz | Decisão no protótipo |
|---|---|---|
| **Fitts** | Alvos maiores e mais próximos são mais rápidos | Alvos de 56 px, ação primária no rodapé fixo, botões de falha do MTBF em grade grande |
| **Hick** | Mais opções, decisão mais lenta | Home mostra a próxima tarefa, não 16 módulos; barra inferior com 4 destinos |
| **Von Restorff** | O distinto é lembrado | Só a próxima tarefa e o alerta crítico recebem cor forte |
| **Tesler** | A complexidade tem de morar em algum lugar | Cálculo de GE, MTBF e prazos fica no motor; o operador aponta caixas e toca em falhas |
| **Zeigarnik** | Tarefas incompletas ocupam a mente | Contador de pendências visível e persistente até zerar |
| **Goal gradient** | Motivação cresce perto do fim | Barra de progresso do turno em Minha Rotina; "turno 100 %" como único elemento de gamificação |
| **Peak-end** | A experiência é julgada pelo pico e pelo fim | Troca de turno pré-preenchida e aceite claro são o fim do turno; precisam ser a melhor tela |
| **Picture superiority** | Imagem fixa mais que texto | Book de defeitos com foto padrão × fora de padrão lado a lado |
| **Serial position** | Primeiro e último itens ficam | Lista de tarefas: atrasadas primeiro, próxima em destaque, feitas por último |
| **Miller / chunking** | 7±2 itens | Checklists em grupos de 3 a 5 itens com cabeçalho; relatório do turno em cards por linha |
| **Jakob** | Usuários esperam o que já conhecem | Checklists parecem os formulários de papel atuais; mesmos nomes e ordem de itens |
| **Weber** | Mudanças pequenas passam despercebidas | Estados de tarefa diferem em cor, ícone e rótulo, não só em tom |
| **Proximidade / região comum** | Perto e dentro do mesmo contorno significa junto | Rótulo colado ao campo, grupos separados por espaço generoso, cards só onde há comparação |

## 7. Padrões escolhidos por template

| Template | Padrão do framework | Regra adotada |
|---|---|---|
| T1 Lista de tarefas | Chunked lists agrupadas por estado; stat card de progresso | Grupos: atrasadas, a fazer, em andamento, feitas; cabeçalhos fixos ao rolar; estado vazio por grupo |
| T2 Checklist | Grouped form fields; validação on blur; inline error; autosave contínuo | 3 a 5 itens por grupo; NC abre justificativa inline (não modal); rodapé fixo com Concluir; "salvo" visível |
| T3 Apontamento horário | Simplified form com smart defaults; progress determinate | Hora corrente pré-selecionada; célula grande; acumulado e meta sempre visíveis |
| T4 Painel de toque | Botões grandes; **undo em toast de 5 a 30 s** | Toque errado no MTBF se desfaz sem confirmação; nunca confirmação e undo juntos |
| T5 Formulário guiado | Stepper de 3 a 7 passos, nomes de ação, resumo antes de concluir | Troca de turno em 4 passos: Números, Ocorrências, Pendências, Aceite |
| T6 Biblioteca | Faceted filter; busca; read more | Faceta única por equipamento; busca por nome; visualizador em folha |
| T7 Calendário | Chunked por mês; cor + rótulo | Legenda de turnos sempre visível; cor nunca sozinha |
| T8 Fila de alertas | Notificações por urgência: banner persistente para crítico, inline para contexto; detalhe em drawer | Crítico nunca em toast; detalhe em painel lateral (desktop) ou folha inferior (tablet) |
| T9 Relatório | Stat cards; comparação lado a lado | Cards por linha com variação versus turno anterior em texto e seta |
| T10 Tabela e import | Pagination com contagem; preview antes de publicar | 25 linhas por página; importação em dois passos: pré-visualizar, publicar |

## 8. Scaffold do projeto: regras que não se re-decidem

Adotadas do framework, ajustadas ao chão de fábrica:

- **Tipo**: 16 corpo · 18 rótulo de campo · 20 subtítulo · 24 título de tela · 30 número de KPI. Entrelinha 1,5 no corpo, 1,2 em títulos. Dois pesos: 400 e 650.
- **Espaço**: 4 · 8 · 12 · 16 · 24 · 32 · 48. Mais espaço acima de um título do que abaixo.
- **Toque**: 56 × 56 px mínimo, 12 px entre alvos (acima dos 44 px do framework, por causa da luva).
- **Cor**: uma cor de ação; neutros; semânticos vermelho, âmbar, verde, azul com ícone e rótulo sempre; contraste 4,5:1 texto e 3:1 componentes.
- **Elevação**: três níveis (base, folha/drawer, modal). Sombra só para camada, não decoração.
- **Ícones**: uma biblioteca (lucide), sempre com rótulo, exceto fechar e buscar.
- **Feedback**: < 100 ms nada; 100 ms a 1 s spinner; > 1 s progresso com texto; > 10 s em segundo plano com notificação.
- **Validação**: formato on blur; obrigatórios on submit; NC imediato.
- **Mensagens**: o que está errado + como corrigir, junto do campo, sem jargão, sem código de erro.
- **Toasts**: 3 a 5 s, só para confirmação ("Registrado", "Salvo"); nunca para erro que exige ação.
- **Banner**: persistente para offline e sessão prestes a expirar.
- **Modal**: só aceite da troca de turno e ações destrutivas; fecha por X, fundo e Escape; sem modal sobre modal.
- **Undo**: ações rápidas e reversíveis (toque em falha, marcar item) ganham desfazer em vez de confirmação.
- **Autosave**: por item, com estado visível; aviso antes de sair com rascunho pendente.
- **Estados vazios**: por que está vazio + o que fazer; nunca "sem dados".
- **Navegação**: barra inferior com 4 itens e rótulo na Operação; lateral com grupos na Gestão; sem carrossel; sem abas dentro de abas; breadcrumb só na Gestão.
- **Movimento**: 100 a 300 ms, ease-out na entrada; `prefers-reduced-motion` respeitado.

## 9. Ritual de auditoria por incremento

1. Ao fechar cada incremento (I1 a I6), gerar uma auditoria por tela nova no formato JSON do framework, com as macro-apostas da seção 4 e os JTBD do doc 04.
2. Seções obrigatórias: hierarquia visual, estilo visual, acessibilidade. Contextuais: navegação e usabilidade sempre; formulários nos templates T2, T3 e T5.
3. Cada item `fail` vira issue antes do incremento seguinte; `warn` entra no backlog de polimento (I6).
4. Guardar os relatórios em `docs/auditorias/<incremento>-<tela>.json` para comparar evolução.
5. Escopo padrão de uma auditoria: a tela (ex.: `/rotina`) no viewport 1180 × 820, com as apostas Velocidade e Acurácia e os JTBD do operador, priorizando correções que reduzam toques ou tempo de registro.

Checklists rápidas do framework que entram na revisão de PR: **Quick Fidelity Audit** (`11`), **Visual Style Audit** (`12`), **Cognitive Load Audit** (`22`), **Accessibility Checklist** (`27`).

## 10. Mentalidades (anchors) que valem para este time

Das sete, três são úteis aqui: **Seja intencional** (toda decisão tem motivo registrado; é a seção "Decisões registradas" do doc 02), **Desafie premissas** (perguntas abertas com a Mondelez não viram certezas; marcamos "a validar") e **Duas verdades coexistem** (rápido e cuidadoso; convenção e diferenciação; o protótipo é descartável e é a base do piloto). As demais tratam de carreira e não entram na documentação do projeto.

## 11. Como usar no dia a dia

- Para decidir um padrão novo: abrir o arquivo de padrões correspondente, usar a tabela de seleção no fim de cada arquivo, registrar a escolha e o motivo.
- Para revisar uma tela: gerar a auditoria JSON e tratar a lista de correções prioritárias.
- Fonte original e atualizações: `audit.uxtools.co` e o repositório no GitHub.
