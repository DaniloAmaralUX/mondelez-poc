import { describe, expect, it } from "vitest";

import type { Registro } from "@/domain/types";

import { migrarSessao, VERSAO_SESSAO } from "../migracao";

const REAL = Date.parse("2026-10-16T13:00:00.000Z");
const relogio = { simulado: new Date(2026, 9, 16, 9, 30).toISOString(), real: REAL };

const registro: Registro = {
  id: "reg-1",
  tarefaId: "ppli-l4@2026-10-16T1",
  formularioId: "ppli",
  versaoFormulario: 3,
  respostas: { i1: { valor: "NC", justificativa: "Vazamento" } },
  criadoEm: "2026-10-16T12:00:00.000Z",
  turnoChave: "2026-10-16T1",
  postoId: "bis-2-embalagem",
  usuarioId: "u-alberto",
  dispositivoId: "tablet",
  syncStatus: "local",
  naoConformes: 1,
};

const v2 = {
  usuarioId: "u-alberto",
  contexto: { plantaId: "chocolate", linhaId: "bis-2", postoId: "bis-2-embalagem" },
  relogio,
  rede: "offline" as const,
  conclusoes: {
    "pre-partida-l4@2026-10-16T1": { estado: "feita", em: "2026-10-16T09:12:00.000Z", usuarioId: "u-alberto" },
  },
  registros: { [registro.id]: registro },
  tratamentos: {
    "nc:reg-1": [{ tipo: "assumir", texto: "Assumido", em: "2026-10-16T12:05:00.000Z", usuarioId: "u-renata" }],
  },
  rascunhos: { "hora-x-hora@2026-10-16T1#09": { respostas: { i1: { valor: "C" } }, observacao: "" } },
};

describe("migração do estado salvo", () => {
  it("está na versão 3", () => {
    expect(VERSAO_SESSAO).toBe(3);
  });

  it("v2 → v3 preserva pessoa, posto, relógio, conclusões, registros e tratamentos", () => {
    const v3 = migrarSessao(v2, 2, REAL);
    expect(v3).not.toBeNull();
    expect(v3?.usuarioId).toBe("u-alberto");
    expect(v3?.contexto).toEqual(v2.contexto);
    expect(v3?.relogio).toEqual(relogio);
    expect(v3?.conclusoes).toEqual(v2.conclusoes);
    expect(v3?.registros).toEqual(v2.registros);
    expect(v3?.tratamentos).toEqual(v2.tratamentos);
  });

  it("v2 → v3 transforma a rede simulada e adiciona os campos novos", () => {
    const v3 = migrarSessao(v2, 2, REAL);
    expect(v3).toMatchObject({
      simularSemRede: true,
      bloqueado: false,
      motivoBloqueio: null,
      ultimoUsuarioId: null,
      candidatoId: null,
      ultimaSincronizacao: null,
      turnoDaSessao: "2026-10-16T1",
    });
    expect(v3).not.toHaveProperty("rede");
  });

  it("rascunhos da v2 ganham autor (quem estava logado) e início (agora no relógio da demo)", () => {
    const v3 = migrarSessao(v2, 2, REAL);
    expect(v3?.rascunhos["hora-x-hora@2026-10-16T1#09"]).toEqual({
      respostas: { i1: { valor: "C" } },
      observacao: "",
      iniciadoPor: "u-alberto",
      iniciadoEm: relogio.simulado,
    });
  });

  it("sem ninguém logado na v2, o rascunho fica com autor desconhecido e a sessão sem turno", () => {
    const v3 = migrarSessao({ ...v2, usuarioId: null, rede: "online" }, 2, REAL);
    expect(v3?.simularSemRede).toBe(false);
    expect(v3?.turnoDaSessao).toBeNull();
    expect(v3?.rascunhos["hora-x-hora@2026-10-16T1#09"]?.iniciadoPor).toBe("");
  });

  it("versões anteriores à 2 ou estado sem forma recomeçam a demo", () => {
    expect(migrarSessao(v2, 1, REAL)).toBeNull();
    expect(migrarSessao(v2, 0, REAL)).toBeNull();
    expect(migrarSessao(null, 2, REAL)).toBeNull();
    expect(migrarSessao({ usuarioId: "u-alberto" }, 2, REAL)).toBeNull();
  });
});
