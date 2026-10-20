# 20b · v0.7: tema Mondelēz refeito (campo roxo refinado)

O tema da v0.6 (doc 19) aplicava a marca em tudo: creme no fundo, sidebar roxa, título roxo, bege nos controles. No uso, a tela ficava pesada e datada, e o roxo deixava de marcar a ação principal porque estava em todo lugar. A v0.7 refaz o tema com outra regra: **a marca forte num lugar só, o resto quieto e preciso**.

- O campo roxo da sinalização da Mondelēz (#4F2170, a cor do logo) fica no **painel do login**, vivo.
- A **sidebar é preta**, no desenho da guia do YouTube e do YouTube Music, com o logo em branco.
- O conteúdo é **branco e cinza neutro**, com o roxo só na ação principal, no item selecionado e no foco.
- O **modo escuro** segue o YouTube Music: fundo quase preto, cards em #121212 e o brilho da marca atrás do título.

Referências de acabamento: Jakub Krehel ("Details that make interfaces feel better") para superfícies, raio, sombra e tipografia; Emil Kowalski (animations.dev) para movimento; YouTube e YouTube Music (Mobbin) para a sidebar, o hero e o escuro.

## 1. O que mudou em relação à v0.6

| Lugar | v0.6 | v0.7 | Por quê |
| --- | --- | --- | --- |
| Fundo da tela | creme #FAF3E7 | branco com um traço do creme (`oklch(0.984 0.002 81.3)`) | o creme puro deixava cinzas e bordas bege; o traço mantém o calor sem sujar |
| Cinzas (secundário, muted, borda, campo) | bege, croma do creme | neutros, croma 0 | controles e divisórias não competem com a marca |
| Sidebar | roxa | preta (#0f0f0f), itens no desenho da guia do YouTube | o roxo em área grande cansava e tirava o peso da ação principal |
| Título de tela | roxo, fonte de título | cor do texto, fonte de título | um acento por tela: o roxo fica para a ação |
| Login | card no creme, painel roxo estático | página branca sem card, painel roxo com luz, título e frase em movimento | a entrada é o lugar da marca forte |
| Início do turno (Minha Rotina) | título e ações rápidas | título sobre o brilho da marca e atalhos em chips | o hero do YouTube Music: a marca como luz, não como bloco de cor |
| Escuro | roxo escuro como acento | fundo #030303, cards #121212, acento lilás claro com texto roxo | o roxo escuro como texto não chegava a 4,5:1 no escuro |
| Movimento | press somado (0,94), curvas do tema sobrescrevendo as do Tailwind | um vocabulário só (§6) | achados da auditoria `docs/auditorias/v0.7-emil.md` |
| Base dos componentes | estilo do template | preset do shadcn `radix-luma` (base olive), mantidas as decisões do projeto | raios, alturas e foco mais modernos sem trocar a biblioteca |

## 2. Tokens

`app/src/styles/presets/mondelez.css`, em OKLCH. O contraste está medido no comentário do arquivo (WCAG 2, com `culori`).

| Papel | Claro | Escuro |
| --- | --- | --- |
| Fundo | `0.984 0.002 81.3` (branco com traço do creme) | #030303 `0.0969 0 0` |
| Card | branco | #121212 `0.1822 0 0` |
| Popover, secundário | branco / `0.958 0 0` | #212121 `0.2478 0 0` |
| Texto | #262626 `0.2686 0 0` | #f1f1f1 |
| Texto secundário | Cool Grey #666 `0.5103 0 0` | #aaa `0.738 0 0` |
| Borda / campo | `0.915 0 0` / `0.6167 0 0` | branco 10 % / #717171 |
| Ação (primary) | #4F2170 `0.3558 0.1324 307.7`, texto branco | lilás `0.8 0.08 310.4`, texto roxo `0.2799 0.0975 307.7` |
| Foco (ring) | `0.6219 0.0757 310.4` | lilás |
| Sidebar | #0f0f0f, texto #f1f1f1, ativo branco 12 %, hover branco 8 % | #030303 |
| Raio | 10 px (`0.625rem`) | igual |

| Par medido | Claro | Escuro |
| --- | --- | --- |
| texto / card | 15,1 | 16,2 |
| secundário / card | 5,7 | 7,8 |
| secundário / tela | 5,5 | 8,4 |
| texto da ação / ação | 11,8 | 7,9 |
| borda de campo (mín. 3:1) | 3,7 | 3,9 |
| anel de foco (mín. 3:1) | 3,7 | 9,3 |
| gráficos 1–5 / card | 3,5 a 6,6 | 6,9 a 9,0 |

As rampas de estado continuam as da v0.6 (doc 19 §4): Go Green, Golden Wheat, Tasty Red e Cool Blue nas variáveis do Tailwind, com a luminosidade da rampa original.

## 3. Sidebar no desenho do YouTube

`app/src/styles/tema-mondelez.css`, seção da sidebar.

- **Superfície.** Preta e sólida no notebook, com um brilho roxo da marca no pé (radial, baixo). No iPad em retrato vira gaveta de vidro: preto a 88 % com `blur(32px) saturate(150%)`; com "reduzir transparência", sólida.
- **Grupos.** Separados por linha branca a 10 %, rótulo de 13 px em #aaa e peso 500, padding de 10 × 8 px.
- **Itens.** 44 px de altura no notebook, ícone de 24 px com traço 1,6, 24 px entre ícone e texto, texto de 16/24 px, raio de 8 px. Ativo em branco 12 % e peso 500; hover em branco 8 %.
- **"Registrar agora".** Pílula escura (branco 10 %), centralizada, em vez do botão roxo.
- **Logo.** `LogoMondelez cor="texto"` (branco) com o nome do app abaixo; recolhida, só o ícone do app.

## 4. Login

`app/src/app/(main)/auth/login/`.

- **Formulário.** Página branca, sem card. Coluna de até 49 rem (33 rem abaixo de lg), com container queries no formulário; a coluna rola com a barra fina do tema (`.rolagem-discreta`). Título "Entrar no posto", SSO em botão de contorno, divisória "ou com a matrícula", PIN com teclas de 64 px.
- **Painel da marca** (`painel-da-marca.tsx`, a partir de xl, 24 a 36 rem):
  - **Luz.** Raios em lilás claro (#e5d8ef) nascendo do canto de cima à direita, longe do logo (o brand book não quer fundo agitado atrás do logo). Seguem o ponteiro de leve e pulsam no toque. WebGL próprio, sem dependência, com DPR limitado a 1,5; pausa fora da tela e com a aba escondida.
  - **Título.** "A rotina do turno," entra uma vez, palavra por palavra, do desfoque para o nítido. O fim da frase alterna a cada 3,2 s: "feita do jeito certo.", "sem papel na linha.", "mesmo sem rede.", "na hora de cada tarefa." O leitor de tela recebe a frase inteira.
  - **Logo.** Com a assinatura "Snacking Made Right", em branco, sem efeito nenhum.
  - **Legibilidade.** Degradê do roxo escuro da marca (#36174D) na metade de baixo mantém o texto branco acima de 4,5:1 onde a luz passa.
  - **Reduzir movimento.** A luz anda a 35 % e não pulsa; título e frase aparecem sem animação.
- Os componentes de luz e texto vêm do catálogo aberto React Bits (reactbits.dev), copiados para `app/src/components/react-bits/` e ajustados (pausa, DPR, reduzir movimento).

## 5. Início do turno (hero)

`app/src/app/(main)/dashboard/rotina/`.

- **Brilho da marca** (`.ambiente-da-marca`) atrás da saudação, subindo por baixo do cabeçalho de vidro: no claro, roxo a 14 % e Golden Wheat a 12 %; no escuro, roxo a 62 % e Golden Wheat a 26 %, com fade por máscara. As misturas são em `oklab`: em `oklch`, `transparent` não tem matiz e puxava o tom para o rosa.
- **Saudação** em 2 rem (2,5 rem com contêiner de 60 rem ou mais), entrelinha 1,05.
- **Atalhos em chips** (`atalhos-do-perfil.tsx`), como os chips do YouTube Music: as telas do menu do perfil (até 9, sem repetir e sem a Minha Rotina), 36 px no notebook e 44 px no toque, fundo do texto a 6 % (branco a 10 % no escuro). Substituem o bloco "Ações rápidas".
- **Busca do cabeçalho** no desenho do YouTube Music: campo largo de 40 px, raio de 8 px, fundo a 4 % (branco 8 % no escuro). Continua sendo o botão que abre a busca (Ctrl/⌘+J).
- No escuro, o cabeçalho não tem linha embaixo.

## 6. Movimento

`app/src/styles/movimento.css`, a partir da auditoria `docs/auditorias/v0.7-emil.md` (25 achados).

| Token | Valor | Uso |
| --- | --- | --- |
| `--curva-saida` | `cubic-bezier(0.23, 1, 0.32, 1)` | entrar e sair, press |
| `--curva-mover` | `cubic-bezier(0.77, 0, 0.175, 1)` | algo que se desloca na tela |
| `--curva-gaveta` | `cubic-bezier(0.32, 0.72, 0, 1)` | Sheet e sidebar no retrato |
| `--duracao-press` | 140 ms | press, fechar popover e diálogo |
| `--duracao-pop` | 180 ms | abrir popover, menu, select, tooltip |
| `--duracao-painel` | 280 ms | abrir Sheet |
| `--escala-press` | 0,96 | press |

- **Press único.** Botões, toggles e tudo que leva a classe `pressao` (`lib/pressao.ts`) descem a 0,96 no pointerdown, numa regra só. Antes, o tema (0,97) e o utilitário (0,97) se somavam em 0,94. Com "reduzir movimento" fica só a cor, e o botão também não desce 1 px.
- **Tokens com nome próprio.** O tema Apple declarava `--ease-out` e `--ease-in-out`, os mesmos nomes do Tailwind, e mudava a curva de todo utilitário `ease-*`. Saíram.
- **Camadas.** Sheet com curva de gaveta (280 ms para abrir, 200 para fechar); popovers 180/140 ms; diálogos 200/140 ms. A busca aberta por Ctrl/⌘+J não anima: é usada dezenas de vezes por turno.
- **Sem `transition: all`.** Abas, badge, stepper, switch e barra de progresso só transicionam o que muda.
- **Sidebar.** Recolher (também por Ctrl/⌘+B) não anima mais a largura: cada quadro refazia as container queries da tela inteira.
- **Números.** O NumberFlow passa de 900 ms para 280 ms (`lib/numero.ts`). Valores que só mudam por navegação (meta do turno, durações) não animam.
- **Atenção.** O ponto do status de envio só pulsa enquanto envia (sem rede e erro ficam parados). Tarefa atrasada pulsa três vezes e para.
- **Rolagem.** `scrollIntoView` suave só sem "reduzir movimento".

## 7. Arquivos

| Arquivo | Conteúdo |
| --- | --- |
| `app/src/styles/presets/mondelez.css` | tokens claro e escuro, rampas de estado, contraste medido |
| `app/src/styles/tema-mondelez.css` | fontes, sidebar do YouTube, brilho da marca, busca, barra de rolagem discreta |
| `app/src/styles/tema-apple.css` | acabamento por `data-slot` (apple e mondelez), sem press nem curvas |
| `app/src/styles/movimento.css` | vocabulário de movimento e press único |
| `app/src/components/react-bits/*` | luz e texto do painel do login |
| `app/src/app/(main)/auth/login/*` | layout, página e painel da marca |
| `app/src/app/(main)/dashboard/rotina/*` | hero, saudação, atalhos |
| `app/components.json`, `app/src/components/ui/*` | preset `radix-luma` do shadcn |

## 8. Verificação

- `tsc --noEmit`, Biome nos arquivos alterados e 224 testes unitários.
- Capturas em notebook (1.440 × 900), iPad paisagem e retrato, claro e escuro, no build de produção.
- Movimento conferido no app: escala ativa 0,96, transição de 140 ms com `--curva-saida`, sidebar sem transição de largura.
- Suíte Playwright completa (axe, toque, rolagem, console) no build de produção depois do preset, do tema e do movimento: **121 de 121** (5 perfis × telas × notebook, iPad paisagem, iPad retrato e iPad WebKit).

## 9. Em aberto

- Aprovação do time de marca da Mondelēz para o painel do login com luz em movimento e para a sidebar preta.
- O preset do shadcn trouxe a Raleway como `--font-sans` (sem pré-carga). No tema Mondelēz vale a pilha da marca (doc 19 §5), conferida nas capturas.
