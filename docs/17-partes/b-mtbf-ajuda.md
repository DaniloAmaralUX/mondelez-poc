# 17 · Parte B: MTBF e pedido de ajuda

Frente B da v0.5 (contrato em `docs/16a`). Duas entregas: a tela MTBF e o pedido de ajuda a partir do card da sidebar.

## 1. Telas e arquivos

| Entrega | Onde | Template de referência |
| --- | --- | --- |
| MTBF (RM-05, RN-06, RN-07) | `/dashboard/mtbf` · `app/src/app/(main)/dashboard/mtbf/**` | Infrastructure (cabeçalho + cards de grupo) |
| Pedido de ajuda (RF-14) | `SupportCard` da sidebar (`_components/sidebar/support-card.tsx`) e `_components/ajuda/**` | SupportCard + Sheet do template (mesmo padrão do "Registrar desvio") |

Arquivos novos:

- `mtbf/page.tsx`: Server Component com `Suspense` (a tela lê `?equipamento=`).
- `mtbf/_components/mtbf.tsx`: `<SoComPermissao recurso="apontamentos">`, cabeçalho Large Title e composição por largura.
- `mtbf/_components/grade-de-falhas.tsx`: seletor de equipamento e grade de tipos de falha (abrir, encerrar, desfazer).
- `mtbf/_components/indicadores-do-turno.tsx`: falhas, parado, MTBF, em curso, maior parada e aviso A-REPET.
- `mtbf/_components/linha-do-tempo.tsx`: faixa de 8 h com as paradas e lista das falhas.
- `mtbf/_components/pareto-de-falhas.tsx`: barras por quantidade com a linha do % acumulado (recharts via `components/ui/chart`).
- `mtbf/_components/use-equipamento.ts`: equipamento escolhido em `?equipamento=`.
- `_components/ajuda/pedir-ajuda.tsx`: Sheet do pedido (`PedirAjuda`).
- `_components/ajuda/pedir-ajuda-botao.tsx`: `PedirAjudaBotao`, para o header.
- `_components/ajuda/use-ajuda.ts`: contexto automático, último pedido, situação legível e pedidos abertos da linha.

## 2. MTBF

### Composição por largura útil (`@container/content`)

| Largura | Arranjo |
| --- | --- |
| Notebook (60 rem ou mais) | Grade de falhas (8/12, 4 por linha) e "Turno até agora" (4/12, números 2 × 2) lado a lado; linha do tempo (7/12) e Pareto (5/12) embaixo |
| iPad paisagem (52–60 rem, sidebar aberta) | Grade primeiro, na largura toda, 4 por linha; números numa faixa de 4; linha do tempo e Pareto lado a lado |
| iPad retrato (abaixo de 52 rem) | Coluna: grade com 3 por linha (2 no Split View), números em faixa de 4, linha do tempo, Pareto |

A ordem do DOM é a ordem visual em todos os arranjos (sem `order-*`).

### Decisões

| Antes | Depois | Por quê |
| --- | --- | --- |
| Infrastructure: título, selos e tabelas de ambientes em cards | Título Large Title (sobretítulo com turno e posto), cards brancos de grupo: apontar falha, turno até agora, linha do tempo, Pareto | Mesmo esqueleto do template (cabeçalho + cards por grupo), com o conteúdo do MTBF e o estilo da v0.4 (doc 14) |
| Equipamento escolhido só no estado da tela | `?equipamento=` com `history.replaceState`, como a seleção de Alertas | Recarregar volta à mesma máquina e o pedido de ajuda, que fica na sidebar, sabe de qual equipamento se fala sem estado compartilhado novo |
| Abrir sempre no primeiro equipamento | Sem escolha na URL, abre no equipamento com falha em curso | Quem volta à tela veio encerrar a parada da máquina parada |
| Bloco com um botão "Resolvido" separado | O bloco inteiro é o botão; em curso, ele mostra o tempo correndo e o selo "Resolvido" dentro dele | Um alvo grande só (96 px no notebook, 112 px no toque), sem botão dentro de botão; o segundo toque e o "Resolvido" são o mesmo gesto |
| Cor de acento em tudo | Âmbar só para "parado" (bloco em curso, faixas da linha do tempo, barras do Pareto, número "Em curso"); roxo só no selecionado do equipamento | Um acento por tela e cor só para o anormal (ISA-101) |
| Aviso de desfazer por 5 min (`JANELA_APAGAR_FALHA_MS`) | Aviso de 10 s (`JANELA_DESFAZER_MS`) com "Desfazer"; depois disso, "Desfazer" na linha da falha na lista do turno, para quem apontou, até 5 min | Mesmo padrão da Minha Rotina (aviso de 10 s + "Feitas"): um aviso de 5 min cobriria a tela; a janela do store continua valendo pela lista (WCAG 2.2.1) |
| Encerrar com desfazer | Encerrar sem desfazer, com aviso da duração | O contrato não tem ação para reabrir uma falha (ver §5) |
| Tempo da falha em segundos | "desde 08:12 · 14 min", no minuto do relógio único | `useAgora` anda por minuto; um timer por bloco quebraria a regra do relógio único (app/CONVENCOES.md) |
| Legenda do gráfico em caixa | Número em cima de cada barra e % em cada ponto da linha; descrição do card diz o que é barra e o que é linha | Legenda direta (dataviz); altura fixa de 256 px para o card não pular |
| Eixo do Pareto com nomes cortados | Rótulo em até duas linhas ("Ajuste de / temperatura") | Os tipos têm 2–3 palavras e não cabem numa só |
| Gerência e Especialista com os blocos desabilitados | Blocos sem botão (só a situação), título "Falhas por tipo" e subtítulo dizendo quem aponta | Controle desabilitado sem explicação não serve; quem só lê não precisa de alvo |

### O job resolvido

"Quando a máquina falha, quero apontar o tipo de falha num toque, para o MTBF sair certo sem eu calcular nem anotar depois." Um toque no tipo abre a falha com a hora do relógio; o segundo encerra; os números do turno, a linha do tempo e o Pareto se refazem sozinhos. Toque errado tem desfazer. Quando um tipo se repete 3 vezes (`LIMITE_REPETICAO`), o card avisa que a liderança já recebeu o A-REPET: o operador não precisa ligar para ninguém por isso.

## 3. Pedido de ajuda

| Perfil | O que o card da sidebar mostra |
| --- | --- |
| Operação | "Precisa de ajuda?" com "Pedir ajuda". Depois do envio: motivo, hora e texto do pedido, e a situação: "Enviado, aguardando a liderança", "Visto por Renata às 08:05" ou "Atendido por Renata às 08:20", com a resposta quando houver; o botão vira "Pedir ajuda de novo" |
| Supervisão, Gerência, Especialista | Quantos pedidos estão abertos na linha; com um, "Ver o pedido" abre o alerta A-AJUDA direto (`?alerta=`); com mais, "Ver nos alertas" |
| Assistência | O texto de antes (não pede nem trata) |

O Sheet do pedido: motivo em chips grandes (`MOTIVO_AJUDA`, 64 px no toque, 2 por linha), texto curto obrigatório (`LIMITES.justificativa`), e um bloco "Vai junto com o pedido" com o posto, a tela e o equipamento. Validação no envio, erro junto do campo e foco no primeiro erro; nada de botão desabilitado.

### Decisões

| Antes | Depois | Por quê |
| --- | --- | --- |
| Card só com texto ("chame a supervisão ou use o Teams") | Card é o ponto do pedido, com a situação depois do envio | Doc 10 já mapeava o pedido de ajuda no SupportCard; a situação no mesmo lugar responde "alguém viu?" sem a pessoa procurar |
| Contexto que a pessoa digita | Contexto automático e visível: posto, tela (`usePathname`), equipamento no checklist (rascunho ou tarefa, com a tarefa) e no MTBF (`?equipamento=`) | Ninguém digita o que o tablet já sabe, e quem pede vê o que vai junto |
| `origem` com a rota (`/dashboard/mtbf`) | `origem` com o nome da tela ("MTBF", "Checklist PPLI e Centerlining") | O alerta A-AJUDA escreve "Pedido feito na tela {origem}."; com a rota, a liderança leria um caminho de URL |
| Sheet inferior | Sheet à direita que encolhe acima do teclado, sem o X do canto, Cancelar e Pedir ajuda no rodapé com 16 px entre eles | Mesmo padrão do "Registrar desvio" (v0.3): um Sheet inferior ficaria sob o teclado do iPad |
| Situação só em cor | `Status` do template com texto ("Visto por …"), `STATUS_LEGIVEL` e região `aria-live` | Cor não pode ser a única pista; o leitor de tela anuncia quando a liderança vê |
| Sheet com o estado de quem saiu | Card e botão remontam com `key={usuarioId}` (o "aberto" e o texto) | Regra de dispositivo compartilhado (app/CONVENCOES.md) |

### Jobs resolvidos

- Operador, "Quando peço ajuda, quero saber que alguém viu": o card mostra "Visto por Renata às 08:05" assim que a supervisão assume o alerta, e "Atendido" com a resposta quando resolve (`situacaoDoPedido`).
- Supervisão, "Quando um operador pede ajuda, quero ver o pedido junto do contexto": o card conta os pedidos abertos e leva ao alerta A-AJUDA, que traz motivo, texto, posto, equipamento e a tela de origem.

### `PedirAjudaBotao` (para o header)

```tsx
import { PedirAjudaBotao } from "../_components/ajuda/pedir-ajuda-botao"; // a partir de dashboard/layout.tsx: "./_components/ajuda/pedir-ajuda-botao"

<PedirAjudaBotao />            // botão de ícone fantasma (LifeBuoy), como as utilidades do header
<PedirAjudaBotao comRotulo />  // ícone + "Pedir ajuda"
```

Abre o mesmo Sheet do card. Só renderiza para a Operação (nada para os outros perfis), já remonta por pessoa e aceita `className` (ex.: `className="lg:hidden"` para aparecer só quando a sidebar vira Sheet).

## 4. Verificação

- **Estático.** Rodado ao fechar este relatório (19/10), dentro de `app/`, só leitura; os arquivos da frente estão como no commit `88895d7`. `npx tsc --noEmit`: nenhum erro, no projeto inteiro. `npx biome check` em `mtbf/`, `_components/ajuda/` e `sidebar/support-card.tsx`, sem `--write`: 11 arquivos, nenhum erro, aviso ou informativo.
- **Testes.** A frente não escreveu testes. As contas que a tela mostra (MTBF, falha aberta contando até agora e parando no fim do turno, Pareto, maior parada, repetição, A-REPET, A-AJUDA e a situação do pedido) são do domínio da fundação e têm teste em `domain/__tests__/producao-falhas.test.ts`, que não foi rodado nesta revisão.
- **Na tela, só o `next dev` compartilhado.** A frente verificou apenas no servidor de desenvolvimento da porta 3100, que ficou fora do ar parte da v0.5 (o que houve com ele está na frente D, §5). Foram seis rodadas de captura com o Chrome headless (`%TEMP%/v05b`, scripts `mtbf.mjs` e `fluxo.mjs`, entre 10:52 e 12:33) e nenhuma chegou à tela do MTBF: as quatro primeiras pararam no login (tempo de espera esgotado ou página recarregada no meio da espera); a quinta entrou como operador (104233) depois de ~14 min, mas a grade de falhas não apareceu; a sexta parou num erro do Turbopack (`Could not parse module '[project]/node_modules/next/dist/client/app-next-turbopack.js', file not found`), com o login sem hidratar. A última mensagem da frente foi justamente que o servidor dava erro do Turbopack. As imagens que ficaram (`shots/r1` a `r6`) são todas do login.
- **O que isso quer dizer.** Não há registro da tela do MTBF nem do pedido de ajuda funcionando. Este relatório não afirma rolagem horizontal, console limpo, alvos de 44 px, texto de 13 px nem aparência nos três tamanhos: a composição da §2 é a do código (container queries de 52 e 60 rem), não de imagens conferidas.
- **Verificação completa.** É a rodada final da suíte Playwright (`app/e2e/telas.spec.ts`) contra o build de produção, consolidada no doc 17. Desta frente, a suíte abre `/dashboard/mtbf` como operador nos quatro projetos do `playwright.config.ts` (notebook, iPad paisagem, iPad retrato e iPad no WebKit) e confere título, rolagem horizontal, console, axe e, no toque, alvos de 44 px e texto de 13 px. Ela não cobre, e isso pede uma passada à mão depois:
  - o MTBF da Supervisão (que aponta) e o de leitura (Gerência e Especialista);
  - os fluxos: abrir, encerrar, desfazer pelo aviso e pela lista, aviso de A-REPET na 3ª falha do mesmo tipo;
  - o Sheet do pedido (erro junto do campo, foco no primeiro erro, Sheet acima do teclado) e o botão do header;
  - o card da sidebar: a suíte mede toque e roda o axe só dentro de `[data-slot=sidebar-inset]`, e a sidebar fica fora dele.

## 5. O que faltou no contrato ou ficou em aberto

### Faltou no contrato

- **Reabrir uma falha.** `encerrarFalha` não tem volta: não há `reabrirFalha`. Um segundo toque sem querer encerra a parada, e a única saída é abrir outra, que conta como falha nova (uma parada vira duas no MTBF e no Pareto, e a terceira do mesmo tipo dispara o A-REPET). Por isso o encerramento não tem "Desfazer" (§2). Sugestão para a fundação: `reabrirFalha(falhaId)`, só para quem encerrou e dentro de `JANELA_DESFAZER_MS`, apagando `fim` e `encerradaPor`.
- **Falha aberta na virada do turno.** `useFalhasDoTurno` só traz as falhas do `turnoChave` atual, e nada encerra uma falha no fim do turno. Uma falha aberta às 13:50 e esquecida some da tela às 14:00 (ninguém mais a encerra), não conta como parada no turno seguinte e ainda bloqueia o mesmo tipo no mesmo equipamento: `abrirFalha` procura falha aberta em todos os turnos e recusa, e a tela mostra "Não foi possível apontar · Confira se o tablet está desbloqueado". Visto na leitura do código, não reproduzido na tela. Sugestão para a fundação: decidir a regra da virada (encerrar no fim do turno e reabrir no seguinte, ou levar a falha aberta para o turno novo contando a partir do início dele) e aplicar a mesma regra no hook e no `abrirFalha`.
- **Falhas ao mesmo tempo.** `indicadoresDeFalha` soma a duração de cada falha. Duas abertas juntas (dois tipos no mesmo equipamento, que a grade e o `abrirFalha` permitem, ou duas Loeschpacks do posto paradas ao mesmo tempo) contam o tempo parado duas vezes, e o MTBF do posto cai mais do que o posto parou (`minutosOperando` só não fica negativo porque é limitado a zero). A RN-06 não diz se o parado é a união dos intervalos nem se o MTBF é por equipamento ou por posto; o card "Turno até agora" mostra o posto inteiro, como o relatório e a troca de turno. Sugestão para a fundação: fechar isso na RN-06 e decidir se abrir um segundo tipo no mesmo equipamento troca a causa da parada ou é recusado.
- **Corrigir uma falha.** Passados os 5 min de `apagarFalha`, não há como corrigir tipo, equipamento, início ou fim. Quem esquece de tocar quando a máquina volta deixa a falha correndo até o fim do turno (e cai na virada acima); quem toca tarde fica com a hora errada. Sugestão para a fundação: `corrigirFalha(falhaId, { tipoId?, inicio?, fim? }, motivo)` para a Supervisão, com autor e hora da correção.
- **Tipos de falha por equipamento.** `tiposFalha()` é uma lista só, a da envolvedora (Enrosco, Troca de bobina, Ajuste de mordente…). No posto Processo, a Temperadeira e o Túnel de resfriamento mostrariam os mesmos oito tipos; a demonstração não chega lá porque o tablet é da Embalagem. Sugestão para a fundação: tipos por equipamento ou por família de máquina (`tiposFalha(equipamentoId)`).
- **Motivo da recusa.** `abrirFalha`, `encerrarFalha`, `apagarFalha` e `pedirAjuda` devolvem `undefined` ou `false` sem dizer por quê (tablet bloqueado, sem permissão, falha já aberta, janela vencida, outra pessoa). A tela adivinha ("Confira se o tablet está desbloqueado", "Só quem apontou apaga, até 5 minutos depois") e erra no caso da virada acima. Sugestão para a fundação: o mesmo retorno de `aceitarTurno` (`{ ok: false, erro }`).
- **Permissão do pedido de ajuda.** O doc 16a diz que todas as ações conferem a permissão, mas `pedirAjuda` só confere pessoa, bloqueio e posto, e `domain/permissoes.ts` não tem recurso de ajuda. Quem limita à Operação é a tela (card e `PedirAjudaBotao`). Sugestão para a fundação: um recurso `ajuda` (a Operação escreve) conferido na ação.
- **Pedido de ajuda sem rede.** `PedidoAjuda` não tem estado de envio, como os registros do checklist têm (`local`, `erro`): o store grava o pedido e a mensagem do Teams na hora. Sem rede, o aviso da tela diz "Salvo no tablet. A supervisão recebe quando a rede voltar", mas o card mostra "Enviado, aguardando a liderança". Sugestão para a fundação: o estado da fila também no pedido e uma situação "Salvo no tablet" em `situacaoDoPedido`.
- **Cancelar um pedido.** Não há ação para quem pediu retirar o pedido ("já resolvi"); o A-AJUDA fica aberto até a liderança resolver. Sugestão para a fundação: `cancelarPedidoAjuda(pedidoId)`, de quem pediu e enquanto ninguém viu, fechando o alerta com uma nota.
- **Campos sem uso no `PedidoAjuda`.** `vistoPor`, `vistoEm`, `atendidoPor`, `atendidoEm` e `resposta` não são gravados por nenhuma ação: a situação sai do tratamento do alerta A-AJUDA (`situacaoDoPedido`). E o comentário de `origem` diz "rota", enquanto o alerta escreve "Pedido feito na tela {origem}" (por isso a frente manda o nome da tela, §3). Sugestão para a fundação: tirar os campos, ou dizer que são derivados, e corrigir o comentário de `origem` para "nome da tela".
- **Equipamento em foco fora do MTBF.** O contexto da ajuda só sabe o equipamento no checklist e no MTBF. Documentos (frente D) usa o mesmo `?equipamento=` e fica de fora, e o nome do parâmetro está repetido em `_components/ajuda/use-ajuda.ts` e `mtbf/_components/use-equipamento.ts`, porque `_components` não importa de uma rota. Sugestão para a fundação: a constante e um `useEquipamentoEmFoco()` compartilhados, para a ajuda ler o equipamento em qualquer tela que use `?equipamento=`.
- **Pedidos das outras linhas.** O card da liderança conta só os pedidos da linha do tablet, porque `useAlertas` só deriva essa linha (o mesmo ponto da frente C). Sugestão para a fundação: `useAlertas(linhaId?)` ou um hook de pedidos abertos da planta.

### Em aberto

- **Último pedido só do turno.** O card mostra o último pedido da pessoa no turno atual (`useUltimoPedido`, helper da frente). Um pedido das 13:50 ainda aberto some do card às 14:00 (continua em Alertas), e com dois pedidos só o último aparece. Com um hook de pedidos da pessoa na fundação, o card passa a mostrar os abertos de qualquer turno.
- **Janela de apagar escrita à mão.** "até 5 minutos" está no texto dos avisos em `grade-de-falhas.tsx` e `linha-do-tempo.tsx`; deve sair de `JANELA_APAGAR_FALHA_MS`, para não mentir se a fundação mudar a janela.
- **MTBF → Documentos.** A IT-EMB-021 manda apontar a falha no MTBF e a IT-EMB-014 é a do tipo "Troca de bobina", mas o MTBF não leva a nenhuma delas. O link `/dashboard/documentos?doc=<id>&equipamento=<id>` já está pronto (frente D, §7).
- **Botão do header.** `PedirAjudaBotao` entrou no `dashboard/layout.tsx` (commit `06a86fb`) sem `className`, então aparece em todas as larguras, também ao lado do card no notebook. Se a intenção é só quando a sidebar vira Sheet, basta `className="lg:hidden"`; fica a decisão de quem orquestra.
