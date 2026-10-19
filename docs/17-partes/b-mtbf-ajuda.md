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
| Tempo da falha em segundos | "desde 08:12 · 14 min", no minuto do relógio único | `useAgora` anda por minuto; um timer por bloco quebraria a regra do relógio único (regras do código) |
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
| Sheet com o estado de quem saiu | Card e botão remontam com `key={usuarioId}` (o "aberto" e o texto) | Regra de dispositivo compartilhado (regras do código) |

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

PREENCHER

## 5. O que faltou no contrato ou ficou em aberto

PREENCHER
