import { describe, expect, it } from "vitest";

import type { Registro, SyncStatus } from "@/domain/types";

import { chaveDoTurnoAnterior, podarRegistros } from "../poda";

function registro(id: string, turnoChave: string, syncStatus: SyncStatus): Registro {
  return {
    id,
    tarefaId: `t-${id}`,
    formularioId: "ppli",
    versaoFormulario: 1,
    respostas: {},
    criadoEm: "2026-10-16T10:00:00.000Z",
    turnoChave,
    postoId: "bis-2-embalagem",
    usuarioId: "u-alberto",
    dispositivoId: "tablet",
    syncStatus,
    naoConformes: 0,
  };
}

const porId = (...rs: Registro[]) => Object.fromEntries(rs.map((r) => [r.id, r]));

describe("turno anterior", () => {
  it("no 1º turno, o anterior é o 3º do dia anterior", () => {
    expect(chaveDoTurnoAnterior(new Date("2026-10-16T07:40:00"))).toBe("2026-10-15T3");
  });

  it("no 2º turno, o anterior é o 1º do mesmo dia", () => {
    expect(chaveDoTurnoAnterior(new Date("2026-10-16T15:00:00"))).toBe("2026-10-16T1");
  });

  it("na madrugada (3º turno), o anterior é o 2º do dia em que o turno começou", () => {
    expect(chaveDoTurnoAnterior(new Date("2026-10-17T03:00:00"))).toBe("2026-10-16T2");
  });
});

describe("poda de registros", () => {
  const agora = new Date("2026-10-16T15:00:00"); // 2º turno; anterior = 2026-10-16T1

  it("tira os sincronizados de turnos anteriores ao turno anterior", () => {
    const rs = porId(
      registro("atual", "2026-10-16T2", "sincronizado"),
      registro("anterior", "2026-10-16T1", "sincronizado"),
      registro("velho", "2026-10-15T3", "sincronizado"),
      registro("muito-velho", "2026-10-14T1", "sincronizado"),
    );
    expect(Object.keys(podarRegistros(rs, agora)).sort()).toEqual(["anterior", "atual"]);
  });

  it("nunca tira o que ainda não foi enviado", () => {
    const rs = porId(
      registro("local", "2026-10-14T1", "local"),
      registro("erro", "2026-10-14T1", "erro"),
      registro("pendente", "2026-10-14T1", "pendente"),
      registro("enviando", "2026-10-14T1", "enviando"),
    );
    expect(Object.keys(podarRegistros(rs, agora)).sort()).toEqual(["enviando", "erro", "local", "pendente"]);
  });

  it("devolve o mesmo objeto quando não há o que podar", () => {
    const rs = porId(registro("atual", "2026-10-16T2", "sincronizado"));
    expect(podarRegistros(rs, agora)).toBe(rs);
  });
});
