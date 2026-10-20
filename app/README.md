# app · Protótipo funcional (v0.3)

Protótipo web de Gestão de Rotinas Operacionais sobre o template **Studio Admin** (Next.js 16, shadcn/ui), usado 1:1: mesmo shell, telas e componentes. O único ajuste visual é o tema **Linear** (`src/styles/presets/linear.css`, padrão do app, fonte Inter). O README original do template está em `README.template.md`.

Fonte de verdade de produto: `../docs/`. Mapa de cada parte do escopo para a tela do template: `../docs/10-mapa-do-template.md`. Resultado da v0.3: `../docs/13-v0.3-tablet-first-resultado.md`.

## Rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # domínio, sessão e persistência (Vitest)
npm run typecheck
npm run build
```

Prefetch e navegação sem rede só funcionam no build de produção (`npm run build && npm run start`); o `next dev` não faz prefetch. Wake Lock e instalação como app pedem HTTPS (ou `localhost`).

## Demonstração

Pessoas da demonstração, todas com PIN `1234`: `104233` Alberto Forte e `108751` Graziela Felix (operação), `201145` Renata Lins (supervisão), `300512` Marcos Tavares (gerência), `250078` Juliana Prado (especialista).

1. Login (`/auth/login`): escolha Linha e Posto (o tablet lembra o último), digite a matrícula `104233` e o PIN `1234` no teclado da tela. Com 6 números da matrícula, o foco passa ao PIN, e o PIN entra sozinho no 4º número. Cinco PINs errados bloqueiam o PIN daquela pessoa por 1 minuto, em tempo real (nem o relógio da demonstração nem "Resetar dados" liberam antes). A liderança também pode usar "Entrar com SSO corporativo" (simulado).
2. O relógio da demonstração começa às 07:40 do 1º turno e anda em tempo real. O menu do relógio, no header, avança 15 min ou 1 h, vai ao fim do turno, simula falta de rede, simula 5 min parado (bloqueio) e reseta os dados.
3. Minha Rotina → "Registrar" no Fazer agora abre o PPLI em modo foco. Marque um item como NC, justifique, use "Restantes conformes" e siga com "Próximo" até Revisar e "Registrar". O aviso traz "Desfazer" por 10 s, e o mesmo vale para "Concluir", "Restantes conformes" e "Registrar desvio".
4. Troque para Renata Lins pelo avatar no header: o tablet pede o PIN dela. Em Alertas, o alerta A-NC aparece; assuma (com "Desfazer"), registre uma ação e resolva. Depois que o aviso some, a última ação de quem está no posto continua com "Desfazer" no histórico do alerta.
5. Avance o relógio: tarefas vencidas viram A-ATRASO, e crítico depois de 30 min.
6. Bloqueio: "Simular 5 min parado", "Bloquear tablet" no menu da pessoa ou "Ir para o fim do turno" seguido de "Avançar 15 min" ("Começou o 2º turno") abrem "Quem está no posto?". Se outra pessoa entrar com o checklist em andamento, ela vê "Rascunho iniciado por <nome> às HH:MM", com Continuar e Descartar.
7. Sem rede: "Simular sem rede" (ou desligar a rede do aparelho) e registrar um checklist. O chip do header mostra "Sem rede · 1 aguardando envio". Ao voltar a rede, o envio sai sozinho ("Tudo enviado · HH:MM"). Sem rede, uma tela que ainda não está no tablet mostra "Sem rede: esta tela abre quando a conexão voltar." e "Voltar para Minha Rotina" (só no build de produção).

## O que a v0 cobre

| Escopo | Tela do template |
|---|---|
| Login por matrícula + PIN e posto; SSO simulado | Login v2 |
| Minha Rotina do turno | Productivity |
| Checklists com C/NC/NA, centerline com faixa, justificativa de NC e prévia do registro | Invoice |
| Alertas A-ATRASO e A-NC com ciclo aberto → em tratamento → resolvido | Logistics |
| Tarefas do posto no turno | Tasks |
| Troca de pessoa, painel da demonstração, busca, ajuda | Shell do template (header e sidebar) |

Itens do menu com "em breve" (Hora x Hora, MTBF, Relatório do turno, Troca de turno, Agenda, Documentos, Usuários, Perfis) já têm tela do template definida no doc 10.

## v0.2

A v0.2 trocou componentes e layouts onde o template não servia ao chão de fábrica, com base na auditoria de UX da v0 (`../docs/auditorias/`, método do doc 09) e nos princípios de interface e movimento de Emil Kowalski. Decisões em `../docs/11-v0.2-componentes-e-layout.md`.

- Minha Rotina: "Fazer agora" em destaque, lista de tarefas tocável com "Desfazer", linha do turno em timeline.
- Checklist: etapas por grupo com revisão final, barra fixa com progresso, C/NC/NA de 44 px, centerline com −/+ e régua da faixa.
- Alertas: histórico em timeline, barra de ações fixa, contagem no menu e aviso de alerta novo para a liderança.
- Shell: estado de envio sempre visível, PIN em 4 dígitos com envio automático, telas futuras agrupadas no menu.
- Novas dependências: `motion`, `@number-flow/react`; componentes `@diceui/timeline`, `@diceui/stepper`, `@diceui/status` e `@reui/number-field` via CLI do shadcn.

## v0.3 · tablet-first

O app foi preparado para o tablet do posto, com luva, nas duas orientações e com ou sem rede, sem trocar o template; o notebook da liderança mantém a densidade dele. Plano em `../docs/12-v0.3-tablet-first.md`; resultado, decisões e pendências em `../docs/13-v0.3-tablet-first-resultado.md`.

- **Toque:** camada de densidade em `src/styles/tablet.css` (56 px nos controles, 64 px nas respostas e nas ações primárias, 16 px nos campos), ligada por `pointer: coarse` e pela variante `toque:`.
- **Shell:** sidebar em Sheet abaixo de 1024 px, header de 64 px no toque e telas que se adaptam à largura útil (`@container/content`).
- **Login:** PIN pad na tela, sem abrir o teclado do sistema; Linha e Posto em escolhas grandes, lembrados pelo tablet.
- **Checklist em modo foco:** "Etapa X de Y", barra fixa acima do teclado, "Registrar desvio" em qualquer etapa, "Ver documento" em tela cheia e ± de um passo por toque.
- **Alertas:** lista e detalhe em pilha no retrato e lado a lado na paisagem; seleção por `?alerta=`; diálogo no topo no toque.
- **Tarefas do posto:** lista tocável em telas estreitas e tabela com a linha inteira clicável nas largas.
- **Desfazer no lugar de confirmar** em Concluir, Restantes conformes, Registrar desvio, Registrar, Assumir, Registrar ação, Resolver e Descartar rascunho.
- **Sessão compartilhada:** "Quem está no posto?" por inatividade (aviso 20 s antes), segundo plano, virada de turno ou troca de pessoa, sempre com PIN; 5 PINs errados bloqueiam o PIN da pessoa por 1 minuto; rascunho mostra quem começou; os avisos da pessoa anterior somem na troca e no bloqueio.
- **Offline:** fila com "aguardando envio", "Tentar de novo" e "última sincronização" no relógio da demonstração; envio automático ao voltar a rede; prefetch das rotas do tablet, também da tela que acabou de ficar para trás; carregamento que avisa quando falta rede (`dashboard/loading.tsx`); Wake Lock.
- **Instalável:** manifest, ícones e `apple-icon`; só Inter e Geist Mono pré-carregadas.
- **Relógio único** e derivação única de tarefas e alertas.

Testar no desktop: no console, `document.documentElement.dataset.density = "touch"` liga a densidade de toque (`"fine"` desliga; apagar o atributo volta ao automático), ou use o modo dispositivo com toque do DevTools.

## Arquitetura

- Domínio puro e testado: `src/domain/` (turnos, motor de rotina, motor de formulários, motor de alertas, limites de texto).
- Dados: `src/data/seed.ts` e `src/data/repository.ts`.
- Estado do tablet: `src/stores/session/` (Zustand, versão 4, persistido num banco próprio do IndexedDB com junção entre abas); regras puras de sessão, fila, bloqueio, tentativas de PIN, migração, relógio e derivação em `src/lib/sessao/`; relógio injetável em `src/lib/clock.ts`.
- Classes compartilhadas das telas: `src/lib/pressao.ts` (retorno de toque das ações do operador, com reduzir movimento) e `src/lib/status-legivel.ts` (cor legível dos selos `Status` do template).
- Serviços do tablet sem interface (rede, envio, prefetch, Wake Lock, abas): `<Plataforma />`, montada no layout do dashboard junto da tela de bloqueio.
- Login simulado protegido por `src/proxy.ts` (cookie `rotinas_sessao`).
- Telas do template originais continuam no código como referência, fora do menu.
