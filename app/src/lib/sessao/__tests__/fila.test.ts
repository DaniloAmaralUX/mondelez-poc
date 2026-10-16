import { describe, expect, it } from "vitest";

import type { Conclusao, Registro, SyncStatus } from "@/domain/types";

import {
  concluirEnvio,
  desfazerNoEstado,
  fecharJanela,
  filaVazia,
  idsParaEnviar,
  JANELA_DESFAZER_MS,
  marcarComo,
  normalizarAoAbrir,
} from "../fila";
import type { RascunhoSalvo } from "../rascunho";

function registro(id: string, syncStatus: SyncStatus, extra: Partial<Registro> = {}): Registro {
  return {
    id,
    tarefaId: `tarefa-${id}`,
    formularioId: "ppli",
    versaoFormulario: 3,
    respostas: { i1: { valor: "C" } },
    criadoEm: "2026-10-16T10:40:00.000Z",
    turnoChave: "2026-10-16T1",
    postoId: "bis-2-embalagem",
    usuarioId: "u-alberto",
    dispositivoId: "tablet",
    syncStatus,
    naoConformes: 0,
    ...extra,
  };
}

const porId = (...rs: Registro[]) => Object.fromEntries(rs.map((r) => [r.id, r]));
const status = (rs: Record<string, Registro>) => Object.fromEntries(Object.values(rs).map((r) => [r.id, r.syncStatus]));

describe("fila de envio", () => {
  it("dá 10 s para desfazer", () => {
    expect(JANELA_DESFAZER_MS).toBe(10_000);
  });

  it("fim da janela põe o registro pendente na fila", () => {
    const rs = porId(registro("a", "pendente"), registro("b", "sincronizado"));
    expect(status(fecharJanela(rs, "a"))).toEqual({ a: "local", b: "sincronizado" });
  });

  it("fim da janela não mexe em registro que já saiu de pendente", () => {
    const rs = porId(registro("a", "enviando"));
    expect(status(fecharJanela(rs, "a"))).toEqual({ a: "enviando" });
    expect(status(fecharJanela(rs, "sumiu"))).toEqual({ a: "enviando" });
  });

  it("envia fila, falhas e envios órfãos; pendente espera", () => {
    const rs = porId(
      registro("pendente", "pendente"),
      registro("local", "local"),
      registro("erro", "erro"),
      registro("enviando-aqui", "enviando"),
      registro("enviando-orfao", "enviando"),
      registro("ok", "sincronizado"),
    );
    const criadoEm = Date.parse("2026-10-16T10:40:00.000Z");
    expect(idsParaEnviar(rs, new Set(["enviando-aqui"]), new Set(), criadoEm + 1000).sort()).toEqual([
      "enviando-orfao",
      "erro",
      "local",
    ]);
  });

  it("pendente de uma aba que fechou dentro da janela é enviado depois dela; com a janela aberta aqui, espera", () => {
    const rs = porId(registro("orfao", "pendente"), registro("meu", "pendente"));
    const criadoEm = Date.parse("2026-10-16T10:40:00.000Z");
    const janelas = new Set(["meu"]);
    expect(idsParaEnviar(rs, new Set(), janelas, criadoEm + JANELA_DESFAZER_MS - 1)).toEqual([]);
    expect(idsParaEnviar(rs, new Set(), janelas, criadoEm + JANELA_DESFAZER_MS)).toEqual(["orfao"]);
  });

  it("envio com rede sincroniza; rede caída no meio vira erro", () => {
    const rs = porId(registro("a", "enviando"), registro("b", "enviando"), registro("c", "local"));
    expect(status(concluirEnvio(rs, ["a", "b", "c"], "online"))).toEqual({
      a: "sincronizado",
      b: "sincronizado",
      c: "local",
    });
    expect(status(concluirEnvio(rs, ["a"], "offline"))).toEqual({ a: "erro", b: "enviando", c: "local" });
  });

  it("marcarComo ignora ids que não existem e não muda o original", () => {
    const rs = porId(registro("a", "local"));
    const proximo = marcarComo(rs, ["a", "x"], "enviando");
    expect(status(proximo)).toEqual({ a: "enviando" });
    expect(rs.a?.syncStatus).toBe("local");
  });

  it("ao abrir o app, pendente e enviando voltam para a fila", () => {
    const rs = porId(
      registro("p", "pendente"),
      registro("e", "enviando"),
      registro("x", "erro"),
      registro("s", "sincronizado"),
    );
    expect(status(normalizarAoAbrir(rs))).toEqual({ p: "local", e: "local", x: "erro", s: "sincronizado" });
  });

  it("fila vazia só quando tudo foi sincronizado", () => {
    expect(filaVazia({})).toBe(true);
    expect(filaVazia(porId(registro("a", "sincronizado")))).toBe(true);
    expect(filaVazia(porId(registro("a", "sincronizado"), registro("b", "pendente")))).toBe(false);
  });
});

describe("desfazer registro", () => {
  const reg = registro("r1", "pendente", {
    tarefaId: "ppli-l4@2026-10-16T1",
    equipamentoId: "eq-1",
    observacao: "Lote 42",
    usuarioId: "u-alberto",
  });
  const conclusao: Conclusao = { estado: "feita", em: reg.criadoEm, usuarioId: "u-alberto" };
  const original: RascunhoSalvo = {
    respostas: reg.respostas,
    equipamentoId: "eq-1",
    observacao: "Lote 42",
    iniciadoPor: "u-joana",
    iniciadoEm: "2026-10-16T10:20:00.000Z",
  };

  it("remove registro e conclusão e devolve o rascunho com o autor original", () => {
    const desfeito = desfazerNoEstado(
      { registros: porId(reg), conclusoes: { [reg.tarefaId]: conclusao }, rascunhos: {} },
      "r1",
      original,
    );
    expect(desfeito).not.toBeNull();
    expect(desfeito?.registros).toEqual({});
    expect(desfeito?.conclusoes).toEqual({});
    expect(desfeito?.rascunhos[reg.tarefaId]).toEqual(original);
  });

  it("sem rascunho guardado, o autor é quem registrou", () => {
    const desfeito = desfazerNoEstado({ registros: porId(reg), conclusoes: {}, rascunhos: {} }, "r1", undefined);
    expect(desfeito?.rascunhos[reg.tarefaId]).toMatchObject({
      respostas: reg.respostas,
      observacao: "Lote 42",
      iniciadoPor: "u-alberto",
      iniciadoEm: reg.criadoEm,
    });
  });

  it("não remove uma conclusão que não foi criada por este registro", () => {
    const outra: Conclusao = { estado: "feita", em: "2026-10-16T11:00:00.000Z", usuarioId: "u-renata" };
    const desfeito = desfazerNoEstado(
      { registros: porId(reg), conclusoes: { [reg.tarefaId]: outra }, rascunhos: {} },
      "r1",
      original,
    );
    expect(desfeito?.conclusoes).toEqual({ [reg.tarefaId]: outra });
  });

  it("fora da janela não desfaz", () => {
    for (const s of ["local", "enviando", "sincronizado", "erro"] as const) {
      const estado = { registros: porId({ ...reg, syncStatus: s }), conclusoes: {}, rascunhos: {} };
      expect(desfazerNoEstado(estado, "r1", original)).toBeNull();
    }
    expect(desfazerNoEstado({ registros: {}, conclusoes: {}, rascunhos: {} }, "r1", original)).toBeNull();
  });
});
