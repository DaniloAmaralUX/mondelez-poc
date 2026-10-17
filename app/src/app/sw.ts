/**
 * Service worker do tablet (Serwist, docs/13 §service worker). Empacotado pelo esbuild do `@serwist/turbopack` na rota
 * `src/app/serwist/[path]/route.ts` e servido em `/serwist/sw.js`; registrado pelo `ServiceWorkerProvider`
 * (`src/components/service-worker-provider.tsx`), só no build de produção.
 *
 * - Precache: os assets do build (`_next/static`, com as fontes pré-carregadas), o manifest, os ícones e a página
 *   offline. O Serwist apaga na ativação o que não está no manifesto novo.
 * - Telas (HTML de `/dashboard/**` e `/auth/login`): rede primeiro com 3 s de prazo e o cache pela `chaveDaTela` (sem o
 *   `?alerta=` dos Alertas); sem cache, a página offline. O HTML não tem dados de pessoa (vêm do IndexedDB no cliente).
 * - RSC do App Router: rede primeiro, com 3 s de prazo, e cache próprio. Sem rede e sem esse RSC, um 503 faz o Next
 *   abrir a tela pelo navegador (`navegacaoPeloNavegadorSemRede`). O prefetch vai só pela rede, com o mesmo prazo.
 * - Pedido que não chega ao servidor avisa as abas (`AVISO_SEM_REDE`): com o cache e o 503, a página não vê a falha,
 *   e a `<Plataforma />` confere o servidor por conta própria (`lib/pwa/servidor.ts`).
 * - Tudo o que não é GET passa direto (os HEAD que conferem o servidor, as Server Actions). Regras em
 *   `lib/pwa/regras-do-cache.ts`.
 * - Atualização: `skipWaiting` + `clientsClaim`. Na instalação, o build novo busca de novo as telas que o anterior
 *   guardava; na ativação, apaga os caches de HTML e RSC de outros builds, que apontam para chunks que saíram do
 *   precache (ChunkLoadError sem rede).
 */
import { defaultCache, PAGES_CACHE_NAME } from "@serwist/turbopack/worker";
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  type PrecacheEntry,
  type RouteMatchCallback,
  type RuntimeCaching,
  Serwist,
  type SerwistGlobalConfig,
  type SerwistPlugin,
  Strategy,
} from "serwist";

import {
  AVISO_SEM_REDE,
  CABECALHO_DO_AQUECIMENTO,
  chaveDaTela,
  ehCacheDeOutroBuild,
  ehCacheDePaginas,
  nomesDosCaches,
  PAGINA_OFFLINE,
  PARAMETROS_IGNORADOS_NO_PRECACHE,
  podeGuardar,
  revisaoDoManifesto,
  type TipoDePedido,
  telasParaGuardarDeNovo,
  temParametroSoDoCliente,
  tipoDoPedido,
} from "../lib/pwa/regras-do-cache";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Ponto de injeção do manifesto do precache (`injectionPoint` padrão do Serwist).
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/** No `next dev` o Serwist não injeta o manifesto e o `defaultCache` é só rede: aqui também nada vai para o cache. */
const EM_PRODUCAO = process.env.NODE_ENV === "production";
const REVISAO = revisaoDoManifesto(self.__SW_MANIFEST);
const CACHES = nomesDosCaches(REVISAO);

/** Prazo da rede nas telas: passado ele, abre o HTML guardado (Wi-Fi fraco no chão de fábrica). */
const PRAZO_DA_REDE_S = 3;
/** Prazo do RSC até a resposta do servidor: passado ele, conta como falha de rede (Wi-Fi ligado que não responde). */
const PRAZO_DO_RSC_MS = PRAZO_DA_REDE_S * 1000;

/**
 * As entradas do `defaultCache` que tratam páginas e RSC, trocadas pelas deste arquivo, e a "others", que guardaria
 * qualquer GET da própria origem sem a trava de `podeGuardar`: o que sobra fica com o coringa final do `defaultCache`,
 * só rede. As de assets ficam.
 */
const CACHES_DE_PAGINA_DO_SERWIST = new Set<string>([...Object.values(PAGES_CACHE_NAME), "others"]);

const doTipo =
  (tipo: TipoDePedido): RouteMatchCallback =>
  ({ request, url, sameOrigin }) =>
    tipoDoPedido(request, url, sameOrigin) === tipo;

const soOQuePodeGuardar = (conteudo?: "html" | "rsc"): SerwistPlugin => ({
  cacheWillUpdate: async ({ response }) => (podeGuardar(response, conteudo) ? response : null),
});

/**
 * Cache de telas pela `chaveDaTela`: `/dashboard/alertas?alerta=x` lê o HTML de `/dashboard/alertas`, e só o HTML
 * pedido sem os parâmetros do cliente é guardado (o que o servidor renderizou com eles não serve para a tela toda).
 */
const telaSemParametrosDoCliente: SerwistPlugin = {
  cacheKeyWillBeUsed: async ({ request }) => chaveDaTela(request.url),
  cacheWillUpdate: async ({ request, response }) => (temParametroSoDoCliente(request.url) ? null : response),
};

async function avisarAsAbas() {
  for (const aba of await self.clients.matchAll({ type: "window" })) aba.postMessage({ type: AVISO_SEM_REDE });
}

/**
 * Pedido à rede: com `prazoMs`, desiste se a resposta (os cabeçalhos) não chegar a tempo, e o corpo segue sem prazo
 * depois dela. Na falha, avisa as abas (`AVISO_SEM_REDE`), menos quando a própria página cancelou o pedido.
 */
function pedidoAoServidor(prazoMs?: number): SerwistPlugin {
  return {
    requestWillFetch: async ({ request, state }) => {
      if (!prazoMs || !state) return request;
      const controle = new AbortController();
      state.prazo = setTimeout(() => {
        state.venceu = true;
        controle.abort();
      }, prazoMs);
      return new Request(request, { signal: controle.signal });
    },
    fetchDidSucceed: async ({ response, state }) => {
      clearTimeout(state?.prazo);
      return response;
    },
    fetchDidFail: async ({ error, state }) => {
      clearTimeout(state?.prazo);
      if (error.name === "AbortError" && !state?.venceu) return;
      void avisarAsAbas();
    },
  };
}

/**
 * RSC sem rede e sem cache: o `_rsc` depende da tela de onde se sai, então o RSC guardado quase nunca serve, e com erro
 * de rede o Next esperaria a conexão (`useOffline`), sem nada na tela para uma rota sem prefetch. Um 503 (que não entra
 * em cache) faz o Next trocar de tela pelo navegador (`doMpaNavigation` em fetch-server-response.js), e a navegação do
 * documento abre o HTML guardado ou, sem ele, a página offline. Vale também para o prefetch completo, que cai aqui: o
 * Next só descarta a resposta e tenta de novo depois.
 */
const navegacaoPeloNavegadorSemRede: SerwistPlugin = {
  handlerDidError: async () => new Response(null, { status: 503, statusText: "Sem rede" }),
};

function cacheDeTelas(): RuntimeCaching[] {
  // Um limite só para as duas estratégias do mesmo cache. Sem prazo: um fim de semana sem abrir o app não pode apagar
  // as telas; o que renova o cache é a navegação com rede e o build novo.
  const limiteDePaginas = new ExpirationPlugin({ maxEntries: 48 });
  const umTurno = 8 * 60 * 60;

  return [
    {
      matcher: doTipo("pagina"),
      handler: new NetworkFirst({
        cacheName: CACHES.paginas,
        networkTimeoutSeconds: PRAZO_DA_REDE_S,
        plugins: [soOQuePodeGuardar("html"), telaSemParametrosDoCliente, limiteDePaginas, pedidoAoServidor()],
      }),
    },
    {
      matcher: doTipo("aquecimento"),
      handler: new CacheFirst({
        cacheName: CACHES.paginas,
        plugins: [soOQuePodeGuardar("html"), telaSemParametrosDoCliente, limiteDePaginas, pedidoAoServidor()],
      }),
    },
    { matcher: doTipo("outra-navegacao"), handler: new NetworkOnly() },
    {
      // Sem cache: a falha chega ao Next (`useOffline`). Guardado, o prefetch de segmento só traria o carregamento.
      matcher: doTipo("rsc-prefetch"),
      handler: new NetworkOnly({ plugins: [pedidoAoServidor(PRAZO_DO_RSC_MS)] }),
    },
    {
      matcher: doTipo("rsc"),
      handler: new NetworkFirst({
        cacheName: CACHES.rsc,
        plugins: [
          soOQuePodeGuardar("rsc"),
          new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: umTurno }),
          pedidoAoServidor(PRAZO_DO_RSC_MS),
          navegacaoPeloNavegadorSemRede,
        ],
      }),
    },
    // Assets: as estratégias padrão do Serwist para Next, menos as de página (acima).
    ...defaultCache.filter(
      ({ handler }) => !(handler instanceof Strategy && CACHES_DE_PAGINA_DO_SERWIST.has(handler.cacheName)),
    ),
  ];
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: { cleanupOutdatedCaches: true, ignoreURLParametersMatching: PARAMETROS_IGNORADOS_NO_PRECACHE },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: EM_PRODUCAO ? cacheDeTelas() : defaultCache,
  fallbacks: EM_PRODUCAO
    ? { entries: [{ url: PAGINA_OFFLINE, matcher: ({ request }) => request.destination === "document" }] }
    : undefined,
});

/**
 * Na instalação de um build, o anterior ainda atende: busca de novo, para o cache deste build, as telas que estavam
 * guardadas, as abertas nas abas e o login. Assim, ao ativar, o HTML guardado já aponta para os chunks deste build.
 * O cabeçalho de aquecimento faz o proxy entregar a tela também sem pessoa no posto (tablet no login), em vez de mandar
 * ao login (`ehAquecimentoDoServiceWorker`). Sem rede, a tela fica de fora e volta na próxima visita com rede. Uma por
 * vez: são renderizações no servidor.
 */
async function guardarTelasDesteBuild() {
  const enderecos: string[] = [];
  for (const nome of await caches.keys()) {
    if (!ehCacheDePaginas(nome) || nome === CACHES.paginas) continue;
    const anterior = await caches.open(nome);
    for (const pedido of await anterior.keys()) enderecos.push(pedido.url);
  }
  for (const aba of await self.clients.matchAll({ type: "window", includeUncontrolled: true })) enderecos.push(aba.url);

  const cache = await caches.open(CACHES.paginas);
  for (const endereco of telasParaGuardarDeNovo(enderecos, self.location.origin)) {
    try {
      const resposta = await fetch(endereco, {
        credentials: "same-origin",
        cache: "no-store",
        headers: { [CABECALHO_DO_AQUECIMENTO]: "1" },
      });
      if (podeGuardar(resposta, "html")) await cache.put(endereco, resposta);
    } catch {
      // Sem rede agora: a tela entra no cache na próxima navegação com rede.
    }
  }
}

async function apagarCachesDeOutrosBuilds() {
  const nomes = await caches.keys();
  await Promise.all(nomes.filter((nome) => ehCacheDeOutroBuild(nome, REVISAO)).map((nome) => caches.delete(nome)));
}

self.addEventListener("install", (event) => {
  if (EM_PRODUCAO) event.waitUntil(guardarTelasDesteBuild());
});

// Rápido de propósito: enquanto a ativação não termina, o navegador segura os pedidos das abas.
self.addEventListener("activate", (event) => {
  event.waitUntil(apagarCachesDeOutrosBuilds());
});

serwist.addEventListeners();
