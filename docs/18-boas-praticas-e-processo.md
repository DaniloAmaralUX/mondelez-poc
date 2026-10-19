# 18 · Boas práticas e processo (documentação oficial)

Documentação oficial e atual de cada peça da stack, consultada na documentação oficial na versão que o projeto usa, e o que ela muda no jeito de trabalhar. Regra que continua valendo (instruções do ambiente): **antes de usar ou mudar a API de uma biblioteca, consultar a documentação oficial**, não a memória.

## 1. Fontes consultadas

| Biblioteca | Versão no projeto | ID na documentação oficial | Tema consultado |
| --- | --- | --- | --- |
| Next.js | 16.4 | `/vercel/next.js/v16.2.9` (a mais próxima indexada) | Testes com Playwright, build de produção, cache do Turbopack em desenvolvimento, uso de memória, `useSearchParams` e `Suspense` |
| Playwright | 1.64 | `/microsoft/playwright/v1.61.0` | Projetos por dispositivo, toque, `webServer`, projeto de login com `storageState`, IndexedDB no estado, axe, snapshot de ARIA |
| Zustand | 5.0 | `/pmndrs/zustand/v5.0.12` | `persist`: versão e migração, `partialize`, hidratação no SSR |
| Vitest | 5.0 | `/vitest-dev/vitest/v5.0.3` | `test.projects` com ambientes diferentes (node, happy-dom) |
| Tailwind CSS | 4.1 | `/websites/tailwindcss` | Container queries com nome, `@min-[…]`, tamanhos no tema |
| Recharts | 3.8 | `/recharts/recharts/v3.3.0` | `accessibilityLayer` e navegação por teclado |
| Serwist | 9.5 | `/websites/serwist_pages_dev` | `@serwist/turbopack`, página offline, como testar o service worker |

## 2. Achados e o que fazemos com eles

| Fonte | O que a documentação diz | Como estava | O que mudou |
| --- | --- | --- | --- |
| Next.js, guia de testes com Playwright e checklist de produção | Testes de ponta a ponta rodam contra o build de produção (`next build` + `next start`); o `webServer` do Playwright gerencia o servidor e `reuseExistingServer` reaproveita um já de pé | Capturas com scripts Puppeteer avulsos em `%TEMP%`, contra o `next dev` compartilhado. Com cinco agentes, ele chegou a 30–50 s por página e as capturas expiravam | Suíte Playwright do projeto (`app/playwright.config.ts`, `app/e2e/`) contra o build de produção na porta 3200. O `next dev` da 3100 fica só para iterar |
| Playwright, autenticação | Um projeto `setup` entra uma vez e salva o `storageState`; os outros dependem dele | Cada script refazia o login em cada tela | `e2e/login.setup.ts` entra com as cinco personas e salva o estado delas |
| Playwright 1.51+, `storageState({ indexedDB: true })` | O estado salvo pode incluir o IndexedDB, para apps que guardam a sessão nele | A sessão, o relógio da demo e os registros vivem no IndexedDB (`stores/session/persistencia.ts`); só o cookie não restaurava a sessão | O setup salva com `indexedDB: true`. Cada teste começa da mesma sessão e não vaza estado para o próximo |
| Playwright, emulação | Projetos com `devices`, `hasTouch`, `isMobile`; WebKit disponível | Viewports montados à mão; só Chromium | Projetos `notebook`, `ipad-paisagem`, `ipad-retrato` (Chromium com toque) e `ipad-webkit` (motor do Safari do iPad) |
| Playwright, testes de acessibilidade | `@axe-core/playwright` analisa a página; anexar o resultado ao relatório; desligar regra só com motivo | Auditorias manuais por JSON (`docs/auditorias`) | Cada tela passa pelo axe (violações sérias e críticas falham) com o resultado anexado. As auditorias de design (UI Audit) continuam por versão |
| Next.js, `useSearchParams` | Componente cliente com `useSearchParams` fica dentro de `Suspense`; numa página estática a falta dele quebra o build | Alertas e Documentos já usam `Suspense` (conferido) | Regra no regras do código: toda tela nova com `useSearchParams` vem com `Suspense` na `page.tsx` |
| Next.js 16, Turbopack | `experimental.turbopackFileSystemCacheForDev` deixa o reinício do `next dev` bem mais rápido; `preloadEntriesOnStart: false` reduz memória | Nenhum dos dois | Fica para depois da v0.5: mudar o `next.config` agora reinicia o servidor no meio do trabalho das frentes |
| Zustand, `persist` | Versão com `migrate` para cada versão anterior, `partialize` do que é persistido, `skipHydration` no SSR e marca de hidratado | Store v5 com migração incremental (v2 → v3 → v4 → v5), `partializar`, armazenamento próprio e `useSessionHydrated` | Confirmado. A regra do regras do código (mapa novo = `partializar` + `CAMPOS_POR_CHAVE` + versão + passo de migração com teste) vale para qualquer dado novo |
| Vitest 5, `test.projects` | Projetos inline separam ambientes por padrão de arquivo (node para domínio, happy-dom ou jsdom para hooks) | Só ambiente node; o hook de bloqueio automático segue sem teste (doc 13 §6) | Próximo passo: projeto `dom` com happy-dom para os hooks (`use-bloqueio`, `use-producao`) |
| Tailwind v4, container queries | Containers com nome (`@container/content`), valores arbitrários `@min-[60rem]/content` e tamanhos próprios no tema (`--container-*`) | Usamos nome e valores arbitrários; os limites (42rem, 60rem, 32rem) se repetem em vários arquivos | Próximo passo: dar nome aos limites no tema (por exemplo `--container-trilho: 60rem`) para não repetir número mágico |
| Recharts 3 | `accessibilityLayer` vem ligado por padrão: o gráfico recebe foco e as setas percorrem os pontos com o tooltip | Gráficos novos das frentes A, B, C e Tendências | Regra: nunca desligar o `accessibilityLayer`; todo gráfico tem título visível e uma frase com a leitura principal, porque o tooltip não substitui o texto |
| Serwist | Página `/~offline` como fallback de documento; testar offline desligando o servidor, não pelo "Offline" do DevTools, que não corta o service worker | Igual (regras do código, "Service worker") | Confirmado |

## 3. Processo de trabalho atualizado

**Antes de codar**
1. Contrato do incremento (como o doc 16a): arquivos de cada frente, API do domínio e do store, specs de design.
2. documentação oficial para toda API de biblioteca que a mudança toca, na versão do projeto.

**Durante**
- Typecheck, Vitest e Biome só nos arquivos alterados (`npx biome check --write <arquivos>`; nunca na pasta inteira, que reformata arquivos CRLF do template).
- `next dev` (3100) para iterar. Uma tela por vez, sem varrer todas as telas a cada mudança.

**Para dar por pronto**
1. `npm run build` (uma vez, por quem orquestra; dois builds ao mesmo tempo na mesma pasta brigam pelo `.next`).
2. `npm run test:e2e`: as telas de cada persona nos quatro projetos, com axe, rolagem, console e toque.
3. `npm run test:e2e:relatorio` e olhar as capturas anexadas: beleza e composição continuam sendo julgadas por gente.
4. Resultado e decisões no doc da versão; commit só dos próprios caminhos.

`npm run verificar` faz 1 e 2 em sequência, depois do typecheck e do Vitest.

**Em paralelo (threads)**
- Cada frente com posse de arquivos e commit só dos seus caminhos (doc 16a §3).
- As frentes verificam a própria tela com poucas rodadas no `next dev`. A rodada completa (build e e2e de todas as telas) é feita uma vez, por quem orquestra, quando as frentes terminam.

## 4. Comandos

| Comando | O que faz |
| --- | --- |
| `npm run build && npm run start -- -p 3200` | Build e servidor de produção na porta da suíte |
| `npm run test:e2e` | Suíte inteira (sobe o `next start` na 3200 se não houver um de pé) |
| `npx playwright test --project=ipad-retrato -g supervisora` | Só uma persona num tamanho |
| `BASE_URL=http://localhost:3100 npx playwright test …` | Contra o `next dev`, para depurar um teste (lento com o servidor disputado) |
| `npm run test:e2e:relatorio` | Relatório HTML com as capturas e os resultados do axe |
