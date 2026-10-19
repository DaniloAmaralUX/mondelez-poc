# 17 · Frente C: turno e liderança (v0.5)

Telas da frente C sobre a fundação do commit `9c73a3b` (contrato no doc 16a): Troca de turno, Relatório do turno, Painel das linhas e Notificações. Tudo no template Studio Admin 1:1, tema Apple, camada de toque da v0.3 e composição por largura útil (`@container/content`).

## 1. Telas e rotas

| Tela | Rota | Template | Permissão | Quem usa |
| --- | --- | --- | --- | --- |
| Troca de turno | `/dashboard/troca-de-turno` | Invoice (formulário + documento) | `troca-de-turno` | Operação passa o posto; Supervisão confere e recebe na ausência; Gerência e Especialista leem |
| Relatório do turno | `/dashboard/relatorio-turno` | Default (cards de métrica + detalhe) | `relatorio` | Supervisão envia; Gerência, Especialista e Assistência leem |
| Painel das linhas | `/dashboard/painel` | Finance (destaques, gráfico, tabela) | `painel` | Gerência, Supervisão, Especialista |
| Notificações | `/dashboard/notificacoes` | Mail (lista + detalhe, como Alertas) | `notificacoes` | Gerência, Supervisão, Especialista |

Todas abrem com `<SoComPermissao>` e o título grande (`TituloGrande`: data do relógio da demonstração, título de 32–34 px, subtítulo com turno e contexto).

### Arquivos

- `troca-de-turno/`: `page.tsx`; `_components/troca-de-turno.tsx` (escolhe a visão pelo perfil), `passagem-do-posto.tsx` (formulário do operador, documento e aceite), `kpis-da-passagem.tsx`, `papel-da-passagem.tsx`, `aceite-do-turno.tsx` (escolha de quem recebe + `PinPad`), `visao-da-linha.tsx` (liderança), `use-passagem.ts` (dados do posto no turno, candidatos ao aceite, turno anterior), `sugestoes.ts` (textos pré-preenchidos).
- `relatorio-turno/`: `page.tsx`; `_components/relatorio-do-turno.tsx`, `card-da-linha.tsx` (card por linha com `Variacao`), `alertas-da-linha.tsx`, `envio-a-lideranca.tsx` (diálogo de envio e situação do envio), `resumo.ts` (texto do relatório), `indicadores.ts` (formatação e comparação, usada pelas três telas de números), `titulo-grande.tsx` (título das quatro telas).
- `painel/`: `page.tsx`; `_components/painel-das-linhas.tsx`, `grafico-ge.tsx`, `tabela-linhas-turnos.tsx`, `dados.ts` (colunas de turno, falha que mais parou, cor de cada linha).
- `notificacoes/`: `page.tsx`; `_components/notificacoes.tsx`, `mensagem.tsx` (cartão do Teams e e-mail, também usados na prévia do envio do relatório).

Os componentes que mais de uma tela usa (`indicadores.ts`, `titulo-grande.tsx`, `mensagem.tsx`) ficaram na pasta de uma das minhas rotas e são importados pelas outras: `dashboard/_components` é da fundação.

## 2. O que cada job resolve

| Job (doc 04) | Persona | Como a tela resolve |
| --- | --- | --- |
| "Quando termino o turno, quero que a passagem já venha preenchida com meus números" (P0, meta ≥ 80 % dos campos) | Operador | Os 11 indicadores vêm do `useKpisDoPosto` e as perguntas de paradas, pendências e pedidos de ajuda já vêm escritas a partir das falhas, das tarefas atrasadas, dos alertas abertos e dos pedidos de ajuda do turno. Sobra responder as etiquetas (quantas e onde) e, se quiser, um comentário: **14 de 17 campos prontos**, mostrado no card ("14 de 17 campos prontos"). |
| Passar o bastão com aceite (RN-10) | Operador, Supervisão | Depois de entregar, o card "Aceite de quem recebe" lista os operadores do posto (a turma do turno seguinte primeiro, com o selo "Próximo turno", por `turmaDoTurno`) e a supervisão; quem recebe digita o próprio PIN no teclado da tela (`PinPad`), com a mesma contagem de erros do login. A supervisão também recebe pela visão da linha ("Receber na ausência"). |
| Conferir a passagem | Supervisão | Visão da linha: cada posto com a situação (Pendente, Entregue, Recebida), quem entregou e recebeu e quando, quatro números (GE, MTBF, falhas, pendências) e o documento em "Ver passagem" (ou "Ver prévia", com os números de agora, antes da entrega). Ao lado, o que o turno anterior deixou. |
| "Relatório por linha pronto no fim do turno" (P0) | Gerente | Card por linha (BIS 1–4) com GE, toneladas × meta, MTBF, maior parada, alertas e pedidos de ajuda, e a seta com a diferença para o turno anterior. Selo "Simulado" nas linhas do gerador e "Ao vivo" na Bis 2. Nenhuma digitação. |
| "Consolidado da linha pronto na passagem" (P0) | Supervisão | O card da Bis 2 em destaque, os alertas do turno da linha embaixo e "Enviar à liderança": prévia do cartão do Teams e do e-mail com o texto já gerado, observação opcional, envio que conclui a tarefa "Fechar relatório do turno". O card "Envio à liderança" diz quando e por quem foi enviado. |
| "Comparar linhas e turnos lado a lado, para priorizar recursos" (P1) | Gerente | Painel: pior GE agora, falha que mais parou nos últimos 6 turnos e linhas abaixo da meta; GE por linha em gráfico de linhas com rótulo direto; turno atual por linha (toneladas × meta, MTBF, alertas); tabela linhas × turnos com abas para GE, toneladas × meta, MTBF e alertas. |
| "Ser notificado de desvio crítico no canal que já uso" (P0) | Gerente | Caixa de saída simulada: canal, para quem, assunto e hora; filtro Todas / Teams / E-mail; detalhe renderizado como o post do app no Teams ou como o e-mail, com o aviso de que o envio é simulado. |

## 3. Decisões

| Antes | Depois | Por quê |
| --- | --- | --- |
| Invoice com a prévia reduzida (escala ~0,6) ao lado do formulário | Folha fluida, sem escala: ao lado do formulário no notebook (7/5) com texto de 14 px; no iPad, "Ver documento" em tela cheia | A folha do checklist tem largura fixa de 816 px; reduzida, o texto ficava com ~8 px (doc 13). Uma folha que se ajusta à coluna mantém o papel do checklist e continua legível |
| Perguntas da passagem em branco | Paradas, pendências e pedidos de ajuda preenchidos com uma linha por acontecimento, hora na frente; sem dados, uma frase afirmativa ("Nenhuma parada apontada no turno.") | É o job P0: a pessoa só revisa. A frase afirmativa também é informação para quem recebe, e mantém a conta de campos prontos estável |
| Pendências com uma linha por tarefa atrasada e por alerta aberto (26 linhas no fim do turno da demonstração, cortadas no limite de 1.000 caracteres) | Uma linha por tarefa atrasada distinta ("Atrasada: Hora x Hora · apontar caixas (× 6)") e os alertas abertos que não são de atraso | O alerta A-ATRASO repete a tarefa atrasada; agrupado, o texto cabe no campo e se lê em cinco segundos |
| Etiquetas com 0 como valor inicial | Campo vazio, obrigatório na entrega, com − e + de 64 px no toque | Zero pré-preenchido seria uma resposta que ninguém deu. Validação só ao entregar, com o erro ao lado do campo e o foco nele |
| Botão "Entregar" sempre ativo | Desabilitado antes da janela da tarefa (30 min antes do fim do turno), com o motivo escrito ao lado | Entregar às 08:00 congelaria números de um turno pela metade. O texto explica, como pede a regra de botão desabilitado no toque |
| Formulário fechado depois de entregar | Continua editável até o aceite ("Atualizar entrega"); a tela rola até o aceite | `entregarTurno` aceita regravar enquanto não há aceite; corrigir é melhor que pedir para desfazer |
| Aceite num diálogo | Card na própria página, abaixo do formulário, com os cartões de escolha da tela de bloqueio e o `PinPad` | Quem recebe chega ao tablet e vê de cara o próprio nome; o diálogo esconderia o documento que a pessoa está aceitando |
| Supervisão recebe escolhendo a si mesma na lista | "Receber na ausência" na visão da linha, diálogo só com o PIN dela | Para a supervisão o trabalho é por posto, não pelo tablet de um posto |
| Todos os alertas da linha no detalhe do relatório (21 linhas) | Os seis mais urgentes (abertos e críticos primeiro) e "Ver todos os N em Alertas" | O relatório resume; a lista inteira já tem tela própria |
| Eixo do GE fixo em 55–100 % | Desce em degraus de 10 quando alguma linha cai abaixo de 55 % | Com a Bis 2 a 12 % no fim do turno da demonstração, a linha sumia abaixo do eixo |
| Cores do gráfico `--chart-1` a `--chart-4` do tema | Bis 1 sky-600, Bis 2 `--chart-1`, Bis 3 `--chart-5`, Bis 4 `--chart-4` | O validador da guia dataviz reprovou o `--chart-3` (lilás claro, luminosidade 0,78 e croma 0,09: lê como cinza e se confunde com o roxo). O par âmbar/verde fica em ΔE 7,9 na protanopia, aceito com o rótulo direto no fim de cada linha, a legenda e a tabela com os mesmos números |
| Legenda separada | Legenda em cima e rótulo direto no fim de cada linha, afastados 16 px entre si | Identidade sem depender da cor; no toque o tooltip não abre por hover, e a tabela embaixo cobre os valores |
| Tabela com rolagem lateral no iPad | Os turnos mais antigos saem primeiro quando a tabela não cabe (container `/tabela`); "Agora" sempre fica | Sem rolagem horizontal em 772 px |
| Mail do template (`/mail`, painéis redimensionáveis e Drawer) | Lista e detalhe por container query, pilha com "Voltar" abaixo de 56 rem, como Alertas; lado a lado, a lista rola sozinha e o detalhe fica parado | Mesma decisão de Alertas na v0.3: sem Drawer sobre a lista no retrato, arranjo pelo CSS, hidratação estável |
| Cor do Teams no cartão | Só tokens do tema; o roxo fica no "Abrir no app" | Um acento por tela |

## 4. Composição por largura

| Tela | Notebook (1.440 × 900) | iPad paisagem (1.180 × 820) | iPad retrato (820 × 1.180) |
| --- | --- | --- | --- |
| Troca (operador) | Formulário 7/12 (números, perguntas, aceite) e documento 5/12 | Coluna única: números em 4 colunas, perguntas, aceite em duas colunas (pessoas e PIN), "Ver documento" | Igual à paisagem, números em 4 colunas e contagens em 5 |
| Troca (liderança) | Postos 7/12 e turno anterior 5/12 | Coluna única | Coluna única |
| Relatório | Quatro linhas lado a lado; alertas da Bis 2 8/12 e envio 4/12 | Linhas em 2 × 2; detalhe em coluna | Linhas em 2 × 2; detalhe em coluna |
| Painel | Destaques em 3; gráfico 8/12 e turno atual por linha 4/12; tabela com 7 turnos | Destaques em 3; gráfico, turno atual e tabela em coluna | Igual, com menos turnos na tabela |
| Notificações | Lista (26 rem) e detalhe fixo ao rolar | Pilha: lista, depois detalhe com "Voltar" | Pilha |

## 5. Verificação

- **Typecheck** (`npx tsc --noEmit`): sem erros nos meus arquivos. **Biome** (`npx biome check` nas quatro pastas): sem erros nem avisos.
- **Capturas** com o Chrome headless do Puppeteer (script próprio em `%TEMP%/frente-c/captura.mjs`), relógio levado ao fim do turno pelo menu do relógio ("Ir para o fim do turno", 13:55), em notebook 1.440 × 900 (sem toque), iPad paisagem 1.180 × 820 e iPad retrato 820 × 1.180 (com `hasTouch` e `isMobile`):
  - Operador (104233), Troca de turno, com o fluxo inteiro: entregar sem responder as etiquetas (erro ao lado do campo e foco nele), responder 2 etiquetas e onde, entregar, digitar o PIN de quem recebe (Diego, turma do turno seguinte) e ver "Recebido por Diego Rocha às 13:55" no alerta e na folha.
  - Supervisora (201145): Troca de turno (visão da linha), Relatório (com o diálogo de envio nas abas Teams e E-mail e o envio), Notificações (lista e detalhe) e Painel.
  - Gerente (300512): Painel, Relatório (sem o botão de envio), Notificações e Troca de turno (só leitura).
  - Em todas: rolagem horizontal 0, nenhum erro de console; no toque, nenhum alvo abaixo de 44 px e nenhum texto abaixo de 13 px no conteúdo. Os únicos alvos menores medidos no toque são os círculos dos cartões de escolha do aceite (24 px), dentro do cartão inteiro clicável de 72 px, como na tela de bloqueio.
  - O que as imagens mostraram e foi corrigido no commit `4032d81`: pendências longas e cortadas, data quebrada no cabeçalho da folha, legendas truncadas nos números, texto errado da janela de entrega na visão da liderança, lista de alertas longa demais no relatório, divisórias desalinhadas nos cards das linhas, Bis 2 abaixo do eixo do gráfico e caixa de saída comprida no notebook.
- As capturas saíram já com o tema Mondelēz da v0.6 (commit `8e033af`, de outra frente), que entrou no meio do trabalho: as telas usam só tokens do tema e acompanharam sem mudança.
- **Não verificado em imagem:** "Receber na ausência" da supervisão com um posto já entregue (o diálogo usa o mesmo `AceiteDoTurno` verificado no fluxo do operador) e o modo escuro.
- **Ambiente:** o `next dev` compartilhado (3100) ficou cerca de 40 min sem responder (uma thread do servidor a ~95 %, nem o HTML do login em 8 min) enquanto as quatro frentes capturavam ao mesmo tempo; as capturas só saíram depois que ele voltou. O script espera a hidratação do React antes de tocar e repete o tamanho de tela quando o servidor recarrega a página. A rodada completa pela suíte Playwright (`app/e2e/telas.spec.ts`, que já lista as minhas rotas) fica com quem orquestra, contra o build de produção.

## 6. O que faltou no contrato ou ficou em aberto

- **Rascunho da passagem.** O store não tem rascunho para a troca de turno (só para checklists). O que a pessoa digita fica no estado da tela: sair da rota perde o texto (os números e as sugestões voltam sozinhos). Sugestão para a fundação: `rascunhosTroca` por `postoId|turnoChave`, com a mesma regra de autor do rascunho do checklist.
- **Desfazer a entrega.** Não há ação para desfazer `entregarTurno`; a tela deixa corrigir até o aceite, que cobre o erro comum. Desfazer um aceite também não existe (é a assinatura de quem recebeu).
- **Supervisão entregando por um posto.** `entregarTurno` usa o posto do tablet; a supervisão só recebe na ausência, não entrega pelo operador.
- **"Passar turno" na Minha Rotina** (`rotina/_components/focus-card.tsx`) continua desabilitado com "em breve": é arquivo de outra frente. Basta virar um link para `/dashboard/troca-de-turno`.
- **Alertas e falhas das outras linhas.** `useAlertas` só deriva a linha do tablet; o detalhe do relatório mostra os alertas da Bis 2. As outras linhas têm só os números do gerador.
- **Notificações persistidas só do relatório, da ajuda e dos recados.** As de alerta são derivadas a cada render (`useNotificacoes`), então somem se o alerta deixar de existir (ex.: um registro desfeito).
- **Histórico da Bis 2.** Os turnos anteriores da Bis 2 também vêm do gerador; a troca de turno gravada no turno anterior aparece na visão da liderança, mas não alimenta o painel.
