import { del, get, set } from "idb-keyval";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type ArmazenamentoSessao,
  ATRASO_GRAVACAO_MS,
  criarArmazenamentoSessao,
  mesclarEstados,
} from "../persistencia";

// IndexedDB em memória: o banco novo ("rotinas-db"/"sessao") e o banco padrão do idb-keyval (v0.2). Como o IndexedDB
// de verdade, devolve e guarda cópias (structuredClone).
const BANCO_NOVO = "banco-novo";
const novo = new Map<string, unknown>();
const legado = new Map<string, unknown>();
const banco = (store: unknown) => (store === BANCO_NOVO ? novo : legado);

vi.mock("idb-keyval", () => ({
  createStore: vi.fn(() => "banco-novo"),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

/** BroadcastChannel entre "abas" do mesmo teste: entrega às outras instâncias com o mesmo nome, depois (microtask). */
class CanalFalso {
  static instancias: CanalFalso[] = [];
  enviados: unknown[] = [];
  ouvintes = new Set<() => void>();
  constructor(readonly nome: string) {
    CanalFalso.instancias.push(this);
  }
  postMessage(mensagem: unknown) {
    this.enviados.push(mensagem);
    for (const outro of CanalFalso.instancias) {
      if (outro !== this && outro.nome === this.nome) queueMicrotask(() => outro.receber());
    }
  }
  addEventListener(_tipo: string, ouvinte: () => void) {
    this.ouvintes.add(ouvinte);
  }
  removeEventListener(_tipo: string, ouvinte: () => void) {
    this.ouvintes.delete(ouvinte);
  }
  receber() {
    for (const o of this.ouvintes) o();
  }
}

/** Web Locks entre "abas": uma tarefa de cada vez, na ordem dos pedidos. */
function travasFalsas() {
  let cadeia: Promise<unknown> = Promise.resolve();
  return {
    request: (_nome: string, tarefa: () => Promise<unknown>) => {
      const proxima = cadeia.then(() => tarefa());
      cadeia = proxima.catch(() => undefined);
      return proxima;
    },
  };
}

/**
 * `indexedDB.open` falso para a conexão própria da saída da página: a conexão abre depois (como no navegador) e o
 * `put` da transação grava na hora no mesmo mapa do banco novo. Guarda as transações para o teste abortar uma.
 */
function indexedDBComConexao() {
  const transacoes: { commit: ReturnType<typeof vi.fn>; onabort: (() => void) | null }[] = [];
  const db = {
    onclose: null,
    onversionchange: null,
    close: vi.fn(),
    transaction: () => {
      const transacao = {
        commit: vi.fn(),
        onabort: null as (() => void) | null,
        objectStore: () => ({
          put: (valor: unknown, chave: string) => {
            novo.set(chave, structuredClone(valor));
          },
        }),
      };
      transacoes.push(transacao);
      return transacao;
    },
  };
  return {
    transacoes,
    open: () => {
      const pedido = { result: db, onsuccess: null as null | (() => void), onupgradeneeded: null, onerror: null };
      setTimeout(() => pedido.onsuccess?.(), 0);
      return pedido;
    },
  };
}

/** O ouvinte de `pagehide` registrado pela persistência (o último, se houver mais de uma instância). */
function saidaDaPagina(): () => void {
  const chamadas = vi.mocked(window.addEventListener).mock.calls.filter(([tipo]) => tipo === "pagehide");
  const ouvinte = chamadas.at(-1)?.[1];
  if (typeof ouvinte !== "function") throw new Error("sem ouvinte de pagehide");
  return ouvinte as () => void;
}

interface Estado {
  a: object;
  b: number;
  itens?: Record<string, number>;
}

const CAMPOS = new Set(["itens"]);
let estado: Estado;
let carregado: boolean;
const criar = () =>
  criarArmazenamentoSessao<Estado>({
    lerValor: () => ({ state: estado, version: 3 }),
    podeGravar: () => carregado,
    camposPorChave: ["itens"],
    aplicar: (novoEstado) => {
      estado = novoEstado;
    },
  });

/** Uma "aba": memória própria; aplicar faz como o setState do persist (troca o estado e agenda a escrita). */
interface Aba {
  estado: Estado;
  armazenamento: ArmazenamentoSessao<Estado>;
  mudar: (f: (e: Estado) => Estado) => void;
}

async function abrirAba(): Promise<Aba> {
  const aba = { estado: { a: {}, b: 0, itens: {} } } as Aba;
  aba.armazenamento = criarArmazenamentoSessao<Estado>({
    lerValor: () => ({ state: aba.estado, version: 3 }),
    podeGravar: () => true,
    camposPorChave: ["itens"],
    aplicar: (novoEstado) => aba.mudar(() => novoEstado),
  });
  aba.mudar = (f) => {
    aba.estado = f(aba.estado);
    aba.armazenamento.setItem("k", { state: aba.estado, version: 3 });
  };
  const lido = await aba.armazenamento.getItem("k");
  if (lido) aba.estado = lido.state;
  aba.armazenamento.ouvirOutrasAbas();
  return aba;
}

const salvo = () => (novo.get("k") as { state: Estado } | undefined)?.state;

beforeEach(() => {
  vi.useFakeTimers();
  novo.clear();
  legado.clear();
  CanalFalso.instancias = [];
  vi.mocked(get).mockImplementation(async (chave, store) => structuredClone(banco(store).get(String(chave))));
  vi.mocked(set).mockImplementation(async (chave, valor, store) => {
    banco(store).set(String(chave), structuredClone(valor));
  });
  vi.mocked(del).mockImplementation(async (chave, store) => {
    banco(store).delete(String(chave));
  });
  vi.stubGlobal("window", { addEventListener: vi.fn() });
  vi.stubGlobal("document", { addEventListener: vi.fn(), visibilityState: "visible" });
  vi.stubGlobal("indexedDB", {});
  vi.stubGlobal("BroadcastChannel", CanalFalso);
  vi.stubGlobal("navigator", { locks: travasFalsas() });
  estado = { a: {}, b: 1 };
  carregado = true;
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("persistência do tablet", () => {
  it("lê o banco novo quando a chave existe", async () => {
    novo.set("rotinas-sessao", { state: { a: {}, b: 7 }, version: 3 });
    legado.set("rotinas-sessao", JSON.stringify({ state: { a: {}, b: 2 }, version: 2 }));
    expect(await criar().getItem("rotinas-sessao")).toEqual({ state: { a: {}, b: 7 }, version: 3 });
  });

  it("sem chave no banco novo, lê a da v0.2 e só a apaga depois de gravar no novo", async () => {
    legado.set("rotinas-sessao", JSON.stringify({ state: { a: {}, b: 2 }, version: 2 }));
    const armazenamento = criar();
    expect(await armazenamento.getItem("rotinas-sessao")).toEqual({ state: { a: {}, b: 2 }, version: 2 });
    expect(legado.has("rotinas-sessao")).toBe(true);

    armazenamento.setItem("rotinas-sessao", { state: estado, version: 3 });
    await vi.advanceTimersByTimeAsync(ATRASO_GRAVACAO_MS);
    expect(novo.get("rotinas-sessao")).toEqual({ state: estado, version: 3, rev: 1 });
    expect(legado.has("rotinas-sessao")).toBe(false);
  });

  it("agrupa as escritas em 400 ms e grava o estado da hora da escrita", async () => {
    const armazenamento = criar();
    armazenamento.setItem("k", { state: estado, version: 3 });
    estado = { ...estado, b: 2 };
    armazenamento.setItem("k", { state: estado, version: 3 });
    estado = { ...estado, b: 3 };

    await vi.advanceTimersByTimeAsync(ATRASO_GRAVACAO_MS - 1);
    expect(set).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(set).toHaveBeenCalledTimes(1);
    expect(novo.get("k")).toEqual({ state: { a: estado.a, b: 3 }, version: 3, rev: 1 });
  });

  it("nunca grava antes de carregar o que já estava salvo", async () => {
    carregado = false;
    const armazenamento = criar();
    armazenamento.setItem("k", { state: estado, version: 3 });
    await vi.advanceTimersByTimeAsync(ATRASO_GRAVACAO_MS * 2);
    expect(set).not.toHaveBeenCalled();
  });

  it("descarta a escrita quando nada salvo mudou (mesmo com outras referências)", async () => {
    const armazenamento = criar();
    armazenamento.setItem("k", { state: estado, version: 3 });
    await vi.advanceTimersByTimeAsync(ATRASO_GRAVACAO_MS);
    estado = { a: {}, b: estado.b };
    armazenamento.setItem("k", { state: estado, version: 3 });
    await vi.advanceTimersByTimeAsync(ATRASO_GRAVACAO_MS);
    expect(set).toHaveBeenCalledTimes(1);
  });

  it("digitação contínua não adia a primeira escrita além de 2 s (+ o atraso de 400 ms)", async () => {
    const armazenamento = criar();
    let primeiraEm: number | null = null;
    for (let t = 0; t <= 3600; t += 300) {
      estado = { ...estado, b: t };
      armazenamento.setItem("k", { state: estado, version: 3 });
      await vi.advanceTimersByTimeAsync(300);
      if (primeiraEm === null && vi.mocked(set).mock.calls.length > 0) primeiraEm = t + 300;
    }
    expect(primeiraEm).not.toBeNull();
    expect(primeiraEm).toBeLessThanOrEqual(2400);
  });

  it("gravarAgora grava na hora (saída da página)", async () => {
    const armazenamento = criar();
    armazenamento.setItem("k", { state: estado, version: 3 });
    await armazenamento.gravarAgora();
    expect(set).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(ATRASO_GRAVACAO_MS);
    expect(set).toHaveBeenCalledTimes(1);
  });

  it("avisa as outras abas depois de gravar", async () => {
    const armazenamento = criar();
    armazenamento.setItem("k", { state: estado, version: 3 });
    await vi.advanceTimersByTimeAsync(ATRASO_GRAVACAO_MS);
    expect(CanalFalso.instancias[0]?.enviados).toEqual([{ tipo: "gravou" }]);
  });
});

describe("saída da página (recarga, app descartado)", () => {
  async function abrirComConexao() {
    const idb = indexedDBComConexao();
    vi.stubGlobal("indexedDB", idb);
    const armazenamento = criar();
    await armazenamento.getItem("k");
    // A conexão própria abre depois da leitura, como no navegador.
    await vi.advanceTimersByTimeAsync(0);
    return { idb, armazenamento };
  }

  it("grava na hora, sem esperar promessa nenhuma, o que estava agendado", async () => {
    const { idb, armazenamento } = await abrirComConexao();
    estado = { ...estado, b: 2 };
    armazenamento.setItem("k", { state: estado, version: 3 });

    saidaDaPagina()();
    // Síncrono: nenhum timer nem microtask rodou desde a saída.
    expect(novo.get("k")).toEqual({ state: { a: {}, b: 2 }, version: 3, rev: 1 });
    expect(idb.transacoes[0]?.commit).toHaveBeenCalledTimes(1);
    expect(CanalFalso.instancias[0]?.enviados).toEqual([{ tipo: "gravou" }]);

    // A escrita agendada foi cancelada: nada a gravar de novo.
    await vi.advanceTimersByTimeAsync(ATRASO_GRAVACAO_MS * 2);
    expect(set).not.toHaveBeenCalled();
  });

  it("grava o que uma gravação no meio do caminho ainda não gravou, e ela não desfaz nada depois", async () => {
    const { armazenamento } = await abrirComConexao();
    // Leitura do banco lenta: a gravação comum fica parada antes do `put`.
    vi.mocked(get).mockImplementation(
      (chave, store) =>
        new Promise((resolver) => {
          setTimeout(() => resolver(structuredClone(banco(store).get(String(chave)))), 30);
        }),
    );
    estado = { ...estado, b: 2 };
    armazenamento.setItem("k", { state: estado, version: 3 });
    void armazenamento.gravarAgora();
    await vi.advanceTimersByTimeAsync(5);
    estado = { ...estado, b: 3 };

    saidaDaPagina()();
    expect(novo.get("k")).toEqual({ state: { a: {}, b: 3 }, version: 3, rev: 1 });

    await vi.advanceTimersByTimeAsync(1000);
    expect(set).not.toHaveBeenCalled();
    expect(estado.b).toBe(3);
    expect(novo.get("k")).toMatchObject({ state: { b: 3 }, rev: 1 });
  });

  it("com a página já oculta, gravarAgora (rascunho salvo no visibilitychange) também grava na hora", async () => {
    const { armazenamento } = await abrirComConexao();
    vi.stubGlobal("document", { addEventListener: vi.fn(), visibilityState: "hidden" });
    estado = { ...estado, b: 5 };
    armazenamento.setItem("k", { state: estado, version: 3 });
    void armazenamento.gravarAgora();
    expect(novo.get("k")).toEqual({ state: { a: {}, b: 5 }, version: 3, rev: 1 });
  });

  it("sem nada novo, não grava", async () => {
    await abrirComConexao();
    saidaDaPagina()();
    expect(novo.has("k")).toBe(false);
  });

  it("com o aviso de outra aba ainda por juntar, não grava às cegas: vai pela junção e as duas mudanças ficam", async () => {
    novo.set("k", { state: { a: {}, b: 1, itens: {} }, version: 3, rev: 1 });
    estado = { a: {}, b: 1, itens: {} };
    const { armazenamento } = await abrirComConexao();
    armazenamento.ouvirOutrasAbas();
    vi.mocked(get).mockImplementation(
      (chave, store) =>
        new Promise((resolver) => {
          setTimeout(() => resolver(structuredClone(banco(store).get(String(chave)))), 30);
        }),
    );
    // Outra aba gravou e avisou; a releitura desta ainda não voltou.
    novo.set("k", { state: { a: {}, b: 1, itens: { daOutra: 1 } }, version: 3, rev: 2 });
    CanalFalso.instancias[0]?.receber();
    estado = { ...estado, itens: { ...estado.itens, daqui: 2 } };
    armazenamento.setItem("k", { state: estado, version: 3 });

    saidaDaPagina()();
    expect((novo.get("k") as { rev: number }).rev).toBe(2);

    await vi.advanceTimersByTimeAsync(1000);
    expect(novo.get("k")).toMatchObject({ state: { itens: { daOutra: 1, daqui: 2 } }, rev: 3 });
  });

  it("se a gravação da saída falhar com a página viva, volta a gravar pelo caminho comum", async () => {
    const { idb, armazenamento } = await abrirComConexao();
    estado = { ...estado, b: 2 };
    armazenamento.setItem("k", { state: estado, version: 3 });
    saidaDaPagina()();
    novo.delete("k");
    idb.transacoes[0]?.onabort?.();

    await vi.advanceTimersByTimeAsync(100);
    expect(set).toHaveBeenCalledTimes(1);
    expect(novo.get("k")).toMatchObject({ state: { b: 2 }, rev: 1 });
  });
});

describe("junção em três vias", () => {
  it("parte do banco e aplica só o que mudou aqui, chave a chave, com remoções", () => {
    const base: Estado = { a: {}, b: 1, itens: { x: 1, y: 1, z: 1 } };
    const doBanco: Estado = { a: {}, b: 2, itens: { x: 9, y: 1, z: 1, w: 1 } };
    const local: Estado = { a: {}, b: 1, itens: { x: 1, y: 5, novo: 1 } };
    expect(mesclarEstados(doBanco, base, local, CAMPOS)).toEqual({
      a: {},
      b: 2,
      itens: { x: 9, y: 5, w: 1, novo: 1 },
    });
  });

  it("campo simples: a versão daqui só vence se mudou aqui", () => {
    const base = { a: {}, b: 1 };
    expect(mesclarEstados({ a: {}, b: 7 }, base, { a: {}, b: 1 }, CAMPOS).b).toBe(7);
    expect(mesclarEstados({ a: {}, b: 7 }, base, { a: {}, b: 3 }, CAMPOS).b).toBe(3);
  });

  it("reaproveitando, devolve o próprio estado local quando o banco não traz nada novo", () => {
    const local = { a: { k: 1 }, b: 1, itens: { x: 1 } };
    const doBanco = structuredClone(local);
    expect(mesclarEstados(doBanco, local, local, CAMPOS, true)).toBe(local);
  });
});

describe("duas abas", () => {
  it("mudanças quase ao mesmo tempo nas duas abas ficam as duas (banco e memória)", async () => {
    novo.set("k", { state: { a: {}, b: 0, itens: {} }, version: 3, rev: 1 });
    const abaA = await abrirAba();
    const abaB = await abrirAba();

    abaB.mudar((e) => ({ ...e, itens: { ...e.itens, x: 1 } }));
    await vi.advanceTimersByTimeAsync(100);
    abaA.mudar((e) => ({ ...e, itens: { ...e.itens, y: 2 } }));
    await vi.advanceTimersByTimeAsync(5000);

    expect(salvo()?.itens).toEqual({ x: 1, y: 2 });
    expect(abaA.estado.itens).toEqual({ x: 1, y: 2 });
    expect(abaB.estado.itens).toEqual({ x: 1, y: 2 });
    // Uma escrita por aba: reler o que a outra gravou não grava de novo.
    expect(set).toHaveBeenCalledTimes(2);
  });

  it("um campo mudado numa aba (ex.: bloqueio) não volta atrás pela escrita pendente da outra", async () => {
    novo.set("k", { state: { a: {}, b: 0, itens: {} }, version: 3, rev: 1 });
    const abaA = await abrirAba();
    const abaB = await abrirAba();

    abaA.mudar((e) => ({ ...e, b: 1 }));
    await vi.advanceTimersByTimeAsync(300);
    abaB.mudar((e) => ({ ...e, itens: { z: 3 } }));
    await vi.advanceTimersByTimeAsync(5000);

    expect(salvo()).toEqual({ a: {}, b: 1, itens: { z: 3 } });
    expect(abaB.estado.b).toBe(1);
    expect(abaA.estado.itens).toEqual({ z: 3 });
  });

  it("mudança feita aqui enquanto a releitura está no meio não se perde", async () => {
    novo.set("k", { state: { a: {}, b: 0, itens: {} }, version: 3, rev: 1 });
    const abaA = await abrirAba();
    const abaB = await abrirAba();
    // Leitura do IndexedDB com 30 ms de latência, para a mudança cair no meio da releitura.
    const LEITURA_MS = 30;
    vi.mocked(get).mockImplementation(
      (chave, store) =>
        new Promise((resolver) => {
          setTimeout(() => resolver(structuredClone(banco(store).get(String(chave)))), LEITURA_MS);
        }),
    );

    abaB.mudar((e) => ({ ...e, itens: { x: 1 } }));
    // B leu, gravou e avisou; A começou a reler e a leitura ainda não voltou.
    await vi.advanceTimersByTimeAsync(ATRASO_GRAVACAO_MS + LEITURA_MS + 5);
    abaA.mudar((e) => ({ ...e, itens: { ...e.itens, y: 2 } }));
    await vi.advanceTimersByTimeAsync(5000);

    expect(abaA.estado.itens).toEqual({ x: 1, y: 2 });
    expect(salvo()?.itens).toEqual({ x: 1, y: 2 });
  });
});
