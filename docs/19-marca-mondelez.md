# 19 · v0.6: marca Mondelēz International no protótipo

O protótipo passa a ter cara de produto interno da Mondelēz International. O acabamento da v0.4 (doc 14) continua: hierarquia por superfície e sombra, toque, movimento e tipografia por tamanho. A marca fica por cima, como um tema do template (`mondelez`), e vira o padrão.

> **Atualizado na v0.7 (doc 20b).** Logo, nome, assinatura, fontes, rampas de estado e PWA continuam como aqui. Mudaram: o fundo (branco com um traço do creme, cinzas neutros), a sidebar (preta, no desenho do YouTube), o título de tela (cor do texto, não roxo), o login (página branca e painel roxo com luz em movimento) e o escuro (no desenho do YouTube Music). As tabelas dos §4 e §6 abaixo registram a v0.6.

## 1. Fontes

| Fonte | O que usamos |
| --- | --- |
| Logos oficiais na pasta do projeto (`MONDELEZ POC/branding/MDLZ_Logo`: RGB, Black, Reversed, CMYK, .ai e .png) | logo vetorial, cor do logo (#4F2170) |
| Asset library da Mondelēz (`MDLZ_SMR_Logo.zip`: logo com a assinatura, inclusive "Over Purple") | logo com "Snacking Made Right" e o campo roxo |
| Brand book MDLZ 2019 (SlideShare) | propósito, valores, voz, regras do logo, paleta, tipografia, ilustração, sinalização |
| Site mondelezinternational.com | cores mais usadas (#4F2170, #724D8D, #36174D, #E18719, #287819, #FAF3E7, #A52323), fontes (Calibri, MDLZ Bite Type, Bw Surco) |
| Método de estratégia de marca e de sistema de cores (rampas, papéis e contraste medido); documentação oficial do Tailwind v4 (theme variables), `next/font` e metadata e manifest do Next 16 | método, tokens, contraste, implementação |

## 2. Estratégia de aplicação

- **Papel da marca no app.** É uma ferramenta interna de fábrica: a marca assina o produto e organiza a cor, sem virar campanha. O operador vê a Mondelēz no login, na sidebar e no documento do registro. Nas tarefas, o roxo marca só a ação principal (um acento por tela, como na v0.4).
- **Voz.** O brand book define a voz como simples, autêntica, calorosa e divertida. No chão de fábrica, a parte divertida fica de fora: frases curtas, no imperativo, sem jargão de TI. O título do login conversa com a assinatura: "A rotina do turno, feita do jeito certo." ("Snacking Made Right").
- **Nome.** A empresa aparece sempre com o mácron e completa, "Mondelēz International", nos textos do app (`APP_CONFIG.company`, título das páginas, rodapé do login) e no nome acessível do logo. O app continua "Rotinas Operacionais": é uma iniciativa interna, não uma marca de produto.
- **Assinatura.** "Snacking Made Right" só aparece junto do logo, na versão oficial com assinatura. O brand book reserva essa versão à comunicação interna, que é o caso deste app. Ela só é usada no painel do login, a partir de 288 px (o mínimo é 264 px, ou 2,75 pol.).
- **Ícone do app.** O brand book pede que logos de iniciativas internas usem formas "(im)perfeitas" e desenho de linha branco. O ícone (`MarcaDoApp`, PWA, apple-icon) mantém o glifo de checklist em linha branca sobre o roxo do logo. No tema Mondelēz, ele ganha a forma arredondada levemente irregular que lembra as gotas do logo.

## 3. Logo

Componentes em `app/src/components/marca/`:

| Componente | Origem | Uso |
| --- | --- | --- |
| `LogoMondelez` | `MDLZ Logo RGB.ai` vetorizado com mupdf (25 traçados, sem redesenho) | sidebar, card do login abaixo de xl, tela sem rede, folha do registro |
| `LogoMondelezAssinatura` | `MDLZ SMR Logo RGB.ai` (42 traçados) | painel roxo do login |

Regras garantidas no código:

- **Cor.** Só as cores dos arquivos oficiais: roxo #4F2170 sobre fundo claro, branco sobre roxo ou fundo escuro, e preto. O tema escuro troca o roxo pelo branco (`dark:hidden` / `dark:block`). `cor="texto"` herda a cor do texto e só é usado na sidebar, onde ela é branca (tema Mondelēz) ou quase preta (tema Apple).
- **Proporção e efeitos.** A proporção é travada pelo `viewBox`. Não há contorno, sombra, rotação nem fundo atrás do logo.
- **Tamanho mínimo.** `LARGURA_MINIMA` = 96 px (1 pol.) e `LARGURA_MINIMA_ASSINATURA` = 264 px (2,75 pol.), aplicados como `min-width` no próprio SVG. Larguras usadas: sidebar 128, login 160 ou 288, folha do registro 144, tela sem rede 112.
- **Área de proteção.** Pelo menos a largura do "o" em volta. O padding de cada lugar garante isso: p-12 no painel, py-1 + px-3 na sidebar.
- **Texto.** "International" nunca é removido e o "ē" faz parte do desenho. Nada de ™ ou ®.

## 4. Cor

Primitivas da marca, em OKLCH, conferidas com `culori` (OKLCH a partir do hex oficial, contraste WCAG medido):

| Papel | Marca | Hex | OKLCH |
| --- | --- | --- | --- |
| Acento, sidebar, logo | MDLZ World (escuro) | #4F2170 | 0.3558 0.1324 307.7 |
| Gráfico 1, foco | MDLZ World | #724D8D | 0.4879 0.1069 309.6 |
| Fundo | creme do site | #FAF3E7 | 0.9663 0.0176 81.3 |
| Texto | cinza do site | #262626 | 0.2686 0 0 |
| Texto secundário | Cool Grey | #666666 | 0.5103 0 0 |
| Erro | Tasty Red | #A52323 | 0.4735 0.1663 26.4 |
| Ok | Go Green | #287819 | 0.5047 0.1493 140.9 |
| Atenção | Golden Wheat | #E18719 / #EAAB5E | 0.704 0.154 63.3 |
| Info | Cool Blue | #2D6EAA | 0.5258 0.1154 249.5 |

**Rampas de estado.** As telas usam as cores do Tailwind (`text-green-700`, `bg-amber-500`, `text-red-400`...), mais de 300 ocorrências em arquivos de várias frentes. Em vez de editar cada uma, o preset redefine as variáveis `--color-{green,emerald,lime,teal,red,rose,amber,orange,yellow,blue,sky,cyan,indigo,violet,purple}-{50…950}`. O Tailwind v4 gera os utilitários como `var(--color-…)`, então a troca vale para tudo (documentação do Tailwind v4: theme variables, sem `inline`). Cada degrau mantém a **luminosidade** da rampa do Tailwind, para que os pares de contraste já medidos continuem valendo, e recebe o **matiz e a saturação** da cor da marca, interpolados entre os tons oficiais. A cor oficial ocupa o degrau de luminosidade mais próxima: green-700 = #287819, red-800 = #A52323, amber-500 = #EAAB5E, yellow-500 = #E6AF23, blue-600 = #2D6EAA, violet-700 = #724D8D, violet-900 = #4F2170. Os gráficos (`--chart-1…5`) seguem a ordem roxo, Golden Wheat, Cool Blue, Go Green e Cocoa Brown.

**Contraste medido** (pares de token declarados; `docs/assets/v0.6` tem as capturas):

| Par | Claro | Escuro |
| --- | --- | --- |
| texto / fundo | 13,7 | 17,5 |
| texto / card | 15,1 | 16,0 |
| secundário / fundo | 5,2 | 8,7 |
| secundário / card | 5,7 | 7,9 |
| secundário / muted | 4,9 | 6,8 |
| branco / roxo da ação | 11,8 | 4,9 |
| erro / card | 7,3 | 5,7 |
| texto da sidebar / sidebar | 11,8 | 15,3 |
| secundário da sidebar (lilás sólido) / sidebar | 6,8 | 9,2 |
| green-700 / card | 5,5 | — |
| amber-700 / card | 4,9 | — |

Notas:

- **Roxo como texto no escuro.** Sobre o card escuro, o roxo da ação dá 3,6:1, abaixo de 4,5:1. Por isso o título de tela é roxo só no tema claro; no escuro fica no creme.
- **amber-700 sobre o creme.** Dá 4,4:1, abaixo de 4,5:1 para texto pequeno. Nas telas atuais esse texto fica sobre cards brancos (4,9:1) ou sobre `bg-amber-50`. Se aparecer direto no fundo, é achado para corrigir.

## 5. Tipografia

- **Pilha.** Texto: `"Bw Surco", Calibri, Carlito, system-ui`. Título de tela (`h1`): `"MDLZ Bite Type"` antes da mesma pilha.
- **Fontes proprietárias.** Bw Surco e MDLZ Bite Type são da Mondelēz. O projeto não copia os arquivos: o `@font-face` só aponta para `local()`. Num computador da Mondelēz com as fontes instaladas, a interface usa as fontes da marca. Fora dele, usa Calibri (Windows) ou Carlito.
- **Carlito.** É a versão aberta (SIL OFL) com as métricas da Calibri, a alternativa que o brand book indica para web. Entra por `next/font/google`, com pré-carga: é o que os tablets Android e o iPad mostram. A Inter do tema Apple saiu da pré-carga.
- **`font-size-adjust: ex-height 0.5`.** A Calibri tem o "x" mais baixo que a Inter (0,47 contra 0,55). Sem o ajuste, todo o texto encolheria uns 15 % e as medidas de toque e legibilidade dos docs 12–14 deixariam de valer.
- **Tracking.** -0,008em nos títulos, contra -0,021em do tema Apple: Calibri e Surco já são justas. Os títulos de tela ficam em peso 700 e no roxo da marca, como nos materiais da Mondelēz.

## 6. Onde a marca aparece

| Lugar | Antes | Depois | Por quê |
| --- | --- | --- | --- |
| Login, painel (xl+) | grafite com ícone e nome do app | campo roxo #4F2170, logo com "Snacking Made Right" em branco, formas (im)perfeitas, nome do app no rodapé | sinalização da marca: logo branco sobre o campo roxo |
| Login, card | ícone do app | logo roxo (branco no escuro) | a marca abre a entrada também no iPad |
| Sidebar | cinza, ícone + nome | roxa, logo branco + nome do app; recolhida, só o ícone | o roxo da marca sempre à vista, sem competir com o acento das telas |
| Itens da sidebar | — | ativo em pílula branca translúcida; "Registrar agora" em branco com texto roxo | contraste sobre o roxo |
| Títulos de tela | quase preto | roxo da marca, fonte de título | estilo dos materiais da Mondelēz |
| Fundo e superfícies | cinza agrupado | creme do site com cards brancos; sombras levemente arroxeadas | creme é a superfície do site institucional |
| Estados e gráficos | verde, âmbar, vermelho e azul do Tailwind | Go Green, Golden Wheat, Tasty Red, Cool Blue | paleta de apoio da marca |
| Folha do registro (checklist) | monograma do template | logo roxo | o registro é um documento da Mondelēz |
| Tela sem rede | só o ícone | logo + ícone | primeira tela vista quando a rede cai |
| PWA (manifest, theme-color, ícones) | roxo Linear #6d42c2, fundo #f5f5f6, glifo ⌘ | #4F2170, #FAF3E7, glifo de checklist | app instalado com a cor da marca |
| Título das páginas, rodapé | "Rotinas Operacionais · Protótipo" | "… · Mondelēz International"; "Protótipo para a Mondelēz International" | nome completo, com mácron |

## 7. Implementação

| Arquivo | Conteúdo |
| --- | --- |
| `app/src/styles/presets/mondelez.css` | tokens claro e escuro, rampas de estado, sombras; registrado por `npm run generate:presets`, padrão em `preferences-config.ts` |
| `app/src/styles/tema-apple.css` | o acabamento da v0.4 vale para `apple` e `mondelez` (`:is(...)`); vidro do header misturado em oklab (em oklch o `transparent` sem matiz puxava o creme para o rosa) |
| `app/src/styles/tema-mondelez.css` | fontes, títulos, sidebar roxa (tokens do conteúdo trocados dentro da sidebar e restaurados nos cards dela), forma do ícone, vidro sem saturação |
| `app/src/components/marca/*` | logos |
| `app/src/lib/fonts/registry.ts` | Carlito com pré-carga; Inter sem pré-carga |
| `app/src/config/app-config.ts`, `lib/pwa/app-icon.tsx` | nome, cores do PWA, glifo do ícone |
| telas | login (layout e página), sidebar, folha do checklist, tela sem rede |

O tema Apple continua no seletor de temas. Quem já tem o cookie `theme_preset=apple` no navegador continua nele até trocar no menu de layout ou limpar os cookies.

## 8. Verificação

- `npx tsc --noEmit` e Biome nos arquivos alterados.
- Build de produção e capturas em notebook (1.440 × 900), iPad paisagem (1.180 × 820, toque) e iPad retrato (820 × 1.180, toque), nos temas claro e escuro: sem rolagem horizontal, sem erro de console, preset `mondelez` e pilha de fontes ativos. Capturas em `docs/assets/v0.6/`.
- Suíte Playwright (doc 18) num worktree isolado com o build da marca, sem as telas da frente D ainda não commitadas.
  - **Contraste.** A primeira rodada achou três problemas causados pela paleta: abas inativas a 3,9:1, texto âmbar do status a 4,2:1 e o mapa de calor de Tendências entre 3,6 e 4,2:1. Os três foram corrigidos (§4 e `tema-mondelez.css`) e, na segunda rodada, `color-contrast` zerou.
  - **Anteriores à marca.** Ficam para a rodada completa do doc 17: `label-content-name-mismatch` no botão "Trocar pessoa" do header; `aria-allowed-attr` e `aria-valid-attr-value` na timeline do Dice UI e nas abas do Radix; alvos de toque e textos pequenos em telas das frentes.

## 9. Em aberto

- Aprovação do time de marca da Mondelēz para usar a assinatura no app e para a forma do ícone da iniciativa.
- As fontes proprietárias (Bw Surco, MDLZ Bite Type) só aparecem onde estiverem instaladas. Para o piloto, vale pedir à Mondelēz a licença web e servir os arquivos pelo `next/font/local`.
- Fotografia e ilustração: o brand book pede ilustração chapada, sem sombra. Os estados vazios ainda usam ícones do lucide; ilustrações próprias ficam para depois do piloto.
