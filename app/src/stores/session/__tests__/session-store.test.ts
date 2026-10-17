import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { localRepository } from "@/data/repository";
import { PIN_DEMO } from "@/data/seed";
import { LIMITES } from "@/domain/limites";
import type { Formulario, Rascunho, TarefaInstancia } from "@/domain/types";
import { agoraSimulado } from "@/lib/clock";

import { JANELA_DESFAZER_MS, useSessionStore } from "../session-store";

// Integração do store em node: sem window o persist não lê nem grava o IndexedDB; o cookie vai para um document falso.
const formulario = localRepository.formulario("ppli-l4") as Formulario;
const tarefa = { id: "ppli-l4@2026-10-16T1", equipamentoId: "eq-l4" } as TarefaInstancia;
const valores: Rascunho = { respostas: { mordentes: { valor: "C" } }, observacao: "Lote 42" };
const ENVIO_MS = 1300;

const estado = () => useSessionStore.getState();
const doRegistro = (id: string) => estado().registros[id]?.syncStatus;

function registrar() {
  const registro = estado().registrarChecklist({ tarefa, formulario, rascunho: valores });
  if (!registro) throw new Error("registro não criado");
  return registro;
}

beforeAll(() => {
  vi.stubGlobal("document", { cookie: "" });
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-16T13:00:00.000Z"));
  estado().resetarDemo();
  estado().sair();
  if (estado().simularSemRede) estado().alternarRede();
  estado().definirRedeNavegador("online");
  expect(estado().entrarComPin("u-alberto", PIN_DEMO).ok).toBe(true);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("sessão compartilhada", () => {
  it("PIN errado não entra; PIN certo entra, desbloqueia e marca o turno da sessão", () => {
    estado().bloquear("inatividade");
    expect(estado().entrarComPin("u-graziela", "0000")).toMatchObject({ ok: false, campo: "pin" });
    expect(estado().entrarComPin("u-ninguem", PIN_DEMO)).toMatchObject({ ok: false, campo: "matricula" });
    expect(estado().bloqueado).toBe(true);

    expect(estado().entrarComPin("u-graziela", PIN_DEMO).ok).toBe(true);
    expect(estado()).toMatchObject({
      usuarioId: "u-graziela",
      bloqueado: false,
      motivoBloqueio: null,
      candidatoId: null,
    });
    expect(estado().turnoDaSessao).toMatch(/T[123]$/);
  });

  it("bloqueio guarda quem estava e impede registrar em nome dela", () => {
    estado().bloquear("inatividade");
    expect(estado()).toMatchObject({ bloqueado: true, motivoBloqueio: "inatividade", ultimoUsuarioId: "u-alberto" });
    expect(estado().registrarChecklist({ tarefa, formulario, rascunho: valores })).toBeUndefined();
  });

  it("troca pré-seleciona a pessoa e pode ser cancelada; troca parada vira inatividade", () => {
    estado().bloquear("troca", "u-graziela");
    expect(estado()).toMatchObject({ bloqueado: true, motivoBloqueio: "troca", candidatoId: "u-graziela" });
    estado().cancelarTroca();
    expect(estado()).toMatchObject({ bloqueado: false, usuarioId: "u-alberto" });

    estado().bloquear("troca", "u-graziela");
    estado().bloquear("inatividade");
    expect(estado().motivoBloqueio).toBe("inatividade");
    estado().cancelarTroca();
    expect(estado().bloqueado).toBe(true);
  });

  it("sair encerra a pessoa e mantém posto, rascunhos e registros", () => {
    estado().salvarRascunho(tarefa.id, valores);
    const registro = registrar();
    const contexto = estado().contexto;
    estado().sair();
    expect(estado()).toMatchObject({ usuarioId: null, ultimoUsuarioId: null, bloqueado: false, contexto });
    expect(estado().registros[registro.id]).toBeDefined();
  });

  it("o Desfazer que ficou na tela não age depois de sair, com outra pessoa ou com o tablet bloqueado", () => {
    const registro = registrar();
    estado().confirmarTarefa("tarefa-y");

    estado().sair();
    expect(estado().desfazerRegistro(registro.id)).toBe(false);
    estado().entrarComPin("u-graziela", PIN_DEMO);
    expect(estado().desfazerRegistro(registro.id)).toBe(false);
    estado().desfazerConclusao("tarefa-y");
    expect(estado().conclusoes["tarefa-y"]).toBeDefined();

    estado().entrarComPin("u-alberto", PIN_DEMO);
    estado().bloquear("inatividade");
    expect(estado().desfazerRegistro(registro.id)).toBe(false);
    estado().desfazerConclusao("tarefa-y");
    expect(estado().conclusoes["tarefa-y"]).toBeDefined();

    estado().entrarComPin("u-alberto", PIN_DEMO);
    expect(estado().desfazerRegistro(registro.id)).toBe(true);
    estado().desfazerConclusao("tarefa-y");
    expect(estado().conclusoes["tarefa-y"]).toBeUndefined();
  });
});

describe("última sincronização", () => {
  it("com a fila vazia, é renovada no máximo a cada 50 s (foco e pulso não gravam a cada chamada)", () => {
    estado().tentarEnviarDeNovo();
    const primeira = estado().ultimaSincronizacao;
    expect(primeira).not.toBeNull();

    vi.advanceTimersByTime(30_000);
    estado().tentarEnviarDeNovo();
    expect(estado().ultimaSincronizacao).toBe(primeira);

    vi.advanceTimersByTime(30_000);
    estado().tentarEnviarDeNovo();
    expect(estado().ultimaSincronizacao).not.toBe(primeira);
  });

  it("resetar a demo cancela as janelas de desfazer abertas (nada chega à fila depois)", () => {
    registrar();
    estado().resetarDemo();
    vi.advanceTimersByTime(JANELA_DESFAZER_MS + ENVIO_MS);
    expect(estado().registros).toEqual({});
    expect(estado().ultimaSincronizacao).toBeNull();
  });
});

describe("rascunho com autor", () => {
  it("primeira gravação define autor; outra pessoa continua sem trocar o autor até assumir", () => {
    estado().salvarRascunho(tarefa.id, valores);
    const inicio = estado().rascunhos[tarefa.id];
    expect(inicio).toMatchObject({ iniciadoPor: "u-alberto" });

    estado().entrarComPin("u-graziela", PIN_DEMO);
    vi.advanceTimersByTime(60_000);
    estado().salvarRascunho(tarefa.id, { ...valores, observacao: "Lote 43" });
    expect(estado().rascunhos[tarefa.id]).toMatchObject({
      observacao: "Lote 43",
      iniciadoPor: "u-alberto",
      iniciadoEm: inicio?.iniciadoEm,
    });

    estado().assumirRascunho(tarefa.id);
    // Quem assumiu passa a ser a autora a partir de agora (horário simulado), não do horário de quem começou.
    const assumido = estado().rascunhos[tarefa.id];
    expect(assumido?.iniciadoPor).toBe("u-graziela");
    expect(assumido?.iniciadoEm).toBe(agoraSimulado(estado().relogio).toISOString());
    expect(Date.parse(assumido?.iniciadoEm ?? "") - Date.parse(inicio?.iniciadoEm ?? "")).toBe(60_000);

    estado().descartarRascunho(tarefa.id);
    expect(estado().rascunhos[tarefa.id]).toBeUndefined();
  });
});

describe("fila com janela de desfazer", () => {
  it("registro nasce pendente e pode ser desfeito na janela, com o rascunho de volta", () => {
    estado().salvarRascunho(tarefa.id, valores);
    const registro = registrar();
    expect(doRegistro(registro.id)).toBe("pendente");
    expect(estado().conclusoes[tarefa.id]).toBeDefined();
    expect(estado().rascunhos[tarefa.id]).toBeUndefined();

    vi.advanceTimersByTime(JANELA_DESFAZER_MS - 1);
    expect(estado().desfazerRegistro(registro.id)).toBe(true);
    expect(estado().registros[registro.id]).toBeUndefined();
    expect(estado().conclusoes[tarefa.id]).toBeUndefined();
    expect(estado().rascunhos[tarefa.id]).toMatchObject({ observacao: "Lote 42", iniciadoPor: "u-alberto" });

    vi.advanceTimersByTime(JANELA_DESFAZER_MS);
    expect(estado().registros[registro.id]).toBeUndefined();
  });

  it("depois da janela entra na fila, é enviado e não pode mais ser desfeito", () => {
    const registradoEm = Date.now();
    const registro = registrar();
    vi.advanceTimersByTime(JANELA_DESFAZER_MS);
    expect(doRegistro(registro.id)).toBe("enviando");
    expect(estado().desfazerRegistro(registro.id)).toBe(false);
    vi.advanceTimersByTime(ENVIO_MS);
    expect(doRegistro(registro.id)).toBe("sincronizado");
    // Horário real (do aparelho) em que o envio terminou.
    expect(estado().ultimaSincronizacao).toBe(new Date(registradoEm + JANELA_DESFAZER_MS + 1200).toISOString());
  });

  it("sem rede fica no tablet e sincroniza sozinho quando a rede volta", () => {
    estado().alternarRede();
    expect(estado().rede).toBe("offline");
    const registro = registrar();
    vi.advanceTimersByTime(JANELA_DESFAZER_MS + ENVIO_MS);
    expect(doRegistro(registro.id)).toBe("local");

    estado().alternarRede();
    expect(doRegistro(registro.id)).toBe("enviando");
    vi.advanceTimersByTime(ENVIO_MS);
    expect(doRegistro(registro.id)).toBe("sincronizado");
  });

  it("rede caída no meio do envio vira erro e reenvia ao voltar", () => {
    const registro = registrar();
    vi.advanceTimersByTime(JANELA_DESFAZER_MS);
    expect(doRegistro(registro.id)).toBe("enviando");
    estado().definirRedeNavegador("offline");
    vi.advanceTimersByTime(ENVIO_MS);
    expect(doRegistro(registro.id)).toBe("erro");

    estado().tentarEnviarDeNovo();
    expect(doRegistro(registro.id)).toBe("erro");

    estado().definirRedeNavegador("online");
    vi.advanceTimersByTime(ENVIO_MS);
    expect(doRegistro(registro.id)).toBe("sincronizado");
  });

  it("simular sem rede vence o aparelho online; a rede efetiva só volta quando os dois permitem", () => {
    estado().alternarRede();
    estado().definirRedeNavegador("offline");
    estado().alternarRede();
    expect(estado().rede).toBe("offline");
    estado().definirRedeNavegador("online");
    expect(estado().rede).toBe("online");
  });
});

describe("limites de tamanho na fronteira de dados", () => {
  it("o registro nunca leva observação, lote ou justificativa acima do limite", () => {
    const longo = (n: number) => "x".repeat(n + 25);
    const registro = estado().registrarChecklist({
      tarefa,
      formulario,
      rascunho: {
        respostas: {
          mordentes: { valor: "NC", justificativa: longo(LIMITES.justificativa) },
          lote: { texto: longo(40) },
        },
        observacao: longo(LIMITES.observacao),
      },
    });
    expect(registro?.observacao).toHaveLength(LIMITES.observacao);
    expect(registro?.respostas.mordentes?.justificativa).toHaveLength(LIMITES.justificativa);
    expect(registro?.respostas.lote?.texto).toHaveLength(LIMITES.textoDoItem);
  });

  it("a ação de um alerta fica no limite", () => {
    estado().entrarComPin("u-renata", PIN_DEMO);
    estado().tratarAlerta("nc:reg-x", "acao", "y".repeat(LIMITES.acaoDoAlerta + 1));
    expect(estado().tratamentos["nc:reg-x"]?.[0]?.texto).toHaveLength(LIMITES.acaoDoAlerta);
  });
});

describe("alertas", () => {
  it("desfazer tratamento tira só a última ação da pessoa atual", () => {
    estado().entrarComPin("u-renata", PIN_DEMO);
    estado().tratarAlerta("nc:reg-x", "assumir", "Assumido");
    estado().tratarAlerta("nc:reg-x", "acao", "Troca do mordente");
    estado().desfazerTratamento("nc:reg-x");
    expect(estado().tratamentos["nc:reg-x"]?.map((a) => a.tipo)).toEqual(["assumir"]);
    estado().desfazerTratamento("nc:reg-x");
    expect(estado().tratamentos["nc:reg-x"]).toBeUndefined();
  });
});
