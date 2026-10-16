# 02 · Solução e stack do protótipo

> Protótipo funcional **web**, publicado na **Vercel**, para validar com a Mondelez o produto "Gestão de Rotinas Operacionais" antes do desenvolvimento do piloto on-premise descrito na proposta Pitang.

## 1. Tese da solução

**Em uma frase:** um sistema de rotina que diz a cada pessoa da linha o que fazer agora, registra em poucos toques, detecta o desvio sozinho e entrega à liderança o turno consolidado, sem papel.

O protótipo de referência da Mondelez (V2) é um **catálogo de módulos** (grade 5×3). A oportunidade de design engineering é transformar isso em um **sistema dirigido pela rotina**: a home não é um menu, é a lista do que está pendente para aquele posto, naquele turno, para aquele perfil. Os módulos continuam existindo como entrada secundária.

### Princípios de produto
1. **Direcionamento antes de catálogo.** Primeira tela = "o que falta fazer agora, em ordem de prazo e criticidade".
2. **Toque de luva.** Alvos ≥ 56 px, sem gestos finos, sem hover, texto grande, contraste alto. Tudo o que o operador faz com frequência cabe em 1 a 3 toques.
3. **Registrar é barato, pular é visível.** Cada registro obrigatório tem prazo; atraso vira alerta automático com responsável. O sistema cobra, não o supervisor.
4. **Offline é o normal.** Rede de chão de fábrica cai. Nada se perde; o estado de sincronização é visível por registro.
5. **Rastreável por padrão.** Todo registro carimba data/hora, turno, posto, equipamento, usuário, versão do formulário. Correção cria nova versão, nunca apaga.
6. **Configurável, não programado.** Postos, equipamentos, rotinas, checklists, limiares de alerta e perfis são dados. Replicar para a linha seguinte é configuração.
7. **O turno é a unidade de consolidação.** Hora x Hora, MTBF, alertas e troca de turno alimentam um único relatório do turno por linha.

## 2. Escopo do protótipo vs. piloto

| | Protótipo (esta fase) | Piloto (proposta Pitang) |
|---|---|---|
| Entrega | App web na Vercel, dados simulados, 3 personas demonstráveis | App React + Ionic (APK + navegador), on-premise Mondelez |
| Backend | Nenhum no início; opcionalmente Postgres gerenciado para demo multi-dispositivo | NestJS + PostgreSQL + Docker |
| Integrações | Simuladas (Excel importado localmente, "enviado via Teams" fictício) | SSO, Teams/e-mail, Excel do SAP |
| Offline | Simulado de verdade no navegador (fila local + indicador), sem service worker obrigatório | IndexedDB + fila + sync em segundo plano |
| Objetivo | Validar fluxo, linguagem, direcionamento, alertas e consolidação com usuários reais | Validar adoção e estabilidade em campo |

## 3. Stack escolhida (verificada em 16/10/2026 na documentação oficial)

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | **Next.js 16 (App Router)**, React 19, TypeScript | Deploy nativo na Vercel com previews por branch; Server Actions/Route Handlers prontos se houver estado compartilhado; `create-next-app` já vem com TS, Tailwind, ESLint e Turbopack (padrão em `dev` e `build` no 16); `cacheComponents` como opção de primeiro nível; `proxy.ts` substitui `middleware.ts` |
| Estilo | **Tailwind CSS v4** com tokens em `@theme` | Tokens da marca (roxo Mondelez), escala de toque para luva, modo claro de alto contraste |
| Componentes | **shadcn/ui** (Radix) + lucide-react | Acessíveis, copiáveis, estilizáveis até virar o design system do produto |
| Formulários | react-hook-form + zod | Motor de formulários dinâmico com validação declarativa (obrigatório, NC exige justificativa) |
| Estado/persistência | **Zustand** com `persist` + `createJSONStorage` sobre IndexedDB (`idb-keyval`), atrás de uma interface `Repository` | Offline-first real no navegador (storage assíncrono suportado pelo middleware); troca para API/Postgres sem tocar na UI |
| Gráficos | Recharts | Hora x Hora, GE acumulado, Pareto de falhas |
| Tabelas | TanStack Table | Plano de produção, histórico com filtros |
| Datas | date-fns + locale pt-BR | Turnos, janelas de prazo, relógio da demo |
| Qualidade | ESLint (default do create-next-app), Vitest para o domínio, Playwright para o fluxo demo | Motor de alertas e cálculos (GE, MTBF) são puros e testáveis |
| Deploy | **Vercel** (preview por PR, produção em `main`), Vercel Analytics | Link compartilhável com o cliente a cada iteração |
| Evolução opcional | Neon Postgres (Vercel Marketplace) + Drizzle | Quando a demo precisar de operador no tablet e supervisor no notebook ao mesmo tempo |

Comando de scaffold (defaults atuais já incluem TS, Tailwind, ESLint, App Router, Turbopack):

```bash
npx create-next-app@latest app --src-dir --import-alias "@/*" --yes
cd app && npx shadcn@latest init
```

O `shadcn init` configura o `cn`, as variáveis CSS em `globals.css` (`@theme inline` mapeando `--color-*` para tokens `--background`, `--foreground`, `--primary`…) e o Tailwind v4. Os tokens da marca Mondelez entram nessas variáveis.

### O que fica fora de propósito
- **Ionic/Capacitor:** não nesta fase. O piloto real usa Ionic para gerar APK; no protótipo web isso só adiciona setup. Componentes e domínio são React puro e migram.
- **Autenticação real (SSO):** simulada com matrícula + PIN e troca de persona.
- **Service worker/PWA instalável:** "could". O offline é demonstrado via fila local e toggle de "simular queda de rede".

## 4. Arquitetura lógica

```
┌──────────────────────── UI (Next.js App Router) ────────────────────────┐
│  Shell tablet (header de contexto, barra de sync, navegação por toque)  │
│  Telas: Login · Contexto · Minha Rotina · Módulos (15+1) · Alertas ·    │
│         Relatório do Turno · Histórico · Admin de conteúdo · Painel demo │
└───────────────┬──────────────────────────────────────────────────────────┘
                │ hooks / actions
┌───────────────▼──────────────── Domínio (TS puro, testável) ────────────┐
│  RoutineEngine   gera TarefaInstancia a partir de RotinaTemplate ×       │
│                  posto × perfil × turno × relógio                        │
│  FormEngine      renderiza/valida FormularioVersão → Registro            │
│  AlertEngine     regras (atraso, NC, KPI < limiar) → Alerta c/ ciclo     │
│  KpiEngine       GE, ton/h, MTBF, Pareto de falhas, acumulados do turno  │
│  ShiftReport     consolida tudo por linha × turno                        │
│  Clock           relógio injetável (demo: avançar tempo)                 │
└───────────────┬──────────────────────────────────────────────────────────┘
                │ Repository (interface)
┌───────────────▼──────────────── Dados ───────────────────────────────────┐
│  LocalRepository  Zustand + IndexedDB + SyncQueue (offline-first)        │
│  RemoteRepository (fase 2) Route Handlers/Server Actions + Postgres      │
│  Seed             dados da Bis 2 / Embalagem / Loeschpack 2,4,5          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Estrutura de pastas proposta

```
src/
  app/
    (auth)/login
    (app)/
      contexto/                 seleção Fábrica → Linha → Posto
      rotina/                   Minha Rotina do turno (home)
      modulos/[slug]/           15 módulos + agenda
      alertas/
      relatorio-turno/
      historico/
      admin/                    conteúdo: planos, checklists, escala, plano de produção
    api/                        só se/quando houver estado compartilhado
  components/ui                 shadcn
  components/rotina             componentes de domínio (TaskCard, ChecklistItem, KpiTile…)
  domain/                       engines puros + tipos + regras
  data/                         repository, seed, sync queue
  lib/                          clock, formatters pt-BR, permissões
  styles/globals.css            @theme tokens
```

## 5. Modelo de dados essencial

| Entidade | O que representa | Relações principais |
|---|---|---|
| Planta → Linha → Posto → Equipamento | Árvore do contexto de trabalho (Chocolate → Bis 2 → Embalagem → Loeschpack 4) | Um nível contém muitos do nível seguinte |
| Usuario, Perfil | Pessoa (matrícula, nome) e seu nível de acesso | Usuario possui um Perfil |
| Turno | Janela de trabalho (1º, 2º, 3º) em uma data e linha | Agrupa tarefas, registros, alertas e o relatório |
| Modulo | Um dos 15 módulos (+ Agenda) | Agrupa RotinaTemplates |
| RotinaTemplate | Definição de uma rotina: módulo, frequência, janela de prazo, postos e perfis a que se aplica, formulário usado | Pertence a um Modulo; aplica-se a Postos e Perfis; usa uma FormularioVersao; gera TarefaInstancias |
| FormularioVersao | Versão imutável de um formulário (itens, tipos, obrigatoriedade, faixas) | Usada por RotinaTemplates e referenciada por Registros |
| TarefaInstancia | Ocorrência concreta de uma rotina em um turno, com prazo e estado | Pertence a um Turno; concluída por um Registro; pode originar Alerta |
| Registro, ItemRegistro | Submissão de um formulário e cada resposta (C/NC/NA, valor, texto, foto) | Registro tem autor (Usuario), posto, equipamento opcional, versão do formulário |
| Alerta, AcaoAlerta | Desvio detectado (atraso, NC, KPI) e cada ação de tratamento | Alerta origina-se de TarefaInstancia ou Registro; tem muitas AcoesAlerta |
| EventoFalha | Falha apontada no MTBF (tipo, início, fim) | Pertence a um Equipamento e a um Turno |
| ApontamentoHora | Caixas produzidas em uma hora e KPIs derivados | Pertence a uma Linha e a um Turno |
| PlanoProducao | Linha × SKU × dia em toneladas | Fonte da meta hora |
| Documento | IT, LPP, página de book de defeitos, com versão | Vinculado a Equipamentos |
| Escala | Dias e turnos de um colaborador | Pertence a um Usuario |
| Aviso | Item da agenda da fábrica ou recado | Publicado em uma Planta, filtrável por linha |
| SyncQueue | Fila de envio de registros pendentes | Guarda o estado de sincronização de cada item |

Campos de rastreabilidade em **todo** `Registro`, `Alerta`, `AcaoAlerta`, `EventoFalha`, `ApontamentoHora`: `criadoEm`, `turnoId`, `postoId`, `usuarioId`, `dispositivoId`, `versaoFormulario`, `syncStatus` (`local` | `enviando` | `sincronizado` | `erro`).

## 6. Regras de cálculo (a validar na Etapa 1 do piloto)

- **Toneladas** = caixas apontadas × peso líquido por caixa do SKU em produção (do plano de produção).
- **ton/h** = toneladas da hora / fração de hora produtiva.
- **GE (eficiência global)** = toneladas produzidas ÷ (capacidade nominal da linha em t/h × horas programadas). Mockups distinguem GE de OEE; o protótipo mostra GE e deixa OEE como campo informativo até a definição oficial da Mondelez.
- **Meta hora** = plano do dia ÷ horas programadas do turno (ou meta fixa por SKU).
- **MTBF** = tempo operacional do turno ÷ número de falhas apontadas. Pareto por tipo de falha.
- **Farol**: verde ≥ 100 % da meta acumulada; amarelo ≥ 90 %; vermelho < 90 %.

## 7. Motor de alertas (regras iniciais)

| Código | Gatilho | Criticidade | Destinatário | Ciclo |
|---|---|---|---|---|
| A-ATRASO | Tarefa obrigatória não concluída até o fim da janela | Atenção; vira Crítico após 30 min | Supervisor do turno; responsável = operador do posto | aberto → em tratamento → resolvido |
| A-NC | Item marcado "não conforme" em qualquer checklist | Conforme o item (segurança/qualidade = Crítico) | Supervisor + Especialista da área | idem, exige ação registrada |
| A-GE | GE acumulado < 70 % após 3 h de turno | Atenção | Supervisor, Gerente | fecha automaticamente se GE recuperar |
| A-META | Produção acumulada < meta − 1,3 t (configurável) | Atenção | Supervisor | idem |
| A-MTBF | MTBF do turno < limiar do equipamento | Info | Especialista | informativo |
| A-REPET | ≥ 3 falhas do mesmo tipo no turno | Atenção | Supervisor, Especialista | sugere troubleshooting |

Canais no protótipo: in-app (badge, painel) e um "enviado via Teams/e-mail" simulado com log visível. Todo alerta mostra **idade**, **responsável**, **origem** (link para o registro) e **histórico de ações**.

## 8. Ferramentas de demonstração (parte do produto do protótipo)

Um painel discreto (atalho no header) com:
- **Trocar persona** (Operador Alberto · Supervisora Renata · Gerente Marcos · Especialista Juliana · Assistente Carlos).
- **Avançar relógio** (+15 min, +1 h, "fim do turno") para disparar alertas de atraso e fechar o turno sem esperar.
- **Simular queda de rede** (liga/desliga) para mostrar a fila local e o indicador de sync.
- **Resetar dados** para o seed inicial.

Sem isso a demo depende do relógio real e não convence.

## 9. Portabilidade para o piloto on-premise

- O protótipo não usa recursos exclusivos da Vercel na lógica de negócio. Se houver backend, fica atrás de `Repository`.
- `output: 'standalone'` + Dockerfile permitem rodar o mesmo Next.js em container na Mondelez se a opção "web no navegador" for suficiente para a liderança.
- Para o APK dos tablets (proposta), a UI React, o domínio e o design system migram para o projeto Ionic/Capacitor; o shell de rotas é reescrito. Essa fronteira é mantida limpa desde o início (`domain/` e `components/` sem dependências de Next).

## 10. Decisões registradas (ADR-lite)

| # | Decisão | Alternativa descartada | Motivo |
|---|---|---|---|
| D1 | Next.js na Vercel | Vite SPA | Previews por PR, caminho natural para estado compartilhado, zero config de deploy |
| D2 | Sem Ionic no protótipo | Ionic React desde já | Custo de setup sem ganho de validação; UI custom de qualquer forma |
| D3 | Estado local offline-first primeiro | Banco desde o dia 1 | Demo em um dispositivo não precisa; interface `Repository` preserva a troca |
| D4 | shadcn/ui + Tailwind v4 | Lib de componentes fechada | Controle total sobre alvos de toque e contraste; vira design system do produto |
| D5 | Home = Minha Rotina, grade de módulos secundária | Grade 5×3 como home (mockup V2) | Atende "direcionamento claro por perfil", requisito obrigatório do briefing |
| D6 | Relógio injetável | `Date.now()` direto | Demo controlável e testes determinísticos do motor de alertas |
| D7 | PT-BR único | i18n | Piloto é Brasil; evita custo sem retorno |
| D8 | Base do código: template Studio Admin (`arhamkhnz/next-shadcn-admin-dashboard`, MIT), com as telas de exemplo removidas | `create-next-app` + `shadcn init` do zero | Mesma stack (Next 16, Tailwind v4, shadcn radix-nova, Zustand, TanStack Table, Recharts) com casca de navegação pronta; já validado em outro protótipo |
| D9 | Biome para lint e formatação (vem do template) | ESLint | Uma ferramenta só, mais rápida; trocar não traria ganho para o protótipo |
| D10 | Escala de toque aplicada onde os componentes são usados (`lib/touch.ts`, token `--spacing-touch`), sem editar `components/ui` | Trocar o estilo shadcn de `nova` para um mais espaçoso | Mantém os componentes atualizáveis pelo CLI do shadcn; a troca de estilo fica como opção se a escala por uso ficar repetitiva |

## 11. Riscos técnicos do protótipo

| Risco | Mitigação |
|---|---|
| Definição de GE/OEE divergir da Mondelez | Fórmulas isoladas em `KpiEngine`, parametrizáveis; rótulo "a validar" na UI |
| Demo multi-dispositivo exigir backend cedo | `Repository` já desenhada; Neon + Drizzle em 1 dia |
| Tablet real ter comportamento diferente do navegador desktop | Testar cedo no tablet do laboratório, em landscape e portrait, com luva |
| Excesso de módulos diluir a qualidade | MoSCoW (doc 06): núcleo primeiro, restante via motor genérico de checklist |
