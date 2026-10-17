/**
 * Regras do service worker (`src/app/sw.ts`), puras para o Vitest: o que é cada pedido, o que pode ir para o cache e
 * quais telas o build novo guarda de novo. Sem Serwist, Next nem `self`: o mesmo arquivo entra no bundle do service
 * worker (esbuild) e nos testes.
 */

/** Página offline estática (`src/app/~offline/page.tsx`), no precache: resposta das navegações sem rede e sem cache. */
export const PAGINA_OFFLINE = "/~offline";

/**
 * Aviso do service worker às abas quando um pedido não chegou ao servidor (falha de rede ou prazo vencido). Com o
 * service worker a página não vê essa falha: a tela ou o RSC sai do cache, ou vem o 503 que abre a tela pelo
 * navegador, e o Next conta isso como resposta. A `<Plataforma />` então confere o servidor (`lib/pwa/servidor.ts`).
 */
export const AVISO_SEM_REDE = "rotinas:sem-rede";

/**
 * Cabeçalho do service worker ao buscar o HTML das telas para o cache de um build novo (`guardarTelasDesteBuild` em
 * src/app/sw.ts). Com ele o `proxy` não manda para o login um GET sem a pessoa do tablet (`ehAquecimentoDoServiceWorker`).
 */
export const CABECALHO_DO_AQUECIMENTO = "X-Rotinas-Aquecimento";

/** Prefixo dos caches de tempo de execução deste app. O do precache é o do Serwist (`serwist-precache-*`). */
const PREFIXO = "rotinas-";

/**
 * Caches com o HTML e o RSC das telas, um conjunto por build. O HTML aponta para os chunks do build que o gerou e o
 * precache só tem os do build atual: servir o HTML de um build anterior sem rede quebraria com ChunkLoadError. Por
 * isso o nome leva a revisão, e a ativação apaga os de outros builds (`ehCacheDeOutroBuild`). O prefetch de RSC não
 * tem cache: vai só pela rede, e a falha chega ao Next.
 */
export function nomesDosCaches(revisao: string) {
  return {
    paginas: `${PREFIXO}paginas-${revisao}`,
    rsc: `${PREFIXO}rsc-${revisao}`,
  } as const;
}

export function ehCacheDeOutroBuild(nome: string, revisao: string): boolean {
  return nome.startsWith(PREFIXO) && !nome.endsWith(`-${revisao}`);
}

export function ehCacheDePaginas(nome: string): boolean {
  return nome.startsWith(`${PREFIXO}paginas-`);
}

/**
 * A revisão do build é a da página offline no manifesto do precache (`src/app/serwist/[path]/route.ts`), que muda a
 * cada build. No `next dev` o Serwist não injeta o manifesto: "dev".
 */
export function revisaoDoManifesto(
  manifesto: ReadonlyArray<string | { readonly url: string; readonly revision?: string | null }> | undefined,
): string {
  for (const entrada of manifesto ?? []) {
    if (typeof entrada !== "string" && entrada.url === PAGINA_OFFLINE && entrada.revision) return entrada.revision;
  }
  return "dev";
}

/** Telas que abrem sem rede pelo HTML guardado: o dashboard inteiro e o login (o SessionGate manda para ele). */
export function ehTelaGuardada(pathname: string): boolean {
  return pathname === "/auth/login" || pathname.startsWith("/dashboard/");
}

/**
 * Parâmetros que só o cliente lê, e que não mudam o HTML da tela: `?alerta=` (o detalhe aberto em Alertas, trocado
 * por `history.replaceState` em alertas.tsx). Ficam fora da chave do cache de telas (`chaveDaTela`).
 */
export const PARAMETROS_SO_DO_CLIENTE: readonly string[] = ["alerta"];

export function temParametroSoDoCliente(endereco: string): boolean {
  const { searchParams } = new URL(endereco);
  return PARAMETROS_SO_DO_CLIENTE.some((nome) => searchParams.has(nome));
}

/**
 * Chave de uma tela no cache de páginas: a URL sem hash, sem o `_rsc` e sem os parâmetros só do cliente. Cada detalhe
 * de alerta não vira uma entrada (elas tirariam as telas do operador do limite do cache), e `/dashboard/alertas?alerta=x`
 * abre sem rede pelo HTML de `/dashboard/alertas`. Só esse HTML, pedido sem os parâmetros, entra no cache (sw.ts).
 */
export function chaveDaTela(endereco: string): string {
  const url = new URL(endereco);
  url.hash = "";
  url.searchParams.delete("_rsc");
  for (const nome of PARAMETROS_SO_DO_CLIENTE) url.searchParams.delete(nome);
  return url.href;
}

interface PedidoAoProxy {
  readonly method: string;
  readonly headers: Pick<Headers, "get">;
}

/**
 * O GET do service worker que guarda o HTML de uma tela (`CABECALHO_DO_AQUECIMENTO`, sem ser navegação nem RSC): o
 * `proxy` deixa passar sem a pessoa do tablet. Sem isso, um build novo instalado com o tablet no login guardava só o
 * login, e entrar sem rede depois ficava preso. O HTML do dashboard é o mesmo para qualquer pessoa (os dados vêm do
 * IndexedDB), e o SessionGate segue mandando ao login no cliente.
 */
export function ehAquecimentoDoServiceWorker(pedido: PedidoAoProxy): boolean {
  return (
    pedido.method === "GET" &&
    pedido.headers.get(CABECALHO_DO_AQUECIMENTO) === "1" &&
    pedido.headers.get("Sec-Fetch-Mode") !== "navigate" &&
    pedido.headers.get("RSC") === null
  );
}

/**
 * Parâmetros que o Next põe nos ícones do `<head>` (`/favicon.ico?favicon.<hash>.ico`, `/apple-icon?<número>`). O
 * precache guarda o endereço sem eles; ignorá-los faz o pedido do navegador achar a entrada.
 */
export const PARAMETROS_IGNORADOS_NO_PRECACHE: RegExp[] = [/^utm_/, /^fbclid$/, /^favicon\.[\w-]+\.ico$/, /^\d+$/];

interface PedidoVisto {
  readonly method: string;
  readonly mode: string;
  readonly headers: Pick<Headers, "get">;
}

/**
 * - `pagina`: navegação (HTML) de uma tela guardada → rede primeiro, com prazo curto, e cache pela `chaveDaTela`.
 * - `aquecimento`: o mesmo HTML pedido pelo próprio app ("CACHE_URLS" do Serwist, depois de uma navegação no cliente ou
 *   da `<Plataforma />`) → só busca o que ainda não está no cache.
 * - `outra-navegacao`: outra página (a raiz `/`, que é redirecionamento, e as telas do template) → só rede, com a página
 *   offline quando falha.
 * - `rsc-prefetch`: prefetch do App Router com `Next-Router-Prefetch` ou `Next-Router-Segment-Prefetch` → só rede, com
 *   prazo; a falha chega ao Next. O prefetch completo (`kind: "full"`) não manda esses cabeçalhos e cai em `rsc`.
 * - `rsc`: payload do App Router (cabeçalho `RSC` ou parâmetro `_rsc`) → rede primeiro, com prazo, e cache próprio; a
 *   chave é a URL com o `_rsc` e o `Vary` da resposta vale (não usamos `ignoreVary`). Sem rede e sem cache, 503.
 * - `null`: o service worker não responde e o pedido segue para a rede como se ele não existisse. É o caso de todo
 *   pedido que não é GET: o HEAD de `lib/pwa/servidor.ts` e o HEAD com `RSC: 1` do `useOffline` do Next, que dizem se o
 *   servidor responde (do cache, o app acharia que está com rede), e o POST das Server Actions. Também `/serwist/*`,
 *   `/api/*` e os `/_next/*`, que ficam com o precache e as estratégias padrão do Serwist (`defaultCache`).
 */
export type TipoDePedido = "pagina" | "aquecimento" | "outra-navegacao" | "rsc-prefetch" | "rsc";

export function tipoDoPedido(pedido: PedidoVisto, url: URL, mesmaOrigem: boolean): TipoDePedido | null {
  if (pedido.method !== "GET" || !mesmaOrigem) return null;
  const { pathname } = url;
  if (pathname.startsWith("/_next/") || pathname.startsWith("/serwist/") || pathname.startsWith("/api/")) return null;

  if (pedido.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) {
    const prefetch =
      pedido.headers.get("Next-Router-Prefetch") === "1" || pedido.headers.get("Next-Router-Segment-Prefetch") !== null;
    return prefetch ? "rsc-prefetch" : "rsc";
  }
  if (pedido.mode === "navigate") return ehTelaGuardada(pathname) ? "pagina" : "outra-navegacao";
  return ehTelaGuardada(pathname) ? "aquecimento" : null;
}

interface RespostaVista {
  readonly status: number;
  readonly type: string;
  readonly redirected: boolean;
  readonly headers: Pick<Headers, "get" | "has">;
}

/**
 * Só entra no cache uma resposta 200 da própria origem, sem redirecionamento e sem `Set-Cookie`, com o tipo de conteúdo
 * esperado: HTML no cache de páginas, `text/x-component` nos de RSC. Fica de fora o redirecionamento do proxy (sem
 * pessoa, `/dashboard/*` vai para o login: o HTML do login não pode ficar guardado como se fosse da tela) e qualquer
 * erro. O navegador não mostra `Set-Cookie` ao service worker; a checagem fica como trava, e o servidor não manda
 * cookie nesses GET (docs/13, service worker).
 */
export function podeGuardar(resposta: RespostaVista, conteudo?: "html" | "rsc"): boolean {
  if (resposta.status !== 200 || resposta.redirected || resposta.type !== "basic") return false;
  if (resposta.headers.has("Set-Cookie")) return false;
  if (!conteudo) return true;
  const tipo = resposta.headers.get("Content-Type") ?? "";
  return conteudo === "html" ? tipo.startsWith("text/html") : tipo.startsWith("text/x-component");
}

/**
 * Telas que o build novo busca de novo na instalação, para o cache dele: as que estavam no cache do build anterior, as
 * abertas nas abas e o login. Pela `chaveDaTela` (a aba em `/dashboard/alertas?alerta=x` vira `/dashboard/alertas`),
 * sem RSC, só da própria origem e só telas guardadas; sem repetição.
 */
export function telasParaGuardarDeNovo(enderecos: Iterable<string>, origem: string): string[] {
  const telas = new Set<string>();
  for (const endereco of [`${origem}/auth/login`, ...enderecos]) {
    let url: URL;
    try {
      url = new URL(endereco, origem);
    } catch {
      continue;
    }
    if (url.origin !== origem || !ehTelaGuardada(url.pathname) || url.searchParams.has("_rsc")) continue;
    telas.add(chaveDaTela(url.href));
  }
  return [...telas];
}
