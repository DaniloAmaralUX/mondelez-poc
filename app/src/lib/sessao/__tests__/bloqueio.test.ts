import { describe, expect, it } from "vitest";

import {
  aplicarBloqueio,
  type EstadoDeBloqueio,
  INATIVIDADE_MS,
  OCULTO_MS,
  ocultoTempoDemais,
  restanteDeInatividade,
  viradaDeTurno,
} from "../bloqueio";

const logado: EstadoDeBloqueio = { usuarioId: "u-alberto", bloqueado: false, motivoBloqueio: null, candidatoId: null };

describe("regra de bloqueio", () => {
  it("bloqueia quem está logado e guarda a pessoa", () => {
    expect(aplicarBloqueio(logado, "inatividade")).toEqual({
      bloqueado: true,
      motivoBloqueio: "inatividade",
      ultimoUsuarioId: "u-alberto",
      candidatoId: null,
    });
  });

  it("troca de pessoa pré-seleciona quem vai entrar", () => {
    expect(aplicarBloqueio(logado, "troca", "u-renata")).toMatchObject({
      motivoBloqueio: "troca",
      candidatoId: "u-renata",
    });
  });

  it("sem pessoa logada não bloqueia", () => {
    expect(aplicarBloqueio({ ...logado, usuarioId: null }, "inatividade")).toBeNull();
    expect(aplicarBloqueio({ ...logado, usuarioId: null }, "troca", "u-renata")).toBeNull();
  });

  it("já bloqueado, um bloqueio automático não muda nada", () => {
    const bloqueado: EstadoDeBloqueio = { ...logado, bloqueado: true, motivoBloqueio: "turno" };
    expect(aplicarBloqueio(bloqueado, "inatividade")).toBeNull();
    expect(aplicarBloqueio(bloqueado, "oculto")).toBeNull();
  });

  it("troca parada vira bloqueio automático (Cancelar deixa de devolver o tablet)", () => {
    const troca: EstadoDeBloqueio = { ...logado, bloqueado: true, motivoBloqueio: "troca", candidatoId: "u-renata" };
    expect(aplicarBloqueio(troca, "inatividade")).toEqual({ motivoBloqueio: "inatividade", candidatoId: null });
    expect(aplicarBloqueio(troca, "turno")).toEqual({ motivoBloqueio: "turno", candidatoId: null });
  });

  it("outra troca com o tablet bloqueado só muda a pessoa pré-selecionada", () => {
    const bloqueado: EstadoDeBloqueio = { ...logado, bloqueado: true, motivoBloqueio: "inatividade" };
    expect(aplicarBloqueio(bloqueado, "troca", "u-renata")).toEqual({ candidatoId: "u-renata" });
    expect(aplicarBloqueio({ ...bloqueado, candidatoId: "u-renata" }, "troca", "u-renata")).toBeNull();
    expect(aplicarBloqueio(bloqueado, "troca")).toBeNull();
  });
});

describe("tempos do bloqueio", () => {
  it("inatividade de 5 min e segundo plano de 2 min", () => {
    expect(INATIVIDADE_MS).toBe(300_000);
    expect(OCULTO_MS).toBe(120_000);
  });

  it("conta o que falta para bloquear por inatividade", () => {
    expect(restanteDeInatividade(1_000, 1_000)).toBe(INATIVIDADE_MS);
    expect(restanteDeInatividade(0, INATIVIDADE_MS - 1)).toBe(1);
    expect(restanteDeInatividade(0, INATIVIDADE_MS)).toBe(0);
  });

  it("segundo plano só bloqueia passando de 2 min", () => {
    expect(ocultoTempoDemais(0, OCULTO_MS)).toBe(false);
    expect(ocultoTempoDemais(0, OCULTO_MS + 1)).toBe(true);
  });
});

describe("virada de turno", () => {
  it("bloqueia quando o turno atual passou do turno da sessão", () => {
    expect(viradaDeTurno(true, "2026-10-16T1", "2026-10-16T2")).toBe(true);
    expect(viradaDeTurno(true, "2026-10-16T3", "2026-10-17T1")).toBe(true);
  });

  it("não bloqueia no mesmo turno, sem sessão ou sem turno de referência", () => {
    expect(viradaDeTurno(true, "2026-10-16T1", "2026-10-16T1")).toBe(false);
    expect(viradaDeTurno(false, "2026-10-16T1", "2026-10-16T2")).toBe(false);
    expect(viradaDeTurno(true, null, "2026-10-16T2")).toBe(false);
  });

  it("um relógio que volta (login no limite do minuto) não bloqueia", () => {
    expect(viradaDeTurno(true, "2026-10-16T2", "2026-10-16T1")).toBe(false);
  });
});
