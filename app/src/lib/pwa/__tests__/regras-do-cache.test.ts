import { describe, expect, it } from "vitest";

import {
  CABECALHO_DO_AQUECIMENTO,
  chaveDaTela,
  ehAquecimentoDoServiceWorker,
  ehCacheDeOutroBuild,
  ehCacheDePaginas,
  nomesDosCaches,
  PAGINA_OFFLINE,
  PARAMETROS_IGNORADOS_NO_PRECACHE,
  podeGuardar,
  revisaoDoManifesto,
  telasParaGuardarDeNovo,
  temParametroSoDoCliente,
  tipoDoPedido,
} from "../regras-do-cache";

const ORIGEM = "http://localhost:3210";

function pedido(method: string, mode: string, cabecalhos: Record<string, string> = {}) {
  return { method, mode, headers: new Headers(cabecalhos) };
}

function tipo(caminho: string, p: ReturnType<typeof pedido>, mesmaOrigem = true) {
  return tipoDoPedido(p, new URL(caminho, ORIGEM), mesmaOrigem);
}

function resposta(
  status: number,
  cabecalhos: Record<string, string>,
  extra: { type?: string; redirected?: boolean } = {},
) {
  return {
    status,
    type: extra.type ?? "basic",
    redirected: extra.redirected ?? false,
    headers: new Headers(cabecalhos),
  };
}

describe("tipoDoPedido", () => {
  it("navegação de tela do dashboard e do login é página; a raiz e o template são outra navegação", () => {
    expect(tipo("/dashboard/rotina", pedido("GET", "navigate"))).toBe("pagina");
    expect(tipo("/dashboard/checklist/ppli-l4", pedido("GET", "navigate"))).toBe("pagina");
    expect(tipo("/auth/login", pedido("GET", "navigate"))).toBe("pagina");
    expect(tipo("/", pedido("GET", "navigate"))).toBe("outra-navegacao");
    expect(tipo("/unauthorized", pedido("GET", "navigate"))).toBe("outra-navegacao");
  });

  it("o mesmo HTML pedido pelo app (CACHE_URLS) é aquecimento; fora das telas guardadas, nada", () => {
    expect(tipo("/dashboard/alertas?alerta=a1", pedido("GET", "cors"))).toBe("aquecimento");
    expect(tipo("/", pedido("GET", "cors"))).toBeNull();
  });

  it("RSC pelo cabeçalho ou pelo _rsc, separado em prefetch e navegação", () => {
    expect(tipo("/dashboard/rotina?_rsc=abc", pedido("GET", "cors", { RSC: "1" }))).toBe("rsc");
    expect(tipo("/dashboard/rotina?_rsc=abc", pedido("GET", "cors"))).toBe("rsc");
    expect(tipo("/dashboard/rotina", pedido("GET", "navigate", { RSC: "1" }))).toBe("rsc");
    expect(tipo("/dashboard/rotina?_rsc=abc", pedido("GET", "cors", { RSC: "1", "Next-Router-Prefetch": "1" }))).toBe(
      "rsc-prefetch",
    );
    expect(
      tipo("/dashboard/rotina?_rsc=abc", pedido("GET", "cors", { RSC: "1", "Next-Router-Segment-Prefetch": "/_tree" })),
    ).toBe("rsc-prefetch");
  });

  it("nunca trata o que não é GET: o HEAD do useOffline e o POST das Server Actions vão direto para a rede", () => {
    expect(tipo("/dashboard/rotina", pedido("HEAD", "cors", { RSC: "1" }))).toBeNull();
    expect(tipo("/dashboard/rotina?_rsc=abc", pedido("HEAD", "cors", { RSC: "1" }))).toBeNull();
    expect(tipo("/dashboard/rotina", pedido("POST", "cors", { "Next-Action": "abc" }))).toBeNull();
    expect(tipo("/dashboard/rotina", pedido("POST", "navigate"))).toBeNull();
    expect(tipo("/auth/login", pedido("PUT", "cors"))).toBeNull();
  });

  it("deixa com o precache e o defaultCache os assets, o próprio service worker, a API e outras origens", () => {
    expect(tipo("/_next/static/chunks/a.js", pedido("GET", "no-cors"))).toBeNull();
    expect(tipo("/serwist/sw.js", pedido("GET", "same-origin"))).toBeNull();
    expect(tipo("/api/saude", pedido("GET", "cors"))).toBeNull();
    expect(tipo("/dashboard/rotina", pedido("GET", "navigate"), false)).toBeNull();
  });
});

describe("podeGuardar", () => {
  const html = { "Content-Type": "text/html; charset=utf-8" };
  const rsc = { "Content-Type": "text/x-component" };

  it("guarda 200 da própria origem com o conteúdo do cache certo", () => {
    expect(podeGuardar(resposta(200, html), "html")).toBe(true);
    expect(podeGuardar(resposta(200, rsc), "rsc")).toBe(true);
    expect(podeGuardar(resposta(200, { "Content-Type": "application/json" }))).toBe(true);
  });

  it("não mistura HTML e RSC", () => {
    expect(podeGuardar(resposta(200, rsc), "html")).toBe(false);
    expect(podeGuardar(resposta(200, html), "rsc")).toBe(false);
  });

  it("recusa status diferente de 200, redirecionamento, resposta opaca e Set-Cookie", () => {
    expect(podeGuardar(resposta(404, html), "html")).toBe(false);
    expect(podeGuardar(resposta(500, html), "html")).toBe(false);
    expect(podeGuardar(resposta(307, html), "html")).toBe(false);
    expect(podeGuardar(resposta(0, {}, { type: "opaqueredirect" }), "html")).toBe(false);
    expect(podeGuardar(resposta(200, html, { redirected: true }), "html")).toBe(false);
    expect(podeGuardar(resposta(200, html, { type: "opaque" }), "html")).toBe(false);
    expect(podeGuardar(resposta(200, { ...html, "Set-Cookie": "rotinas_sessao=104233" }), "html")).toBe(false);
  });
});

describe("caches por build", () => {
  it("nomeia os caches pela revisão e reconhece os de outros builds", () => {
    const caches = nomesDosCaches("abc123");
    expect(caches.paginas).toBe("rotinas-paginas-abc123");
    expect(ehCacheDeOutroBuild(caches.paginas, "abc123")).toBe(false);
    expect(ehCacheDeOutroBuild(caches.rsc, "abc123")).toBe(false);
    // Também o cache de prefetch dos builds de antes, que deixou de existir: sai na ativação.
    expect(ehCacheDeOutroBuild("rotinas-rsc-prefetch-old999", "abc123")).toBe(true);
    expect(ehCacheDeOutroBuild("rotinas-paginas-dev", "abc123")).toBe(true);
    expect(ehCacheDeOutroBuild("serwist-precache-v2-http://localhost:3210/", "abc123")).toBe(false);
    expect(ehCacheDePaginas("rotinas-paginas-old999")).toBe(true);
    expect(ehCacheDePaginas("rotinas-rsc-old999")).toBe(false);
  });

  it("lê a revisão da página offline no manifesto; sem manifesto (next dev), dev", () => {
    expect(
      revisaoDoManifesto([
        { url: "/_next/static/chunks/a.js", revision: null },
        { url: PAGINA_OFFLINE, revision: "f00" },
      ]),
    ).toBe("f00");
    expect(revisaoDoManifesto(undefined)).toBe("dev");
    expect(revisaoDoManifesto(["/x"])).toBe("dev");
  });
});

describe("telasParaGuardarDeNovo", () => {
  it("inclui o login, tira hash, _rsc, outras origens, telas não guardadas e repetidas", () => {
    expect(
      telasParaGuardarDeNovo(
        [
          `${ORIGEM}/dashboard/rotina#tarefas`,
          `${ORIGEM}/dashboard/rotina`,
          `${ORIGEM}/dashboard/alertas?alerta=a1`,
          `${ORIGEM}/dashboard/rotina?_rsc=abc`,
          `${ORIGEM}/`,
          "https://exemplo.com/dashboard/rotina",
          "não é url ::",
        ],
        ORIGEM,
      ),
    ).toEqual([`${ORIGEM}/auth/login`, `${ORIGEM}/dashboard/rotina`, `${ORIGEM}/dashboard/alertas`]);
  });

  it("os detalhes de alerta das abas viram uma tela só, a de Alertas", () => {
    expect(
      telasParaGuardarDeNovo(
        [
          `${ORIGEM}/dashboard/alertas?alerta=a1`,
          `${ORIGEM}/dashboard/alertas?alerta=a2`,
          `${ORIGEM}/dashboard/alertas`,
        ],
        ORIGEM,
      ),
    ).toEqual([`${ORIGEM}/auth/login`, `${ORIGEM}/dashboard/alertas`]);
  });
});

describe("chaveDaTela", () => {
  it("tira o hash, o _rsc e os parâmetros só do cliente; mantém os outros", () => {
    expect(chaveDaTela(`${ORIGEM}/dashboard/rotina?_rsc=abc`)).toBe(`${ORIGEM}/dashboard/rotina`);
    expect(chaveDaTela(`${ORIGEM}/dashboard/alertas?alerta=atraso%3Ahora-x-hora%402026-10-17T1%2307&_rsc=abc#x`)).toBe(
      `${ORIGEM}/dashboard/alertas`,
    );
    expect(chaveDaTela(`${ORIGEM}/dashboard/file-manager?view=grid&alerta=a1`)).toBe(
      `${ORIGEM}/dashboard/file-manager?view=grid`,
    );
    expect(chaveDaTela(`${ORIGEM}/dashboard/alertas`)).toBe(`${ORIGEM}/dashboard/alertas`);
  });

  it("reconhece o pedido com parâmetro só do cliente, que não entra no cache", () => {
    expect(temParametroSoDoCliente(`${ORIGEM}/dashboard/alertas?alerta=a1`)).toBe(true);
    expect(temParametroSoDoCliente(`${ORIGEM}/dashboard/alertas?alerta=`)).toBe(true);
    expect(temParametroSoDoCliente(`${ORIGEM}/dashboard/alertas`)).toBe(false);
    expect(temParametroSoDoCliente(`${ORIGEM}/dashboard/file-manager?view=grid`)).toBe(false);
  });
});

describe("ehAquecimentoDoServiceWorker", () => {
  const aoProxy = (method: string, cabecalhos: Record<string, string>) => ({
    method,
    headers: new Headers(cabecalhos),
  });
  const doServiceWorker = { [CABECALHO_DO_AQUECIMENTO]: "1", "Sec-Fetch-Mode": "cors" };

  it("deixa passar só o GET do service worker que guarda o HTML de uma tela", () => {
    expect(ehAquecimentoDoServiceWorker(aoProxy("GET", doServiceWorker))).toBe(true);
    expect(ehAquecimentoDoServiceWorker(aoProxy("GET", { [CABECALHO_DO_AQUECIMENTO]: "1" }))).toBe(true);
  });

  it("não vale para navegação, RSC, outro método, outro valor ou sem o cabeçalho", () => {
    expect(ehAquecimentoDoServiceWorker(aoProxy("GET", { ...doServiceWorker, "Sec-Fetch-Mode": "navigate" }))).toBe(
      false,
    );
    expect(ehAquecimentoDoServiceWorker(aoProxy("GET", { ...doServiceWorker, RSC: "1" }))).toBe(false);
    expect(ehAquecimentoDoServiceWorker(aoProxy("POST", doServiceWorker))).toBe(false);
    expect(ehAquecimentoDoServiceWorker(aoProxy("GET", { "Sec-Fetch-Mode": "cors" }))).toBe(false);
    expect(ehAquecimentoDoServiceWorker(aoProxy("GET", { [CABECALHO_DO_AQUECIMENTO]: "0" }))).toBe(false);
  });
});

describe("PARAMETROS_IGNORADOS_NO_PRECACHE", () => {
  const ignorado = (chave: string) => PARAMETROS_IGNORADOS_NO_PRECACHE.some((re) => re.test(chave));

  it("ignora o hash que o Next põe no favicon e no apple-icon, e só ele", () => {
    expect(ignorado("favicon.2vob68tjqpejf.ico")).toBe(true);
    expect(ignorado("3593721559925725")).toBe(true);
    expect(ignorado("_rsc")).toBe(false);
    expect(ignorado("alerta")).toBe(false);
  });
});
