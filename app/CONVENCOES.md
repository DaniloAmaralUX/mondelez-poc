# Convenções do código

Regras do protótipo "Rotinas Operacionais" para quem for mexer no app. O porquê de cada uma está nos docs citados (`../docs/`).

## Base

- Next.js 16 (App Router), React 19, TypeScript estrito, Tailwind CSS v4 e shadcn/ui sobre o template Studio Admin.
- Esta versão do Next tem mudanças de API. Antes de usar uma API, leia o guia em `node_modules/next/dist/docs/` e a documentação oficial da versão que está no `package.json`, não a memória.
- `npm install`, `npm run dev` (porta 3100 para iterar), `npm test` (Vitest), `npm run typecheck`, `npm run build`, `npm run test:e2e` (Playwright, porta 3200).
- Biome: aspas duplas, ponto e vírgula, dois espaços, imports ordenados, 120 colunas. Rode só nos arquivos alterados (`npx biome check --write <arquivos>`): numa pasta inteira ele reformata os arquivos do template com CRLF.
- Commits em português com prefixo convencional (`feat:`, `fix:`, `docs:`...).

## Estrutura

- O template é usado 1:1: reaproveite a tela mais próxima e os padrões de `_components`, mudando só conteúdo e escopo (`../docs/10-mapa-do-template.md`). As telas de exemplo do template ficam no disco como referência e fora da sidebar.
- Código perto da rota: `src/app/(main)/dashboard/<tela>/page.tsx` e `_components/`. Só sobe para `src/components/` ou `_components/` do dashboard quando outra tela reusar.
- Nunca edite `src/components/ui/`, `src/components/calendar/` nem `src/components/reui/`: personalize no ponto de uso.
- Toda a interface em pt-BR.
- Regras de domínio em `src/domain/` (TypeScript puro, sem React nem Next), com testes em `src/domain/__tests__/`.
- Estado da demonstração em `src/stores/session/` (Zustand persistido em IndexedDB). A hora vem do relógio simulado (`useAgora`), nunca de `Date.now()` em componente.

## Tema

- Preset padrão `mondelez` (`src/styles/presets/mondelez.css`, registrado por `npm run generate:presets`). O acabamento por `data-slot` está em `src/styles/tema-apple.css` (vale para `apple` e `mondelez`), a marca em `src/styles/tema-mondelez.css` e o movimento em `src/styles/movimento.css` (docs 19 e 20b).
- Use os tokens semânticos (`bg-card`, `text-muted-foreground`...), para a tela funcionar no claro, no escuro e nos outros presets. Sem hex, RGB ou OKLCH soltos em componente.
- Misturas de cor com `transparent` em `oklab`, não em `oklch` (o `transparent` não tem matiz e puxa o tom para o rosa).

## Tablet primeiro (docs 12 e 13)

- **Modo toque.** Liga com `pointer: coarse`, a menos que `html[data-density="fine"]`, e com `html[data-density="touch"]` em qualquer aparelho. No JSX use a variante `toque:` (`src/styles/tablet.css`), não `pointer-coarse:`, que ignora o `data-density`. A exceção é a classe que combina com uma variante ancorada no html (`[html[...]_&]:`): aí vale `pointer-coarse:`. No JS, `modoToque()` / `useModoToque()` (`src/hooks/use-modo-toque.ts`), só em efeitos e eventos (no servidor são `false`). Para seguir só o ponteiro real, `usePonteiroGrossoReal()`.
- **Camada de densidade = piso.** `tablet.css` fica fora de `@layer` e define mínimos por `data-slot`: 56 px para controles, 48 px para itens de menu, select e command, 16 px de fonte em campos. Para passar do piso, `h-*`, `w-*` ou `size-*` com `toque:`; nunca `min-h-*` ou `min-w-*` (o `min-*` da camada vence). Regras novas por slot vão lá, dentro de `@variant toque`. Com o teclado aberto em paisagem, a variante `pouca-altura:` compacta cabeçalhos e títulos.
- **Tamanho no ponto de uso.** Base do template e aumento só no toque (`h-11 toque:h-16`). Respostas do operador e ações principais com 64 px, outros alvos do operador com 56 px ou mais. Pelo menos 12 px entre controles com borda e 16 px entre ações opostas. O notebook da liderança mantém a densidade do template. Nada de `text-xs` nas telas do operador. Barras fixas no toque levam `data-touch-bar="true"` (opacas, sem blur) e usam `env(safe-area-inset-bottom)`.
- **Classes compartilhadas.** Retorno de toque das respostas e ações principais: `PRESSAO` (`src/lib/pressao.ts`, marca o elemento; a regra está em `movimento.css`). `Status` e `Badge` de estado: `STATUS_LEGIVEL` (`src/lib/status-legivel.ts`). Importe; não copie as classes.
- **Layout por contêiner.** O conteúdo do dashboard é `@container/content`, medido sem a sidebar. As telas usam `@4xl/content:` e contêineres nomeados por tela. Quando o arranjo muda (lista ou tabela), renderize os dois e deixe o CSS escolher; não meça em JS. Barras fixas sob o header usam `top-(--dashboard-header-height)`. Abaixo de 1.024 px a sidebar vira Sheet (`MOBILE_BREAKPOINT` em `src/hooks/use-mobile.ts`).
- **Toque.** Desfazer em vez de confirmar: toast com "Desfazer" e `duration: JANELA_DESFAZER_MS` (10 s). `AlertDialog` só para o irreversível. Nada só no hover, no toque longo ou no arraste. Valide no envio, mostre o erro ao lado do campo e foque o primeiro erro. Nunca desabilite um botão "porque o formulário está inválido"; controle desabilitado explica o porquê em texto visível. Limites de texto em `src/domain/limites.ts`: todo campo livre tem `maxLength={LIMITES.…}`, texto digitado mostrado de volta leva `wrap-anywhere` e o store corta também.
- **Toasts.** `AppToaster` (`src/components/app-toaster.tsx`), nunca o `Toaster` do `ui/sonner` direto. Não chame `toast.dismiss()` na troca de pessoa: o `<Plataforma />` já faz.
- **Teste de toque no desktop.** No console, `document.documentElement.dataset.density = "touch"` liga o modo toque (`"fine"` desliga; apagar o atributo volta ao automático).

## Sessão, relógio e plataforma

- **Store da sessão.** `src/stores/session/session-store.ts`, persistido com `version: VERSAO_SESSAO` (5, em `src/lib/sessao/migracao.ts`) num IndexedDB próprio (`rotinas-db` / `sessao`) por `persistencia.ts`: debounce de 400 ms, merge de três vias entre abas sob `navigator.locks`, aviso por BroadcastChannel e gravação síncrona no `pagehide`. Campo persistido novo: entra em `partializar` e em `CAMPOS_POR_CHAVE`, sobe `VERSAO_SESSAO` e ganha um passo em `migracao.ts`. Ações que fecham um estado (entrar, bloquear, registrar, concluir, desfazer, relógio da demo) chamam `gravarJa()`. Componentes chamam ações do store, nunca `useSessionStore.setState`. As ações de desfazer devolvem `boolean` e recusam com o tablet bloqueado ou quando quem pede não é o autor; no `false`, mostre um toast como "Não dá para desfazer".
- **Relógio único.** `useAgora()` não recebe argumento e vem de um `setTimeout` encadeado alinhado ao minuto simulado (`src/lib/sessao/ticker.ts`). Ações do store usam o relógio do store. Nada de `setInterval` nem de timer por componente. Antes do IndexedDB carregar, o estado usa o mesmo instante fixo do servidor, para a hidratação bater. Tarefas e alertas vêm de `useTarefas` / `useMinhasTarefas` / `useAlertas` (`src/hooks/use-turno.ts`). Evite variantes de grupo com `:has()` em árvores grandes: o navegador recalcula o estilo do app inteiro a cada mudança.
- **Tablet compartilhado.** UI transitória que guarda texto digitado (diálogos, Sheets, cards com formulário) recebe `key={usuarioId}` de quem monta: a próxima pessoa do tablet não herda o texto.
- **Plataforma.** `<Plataforma />` (`dashboard/_components/plataforma.tsx`) é montada uma vez no layout e não renderiza nada: detecção de rede, envio da fila, prefetch das rotas do tablet, Wake Lock e escuta das outras abas. Serviços novos do tablet vão lá. Links do operador usam `prefetch` completo (`src/lib/rotas.ts`).
- **Sem rede.** `dashboard/loading.tsx` usa `useOffline()` do `next/offline`: spinner com rede; sem rede, o `Empty` do template com "Voltar para Minha Rotina".
- **Service worker (Serwist, só em produção).** Fonte em `src/app/sw.ts`, servido em `/serwist/sw.js`; regras puras com testes em `src/lib/pwa/regras-do-cache.ts`. Só responde GET; HTML das telas em NetworkFirst de 3 s com a página offline de reserva; caches por build. Teste com `npm run build && npm run start`. No Puppeteer, `page.setOfflineMode` não corta o fetch do próprio service worker: corte a rede fora do navegador.
- **PIN.** Regras em `src/lib/sessao/pin.ts`: 5 PINs errados bloqueiam o PIN daquela pessoa por 60 s, em tempo real. Na interface, `usePinBloqueadoAte(usuarioId)`. Nunca conte tentativas em componente.
- **Bloqueio.** "Quem está no posto?" (`LockScreen`) e `BloqueioAutomatico` em `dashboard/_components/lock-screen.tsx`. Regras em `src/hooks/use-bloqueio.ts` e `src/lib/sessao/bloqueio.ts`. Bloqueada, a página fica montada e `inert`, e as ações que registram recusam.

## Verificação (doc 18)

- `useSearchParams` só dentro de `<Suspense>` no `page.tsx` da rota.
- A verificação roda no build de produção: `npm run build` e `npm run test:e2e`. O projeto `setup` entra com as cinco personas e salva `e2e/.auth/<persona>.json` com `indexedDB: true`. `e2e/telas.spec.ts` visita cada tela por persona em notebook, iPad paisagem, iPad retrato e iPad WebKit e confere título, rolagem horizontal, erros de console, axe (sério e crítico), alvos de 44 px e texto de 13 px no toque, com captura anexada. Tela nova entra em `TELAS`. As capturas ficam em `npm run test:e2e:relatorio`.
- Um build por vez na mesma pasta (dois `next build` brigam pelo `.next`). Instalação de dependências em worktree só com `node_modules` próprio.
- Gráficos (Recharts 3): nunca desligue `accessibilityLayer`; todo gráfico tem título visível e uma frase com a leitura principal.
