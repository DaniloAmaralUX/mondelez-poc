import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Modulo = typeof import("../servidor");

// O módulo guarda o estado da sondagem: cada teste carrega uma cópia nova.
async function carregar(): Promise<Modulo> {
  vi.resetModules();
  return import("../servidor");
}

let onLine = true;
const respostas: Array<(opcoes: RequestInit) => Promise<Response>> = [];
const pedidos: Array<{ endereco: string; metodo?: string; cache?: RequestCache }> = [];

beforeEach(() => {
  vi.useFakeTimers();
  onLine = true;
  respostas.length = 0;
  pedidos.length = 0;
  vi.stubGlobal("navigator", {
    get onLine() {
      return onLine;
    },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn((endereco: string, opcoes: RequestInit = {}) => {
      pedidos.push({ endereco, metodo: opcoes.method, cache: opcoes.cache });
      const proxima = respostas.shift() ?? (() => Promise.resolve(new Response(null, { status: 204 })));
      return proxima(opcoes);
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const responde = () => Promise.resolve(new Response(null, { status: 204 }));
const semRede = () => Promise.reject(new TypeError("Failed to fetch"));

describe("sondarServidor", () => {
  it("faz um HEAD sem cache em /api/saude e responde true com o servidor no ar", async () => {
    const { sondarServidor, servidorResponde } = await carregar();
    respostas.push(responde);
    expect(await sondarServidor()).toBe(true);
    expect(pedidos).toEqual([{ endereco: "/api/saude", metodo: "HEAD", cache: "no-store" }]);
    expect(servidorResponde()).toBe(true);
  });

  it("sem resposta, avisa quem assinou e tenta de novo com espera crescente até o servidor voltar", async () => {
    const { assinarServidor, sondarServidor, servidorResponde } = await carregar();
    const mudancas: boolean[] = [];
    assinarServidor(() => mudancas.push(servidorResponde()));
    respostas.push(semRede, semRede, semRede, responde);

    expect(await sondarServidor()).toBe(false);
    expect(servidorResponde()).toBe(false);
    expect(pedidos).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(999);
    expect(pedidos).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(pedidos).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(2000);
    expect(pedidos).toHaveLength(3);
    await vi.advanceTimersByTimeAsync(4000);
    expect(pedidos).toHaveLength(4);
    expect(servidorResponde()).toBe(true);

    // De volta: não sonda mais sozinho.
    await vi.advanceTimersByTimeAsync(30_000);
    expect(pedidos).toHaveLength(4);
    expect(mudancas).toEqual([false, true]);
  });

  it("resposta de erro (502 de um proxy no caminho) também conta como sem servidor", async () => {
    const { sondarServidor } = await carregar();
    respostas.push(() => Promise.resolve(new Response(null, { status: 502 })));
    expect(await sondarServidor()).toBe(false);
  });

  it("Wi-Fi ligado que não responde: desiste no prazo", async () => {
    const { PRAZO_DA_SONDAGEM_MS, sondarServidor } = await carregar();
    respostas.push(
      ({ signal }) =>
        new Promise<Response>((_, rejeitar) => {
          signal?.addEventListener("abort", () => rejeitar(new DOMException("Abortado", "AbortError")));
        }),
    );
    const resultado = sondarServidor();
    await vi.advanceTimersByTimeAsync(PRAZO_DA_SONDAGEM_MS);
    expect(await resultado).toBe(false);
  });

  it("uma sondagem por vez: quem chama no meio dela recebe o mesmo resultado", async () => {
    const { sondarServidor } = await carregar();
    const [a, b] = [sondarServidor(), sondarServidor()];
    expect(a).toBe(b);
    expect(await a).toBe(true);
    expect(pedidos).toHaveLength(1);
  });

  it("sem rede no navegador: não sonda sozinho até o online; o offline marca sem servidor na hora", async () => {
    const { semRedeNoNavegador, sondarServidor, servidorResponde } = await carregar();
    respostas.push(semRede);
    expect(await sondarServidor()).toBe(false);
    onLine = false;
    semRedeNoNavegador();
    expect(servidorResponde()).toBe(false);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(pedidos).toHaveLength(1);
  });
});
