# 17 · Parte A: produção (Hora x Hora e Sobrepeso)

Frente A da v0.5 (doc 16a). Duas telas novas, só nos caminhos da frente: `app/src/app/(main)/dashboard/hora-x-hora/**` e `app/src/app/(main)/dashboard/sobrepeso/**`. Nada fora delas foi editado; tudo consome o contrato do commit `9c73a3b`.

## 1. Telas e rotas

| Tela | Rota | Template de referência | Quem |
| --- | --- | --- | --- |
| Hora x Hora (RM-10, RN-03 a RN-05) | `/dashboard/hora-x-hora` | Analytics (faixa de KPIs, gráfico `ComposedChart`, cards 8/4) | Operação e Supervisão apontam; Gerência e Especialista leem |
| Sobrepeso, refugo e reprocesso (RM-03) | `/dashboard/sobrepeso` | Analytics (card + faixa de KPIs + lista) | Idem |

As duas páginas são Server Components com `<SoComPermissao recurso="apontamentos">`; a escrita é decidida na tela por `pode(perfil, "apontamentos", "escrever")`.

### Hora x Hora

Componentes em `hora-x-hora/_components/`:

| Arquivo | O que faz |
| --- | --- |
| `hora-x-hora.tsx` | Composição por largura, escolha da hora do card, rascunho compartilhado, `key={usuarioId}` |
| `cabecalho-da-producao.tsx` | Large Title (linha · posto, título, SKU, meta por hora em t e caixas, turno). Usado também pelo Sobrepeso |
| `apontar-hora.tsx` | Card "Apontar a hora das HH:00": caixas, prévia de toneladas, GE e farol, motivo abaixo da meta, correção |
| `indicadores-do-turno.tsx` | Toneladas × meta acumulada com farol, GE acumulado, meta do turno, horas apontadas e pendentes (NumberFlow) |
| `grafico-hora-a-hora.tsx` | Dois painéis: barras por hora com a meta tracejada; realizado acumulado × trajetória da meta |
| `horas-do-turno.tsx` | As 8 horas: tabela no notebook, lista tocável no iPad; falhas da hora com link ao MTBF |
| `farol-status.tsx`, `formato.ts` | Farol no `Status` do template; formatos pt-BR, motivos |

### Sobrepeso

Componentes em `sobrepeso/_components/`: `sobrepeso.tsx` (composição, acumulado do turno), `apontar-perdas.tsx` (card do bloco), `blocos-do-turno.tsx` (lista dos blocos) e `formato.ts`.

## 2. Composição por largura

As duas telas usam a largura útil (`@container/content`) com um corte só: 60 rem. O notebook passa dele. Os dois iPads ficam abaixo: 860 px úteis em paisagem, com a sidebar fixa, e 772 px em retrato, com a sidebar no Sheet. Por isso paisagem e retrato têm o mesmo arranjo. A ordem do DOM é igual à visual: o card de apontar do Hora x Hora, que muda de lugar, está duas vezes no HTML e o CSS mostra um. A tabela e a lista das horas seguem o mesmo padrão.

| Tela | Notebook (1.440 × 900) | iPad paisagem (1.180 × 820) | iPad retrato (820 × 1.180) |
| --- | --- | --- | --- |
| Hora x Hora (quem aponta) | Título de 34 px; indicadores do turno em 4 colunas; gráfico (8/12) e card "Apontar a hora" (4/12) lado a lado, na mesma altura; "Horas do turno" em tabela de 9 colunas (hora, caixas, toneladas, GE, farol, motivo, quem apontou, falhas, ação) | Título de 32 px; o card "Apontar a hora" logo abaixo do título; indicadores em 2 × 2; gráfico na largura toda, com os dois painéis; horas em lista tocável (hora em 20 px, caixas · toneladas · GE, quem apontou e motivo, situação; "Apontar 07:00" ou "Corrigir 07:00" e "N falhas" com 56 px no toque) | Igual à paisagem, na largura de 772 px |
| Hora x Hora (só leitura) | Card "Só leitura" no lugar do card de apontar, ao lado do gráfico | Sem o card: indicadores primeiro, depois gráfico e lista, sem os botões de apontar | Igual à paisagem |
| Sobrepeso | Card do bloco (7/12) e, ao lado (5/12), o acumulado do turno com as três células empilhadas e a lista "Blocos do turno" | Coluna única: card do bloco, acumulado do turno em 3 colunas (a partir de 36 rem úteis), lista dos blocos | Igual à paisagem |

No Sobrepeso, os três números do card (sobrepeso, refugo, reprocesso) ficam lado a lado a partir de 34 rem do próprio card (`@container/perdas`, o container é o card e não a tela). Pelas larguras acima, isso vale nos três tamanhos; abaixo disso, empilham. Quem só lê vê o card "Só leitura" no mesmo lugar do card do bloco, também no iPad. O espaço entre as seções é de 32 px no notebook e 24 px no iPad.

## 3. Decisões

| Antes | Depois | Por quê |
| --- | --- | --- |
| Faixa de KPIs e cards 7/5 do Analytics, por breakpoint da janela (`xl`) | Large Title (linha · posto, título, SKU, meta da hora em toneladas e em caixas, turno), indicadores do turno, gráfico 8/12 com o card de apontar 4/12 e as horas; corte por largura útil (60 rem) | A composição do template fica (doc 10); o arranjo segue a área que sobra da sidebar (doc 14 §3), não a janela |
| Card de apontar num lugar só, reordenado com `order-*` no iPad | O card está duas vezes no HTML (no topo, para o iPad; ao lado do gráfico, para o notebook) e o CSS mostra um | `order-*` faria a ordem de leitura e de foco divergir da visual. É o mesmo padrão de tabela × lista da v0.3 |
| Rascunho dentro do card | Rascunho no componente da tela (`RascunhoHora`, com a hora a que se refere); outra hora começa vazia | Com dois cards no HTML, os dois mostram o mesmo número, e mudar a largura não perde o que foi digitado |
| Rascunho que fica para a próxima pessoa | `key={usuarioId}` nas duas telas: trocou quem está no posto, o card começa vazio | O tablet é do posto e a sessão é compartilhada (app/CONVENCOES.md) |
| Card sempre na hora corrente | A hora escolhida na lista (correção); senão a pendente mais antiga; senão a aberta. A descrição diz "Pendente: a hora fechou às 08:00", em vermelho, ou "Hora em curso, fecha às 09:00" | O atrasado vem primeiro; a lista repete "aponte a mais antiga primeiro" |
| Apontamento fechado depois de gravado | "Corrigir" em cada hora apontada (tabela e lista): o card carrega caixas, motivo e detalhe, diz quem apontou e quando, e oferece "Salvar correção" e "Cancelar correção". O card visível rola até a tela com o campo de caixas focado | Errar e não poder corrigir é uma das ansiedades do doc 04; `apontarHora` aceita regravar a mesma hora |
| Resultado só depois de gravar | Prévia ao vivo de toneladas, GE da hora e farol enquanto a pessoa digita, numa região viva educada (`aria-live="polite"`) | É o job P0: ver se está na meta antes de confirmar |
| Motivo em texto livre, sempre na tela | O motivo só aparece quando a prévia fica abaixo da meta da hora, em botões de um toque (Falha de máquina, Falta de material, Troca de SKU, Setup, Outro), com "N falhas apontadas nesta hora no MTBF" acima. "Outro" pede o texto. Na meta, nada é pedido e um detalhe escrito fica como observação | O RM-10 pede o motivo só abaixo da meta; botões servem de luva; as falhas da hora ajudam a escolher o motivo |
| Botão de gravar desabilitado até o formulário estar completo | Botão sempre ativo; validação ao gravar, com o erro junto do campo, o foco no primeiro erro e o erro apagado assim que a pessoa mexe no campo | Regra da v0.3 (docs/12 §2 item 12): validar no envio e nunca desabilitar "por inválido" |
| −/+ do `NumberField` repetindo o passo enquanto o dedo segura | Um toque, um passo: 10 caixas no Hora x Hora; 0,1 g e 0,5 kg no Sobrepeso. Com o campo vazio, o primeiro toque preenche a meta da hora em caixas (Hora x Hora) ou 0 (Sobrepeso) | A luva segura o botão e o base-ui repetiria o passo; é a mesma solução do centerline do checklist. Digitar continua sendo o caminho principal |
| Farol e situação como selo só de cor | `Status` do template com ponto, cor e o estado por extenso ("Na meta", "Perto da meta", "Abaixo da meta"; no Sobrepeso, "Dentro do limite", "Acima do limite"); o pulso só no vermelho e no pendente. Número acima do limite na lista dos blocos leva "(acima do limite)" para leitor de tela | A cor nunca fica sozinha; o pulso marca só o que pede ação |
| Um farol só (RN-05, sobre a meta acumulada) | Farol acumulado no indicador "Toneladas no turno"; farol da hora na prévia do card e em cada hora da lista | Quem aponta quer saber da hora que fechou; quem acompanha, do turno até aqui |
| Números fixos na faixa de KPIs do Analytics | `NumberFlow` nos indicadores do turno e no acumulado do Sobrepeso, o mesmo componente dos contadores do "Fazer agora" da Minha Rotina | Depois de apontar, os números mudam na mesma tela; os dígitos rolam até o valor novo e mostram o que mudou |
| Divisórias da faixa com `divide-x` e `divide-y` por breakpoint | Grade com `gap-px` sobre a cor da borda | Desenha as linhas nos dois arranjos (4 em linha e 2 × 2) sem uma regra por direção |
| Um `ComposedChart` (o "Traffic Quality" do Analytics) | Dois painéis com o mesmo eixo de horas: barras por hora com a meta tracejada; realizado acumulado × trajetória da meta até o fim do turno. Meta em tracejado cinza e legenda direta acima de cada painel | Toneladas da hora e do turno têm escalas diferentes (3 t × 23 t): dois eixos Y no mesmo gráfico confundem. Com a meta em cinza, o realizado é a única cor forte; a trajetória até o fim mostra quanto falta |
| Tabela do template em toda largura | Tabela de 9 colunas no notebook; lista tocável no iPad; as duas no HTML e a largura útil escolhe | Padrão de Tarefas do posto (docs/12 §3.4): densidade no notebook, alvos de 56 px no iPad |
| Falhas só na tela do MTBF | Coluna "Falhas" com "N falhas" da hora (`falhasNaHora`), que abre o MTBF, e "Abrir MTBF" no card das horas | Job P1 da supervisão: a hora que caiu e o que parou nela, na mesma linha |
| Toneladas sempre com o mesmo número de casas | Duas casas na hora; uma no acumulado e no turno | A diferença para a meta da hora está na segunda casa (2,69 × 2,86) |
| Card de apontar para todos os perfis | "Só leitura" com "Ver falhas no MTBF" para Gerência e Especialista no notebook; no iPad, quem só lê não tem o card no topo e vê os números primeiro. "Apontar" e "Corrigir" só aparecem com `pode(perfil, "apontamentos", "escrever")` | Gerência e Especialista leem (doc 05 §4); para eles, os números vêm antes |
| RM-03: apontamento de perdas por hora | Bloco de 2 h, como o template `sobrepeso` do seed. O card e a lista mostram o intervalo de produção ("06:00–08:00"), não a hora em que a tarefa abre (07:00) | A frequência é da fundação; quem aponta pensa no que saiu da linha naquele intervalo |
| Limites só na regra do A-PERDA | Limites no subtítulo e embaixo de cada campo ("limite 2,5 g"), que vira "acima do limite de 2,5 g" em vermelho. Acima de um limite, o motivo passa a obrigatório e um aviso diz que a liderança recebe o A-PERDA ao gravar | A pessoa sabe antes de gravar que vai gerar alerta, e o alerta chega com o motivo |
| Campos de perdas com 0 como valor inicial | Os três números começam vazios e são obrigatórios: "Digite o refugo (0 se não houve)." | Zero pré-preenchido seria uma resposta que ninguém deu |

## 4. Jobs resolvidos

| Job (doc 04) | Persona | Como a tela resolve |
| --- | --- | --- |
| "Quando fecha a hora, quero apontar as caixas e ver se estou na meta, para corrigir o ritmo ou pedir ajuda" (P0) | Operador | O Hora x Hora abre com o card na hora a apontar (a pendente mais antiga, senão a aberta): "Apontar a hora das 07:00", campo de caixas de 64 px no toque, com a meta em caixas como dica e −/+ de 10. Enquanto a pessoa digita, a prévia mostra toneladas, GE da hora e farol. Abaixo da meta, o motivo sai em um toque. "Apontar 07:00" grava, conclui a tarefa da rotina e confirma com caixas, toneladas e GE. Na mesma tela, o turno: toneladas × meta até aqui com o farol acumulado, GE acumulado, horas apontadas e pendentes, e o acumulado contra a trajetória da meta. Pedir ajuda fica no botão do header |
| "Quando o GE do turno cai, quero ver as paradas e falhas da hora, para atacar a causa e não o sintoma" (P1) | Supervisão | O GE acumulado fica vermelho abaixo de 70 %, com "Alerta abaixo de 70 %" escrito. O gráfico mostra qual hora ficou abaixo da meta tracejada. Cada hora da tabela (ou da lista) traz GE, farol, o motivo que o operador escolheu e "N falhas", que abre o MTBF. A Supervisão também aponta e corrige. Os alertas A-GE e A-META, com as falhas no detalhe, ficam na tela de Alertas, fora desta frente |
| Sobrepeso, refugo e reprocesso a cada bloco, com alerta acima do limite (etapa 3 do mapa do turno, "Produzir e apontar"; RM-03) | Operador aponta; a liderança da linha recebe o A-PERDA | O card do bloco aberto ou pendente ("Perdas das 06:00–08:00", com "Aponte até 08:00" ou "Pendente: venceu às 08:00") pede sobrepeso médio por pacote, refugo e reprocesso, com o limite embaixo de cada campo. Acima do limite, o motivo passa a obrigatório e o aviso diz que a liderança recebe o A-PERDA ao gravar. Ao lado, o acumulado do turno (refugo, reprocesso, sobrepeso médio e blocos acima do limite) e os blocos com quem apontou, motivo, observação e "Corrigir" |

O doc 16 não tem linha própria para o Sobrepeso no §1: a tela aparece no §3 junto com o Hora x Hora. O job da terceira linha vem da etapa 3 do mapa do turno no doc 04 ("registrar produção e qualidade hora a hora, saber se está na meta") e do RM-03.

## 5. Verificação

- **Onde.** A frente verificou só no `next dev` compartilhado (porta 3100). Esse servidor ficou instável durante a v0.5: passou cerca de 40 min sem responder enquanto as quatro frentes capturavam ao mesmo tempo (`c-turno-lideranca.md`) e depois entrou em laço de erro, com o cache do Turbopack corrompido, até ser reiniciado (`d-consultas.md`).
- **O que este relatório não registra.** Não há resultado das capturas da própria frente. Faltam as medidas de rolagem horizontal, erros de console, alvos de toque e tamanho de texto do Hora x Hora e do Sobrepeso nos três tamanhos, e a lista do que as imagens mostraram. Também não ficou registrado o resultado do typecheck e do Biome da frente. O código é um commit só (`a34a4a3`), sem ajustes posteriores vindos de capturas.
- **Verificação completa.** É a rodada final da suíte Playwright (`app/e2e/telas.spec.ts`) contra o build de produção, feita por quem orquestra e consolidada no doc 17. As duas rotas já estão em `TELAS`, com o operador (104233), nos projetos notebook, iPad paisagem, iPad retrato e iPad WebKit. A suíte confere título visível, rolagem horizontal, erros de console e violações sérias ou críticas do axe e, no toque, alvos de 44 px ou mais e texto de 13 px ou mais. Cada tela anexa a captura inteira para a revisão visual.
- **Fora da suíte.** A suíte abre cada tela e mede; não aponta, não corrige, não avança o relógio e só entra como operador. Ficam para conferir à mão: apontar abaixo da meta (motivo e foco no erro), corrigir uma hora no iPad (o card do topo rola e recebe o foco), o card "Só leitura" da Gerência e da Especialista, a Supervisão apontando pela tarefa do operador, o aviso do A-PERDA e o modo escuro.

## 6. O que faltou no contrato

Nenhum comentário do código da frente fala em contrato, falta ou TODO. O que o código contorna com helper local, ou o contrato não cobre:

- **Tarefa para a Supervisão.** O contrato manda achar a tarefa com `useMinhasTarefas()` filtrando por `templateId`. Mas os templates `hora-x-hora` e `sobrepeso` são só da Operação (`perfis: ["operacao"]` no seed), e a Supervisão também aponta (doc 05 §4). Os helpers locais `useTarefasDaHora` (`hora-x-hora.tsx`) e `useTarefasDePerdas` (`sobrepeso.tsx`) resolvem: sem a tarefa na própria rotina, a tela usa `useTarefas(postoId, "operacao")` e a Supervisão conclui a do operador. Como `apontarHora` e `apontarPerdas` usam o posto do tablet, a Supervisão só aponta pelo posto onde o tablet está. Sugestão para a fundação: um `useTarefasDoModulo(templateId)` com essa regra.
- **Posto sem a tarefa.** Os dois templates só existem nos postos de Embalagem da Bis 2 (`EMBALAGEM_BIS2`). `useSerieDoTurno` monta as oito horas para qualquer posto, então num tablet de outro posto o Hora x Hora mostra o card e, ao gravar, recusa com "A tarefa da hora das 07:00 não está neste posto." No Sobrepeso, a lista fica vazia e o card diz "Tudo apontado". A série, ou o menu, precisa saber quais postos apontam.
- **Motivo e detalhe num campo só.** `ApontamentoHora` tem só `motivo?: string`. A tela junta o motivo da lista e o texto livre ("Setup: troca de faca", "Outro: …") com `juntarMotivo` e separa de volta, para corrigir, com `separarMotivo` (`hora-x-hora/_components/formato.ts`). Na meta, o detalhe escrito também vai para `motivo`. Quem lê o apontamento em outra tela recebe a frase inteira. Sugestão: motivo da lista e observação em campos separados, como já é em `ApontamentoPerdas`.
- **Início do bloco de perdas.** `apontarPerdas` grava em `bloco` a abertura da tarefa (`tarefa.abre`), que é 1 h depois do início do bloco de produção (janela `inicioMin: 60` do template). No Hora x Hora, `bloco` é o início da hora. Para mostrar "06:00–08:00", a tela usa o helper local `inicioDoBloco` e `rotuloDoBloco` (`sobrepeso/_components/formato.ts`), que lê a janela do template em `localRepository.templates()`. O mesmo valor chega ao alerta: o A-PERDA diz "na hora das 07:00" para o bloco que a tela chama de 06:00–08:00. Sugestão: gravar o início do bloco de produção ou ter uma função de domínio para ele. O RM-03 fala em apontamento por hora e o seed tem blocos de 2 h; a tela segue o seed.
- **Resumo das perdas.** O contrato tem `useSerieDoTurno` e `resumoDaSerie` para o Hora x Hora, mas nada equivalente para as perdas. A tela lê `apontamentosPerdas` direto do store e soma no componente (refugo, reprocesso, sobrepeso médio, blocos acima do limite). A regra "acima do limite" (`refugoKg > LIMITE_REFUGO_KG || sobrepesoG > LIMITE_SOBREPESO_G`) se repete no card, na lista e no acumulado, além da regra A-PERDA do domínio. Sugestão: `resumoDasPerdas`, `acimaDoLimite(apontamento)` e `usePerdasDoTurno()` na fundação.
- **Correção sem versão.** `apontarHora` e `apontarPerdas` substituem o apontamento pelo id da tarefa. Depois de corrigir, autor e hora passam a ser de quem corrigiu e o valor anterior some. O doc 04 pede "correção com versão"; a tela mostra quem apontou antes da correção, mas não guarda o histórico.
- **Falhas da hora no MTBF.** O MTBF só lê `?equipamento=`. Os links "N falhas" e "Abrir MTBF" abrem a tela sem a hora, e a pessoa procura as falhas na linha do tempo do turno. Um `?hora=` no MTBF fecharia o caminho do job P1.
