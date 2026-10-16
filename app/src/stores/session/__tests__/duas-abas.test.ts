import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { localRepository } from "@/data/repository";
import { PIN_DEMO } from "@/data/seed";
import type { Formulario, TarefaInstancia } from "@/domain/types";

// Integração do store com a persistência de verdade: cada "aba" é uma importação nova do módulo (vi.resetModules), com
// o IndexedDB, o BroadcastChannel e a Web Locks API falsos e compartilhados entre elas.
const compartilhado = vi.hoisted(() => ({
  novo: new Map<string, unknown>(),
  legado: new Map<string, unknown>(),
  gravacoes: 0,
}));

vi.mock("idb-keyval", () => {
  const banco = (store: unknown) => (store === "banco-novo" ? compartilhado.novo : compartilhado.legado);
  return {
    createStore: () => "banco-novo",
    get: async (chave: string, store?: unknown) => structuredClone(banco(store).get(chave)),
    set: async (chave: string, valor: unknown, store?: unknown) => {
      if (store === "banco-novo") compartilhado.gravacoes += 1;
      banco(store).set(chave, structuredClone(valor));
    },
    del: async (chave: string, store?: unknown) => {
      banco(store).delete(chave);
    },
  };
});

const CHAVE = "rotinas-sessao";

class CanalFalso {
  static instancias: CanalFalso[] = [];
  ouvintes = new Set<() => void>();
  constructor(readonly nome: string) {
    CanalFalso.instancias.push(this);
  }
  postMessage() {
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

type Modulo = typeof import("../session-store");

const desligamentos: (() => void)[] = [];
const localStorageFalso = { removeItem: vi.fn(), getItem: vi.fn(() => null), setItem: vi.fn() };

/** Abre uma aba: carrega o IndexedDB e, como a <Plataforma />, liga o aviso entre abas, o pulso de minuto e o envio. */
async function abrirAba({ servicos = true } = {}) {
  vi.resetModules();
  const m: Modulo = await import("../session-store");
  for (let i = 0; i < 20 && !m.useSessionStore.persist.hasHydrated(); i++) await vi.advanceTimersByTimeAsync(0);
  expect(m.useSessionStore.persist.hasHydrated()).toBe(true);
  const estado = () => m.useSessionStore.getState();
  if (servicos) {
    desligamentos.push(
      m.ouvirOutrasAbas(),
      m.assinarMinuto(() => estado().tentarEnviarDeNovo()),
    );
    estado().tentarEnviarDeNovo();
  }
  return { m, estado };
}

const salvo = () => (compartilhado.novo.get(CHAVE) as { state: Record<string, unknown>; version: number }).state;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-16T13:00:00.000Z"));
  compartilhado.novo.clear();
  compartilhado.legado.clear();
  compartilhado.gravacoes = 0;
  CanalFalso.instancias = [];
  localStorageFalso.removeItem.mockClear();
  vi.stubGlobal("window", {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    localStorage: localStorageFalso,
  });
  vi.stubGlobal("document", {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    visibilityState: "visible",
    cookie: "",
  });
  vi.stubGlobal("indexedDB", {});
  vi.stubGlobal("BroadcastChannel", CanalFalso);
  vi.stubGlobal("navigator", { locks: travasFalsas() });
});

afterEach(() => {
  for (const desligar of desligamentos.splice(0)) desligar();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("duas abas do mesmo tablet", () => {
  it("paradas e online, não entram em laço de gravar e reler (no máximo 2 gravações em 30 s)", async () => {
    await abrirAba();
    await vi.advanceTimersByTimeAsync(1000);
    await abrirAba();
    await vi.advanceTimersByTimeAsync(1000);

    compartilhado.gravacoes = 0;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(compartilhado.gravacoes).toBeLessThanOrEqual(2);
  });

  it("confirmações quase ao mesmo tempo nas duas abas ficam as duas", async () => {
    const a = await abrirAba();
    const b = await abrirAba();
    expect(a.estado().entrarComPin("u-alberto", PIN_DEMO).ok).toBe(true);
    await vi.advanceTimersByTimeAsync(1000);
    expect(b.estado().usuarioId).toBe("u-alberto");

    b.estado().confirmarTarefa("tarefa-b");
    await vi.advanceTimersByTimeAsync(100);
    a.estado().confirmarTarefa("tarefa-a");
    await vi.advanceTimersByTimeAsync(5000);

    for (const conclusoes of [a.estado().conclusoes, b.estado().conclusoes, salvo().conclusoes]) {
      expect(conclusoes).toHaveProperty("tarefa-a");
      expect(conclusoes).toHaveProperty("tarefa-b");
    }
  });

  it("o bloqueio feito numa aba não é desfeito pela escrita pendente da outra", async () => {
    const a = await abrirAba();
    const b = await abrirAba();
    a.estado().entrarComPin("u-alberto", PIN_DEMO);
    await vi.advanceTimersByTimeAsync(1000);

    a.estado().bloquear("inatividade");
    await vi.advanceTimersByTimeAsync(300);
    b.estado().salvarRascunho("tarefa-x", { respostas: {}, observacao: "Lote 7" });
    await vi.advanceTimersByTimeAsync(5000);

    expect(salvo()).toMatchObject({ bloqueado: true, motivoBloqueio: "inatividade" });
    expect(b.estado().bloqueado).toBe(true);
    expect(a.estado().rascunhos["tarefa-x"]).toMatchObject({ observacao: "Lote 7" });
  });

  it("entrar com o PIN apaga a marca de segundo plano (ela não bloqueia quem acabou de entrar)", async () => {
    const a = await abrirAba();
    a.estado().entrarComPin("u-alberto", PIN_DEMO);
    expect(localStorageFalso.removeItem).toHaveBeenCalledWith("rotinas-oculto-em");
  });
});

describe("carga do IndexedDB", () => {
  it("ao abrir, registro que estava na janela de desfazer volta para a fila", async () => {
    const a = await abrirAba({ servicos: false });
    a.estado().entrarComPin("u-alberto", PIN_DEMO);
    const formulario = localRepository.formulario("ppli-l4") as Formulario;
    const tarefa = { id: "ppli-l4@2026-10-16T1", equipamentoId: "eq-l4" } as TarefaInstancia;
    const registro = a.estado().registrarChecklist({
      tarefa,
      formulario,
      rascunho: { respostas: { mordentes: { valor: "C" } }, observacao: "" },
    });
    await a.m.gravarSessaoAgora();
    expect((salvo().registros as Record<string, { syncStatus: string }>)[registro?.id ?? ""]?.syncStatus).toBe(
      "pendente",
    );

    const b = await abrirAba({ servicos: false });
    expect(b.estado().registros[registro?.id ?? ""]?.syncStatus).toBe("local");
  });

  it("a chave da v0.2 é migrada, gravada no banco novo e apagada", async () => {
    const relogio = { simulado: "2026-10-16T10:40:00.000Z", real: Date.now() };
    compartilhado.legado.set(
      CHAVE,
      JSON.stringify({
        state: {
          usuarioId: "u-alberto",
          contexto: { plantaId: "chocolate", linhaId: "bis-2", postoId: "bis-2-embalagem" },
          relogio,
          rede: "offline",
          conclusoes: {},
          registros: {},
          tratamentos: {},
          rascunhos: { "tarefa-x": { respostas: {}, observacao: "Lote 3" } },
        },
        version: 2,
      }),
    );

    const a = await abrirAba({ servicos: false });
    expect(a.estado()).toMatchObject({ usuarioId: "u-alberto", simularSemRede: true });
    await vi.advanceTimersByTimeAsync(1000);

    expect(compartilhado.novo.get(CHAVE)).toMatchObject({ version: 3 });
    expect(salvo().rascunhos).toMatchObject({ "tarefa-x": { observacao: "Lote 3", iniciadoPor: "u-alberto" } });
    expect(compartilhado.legado.has(CHAVE)).toBe(false);
  });
});
