import { describe, expect, it } from "vitest";

import type { Registro } from "@/domain/types";

import { dadosV5Vazios, migrarSessao, VERSAO_SESSAO } from "../migracao";

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
  it("está na versão 5", () => {
    expect(VERSAO_SESSAO).toBe(5);
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
      ultimaSincronizacaoSimulada: null,
      turnoDaSessao: "2026-10-16T1",
      tentativasPin: {},
      pinBloqueadoAte: {},
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

describe("migração v3 → v4", () => {
  const v3 = {
    ...migrarSessao(v2, 2, REAL),
    // Sincronizou 10 min (reais) depois da ancoragem: no relógio da demo, 09:40.
    ultimaSincronizacao: new Date(REAL + 10 * 60_000).toISOString(),
  };

  it("preserva o estado da v3 e começa as tentativas de PIN do zero", () => {
    const v4 = migrarSessao(v3, 3, REAL);
    expect(v4).toMatchObject({
      usuarioId: "u-alberto",
      relogio,
      registros: v2.registros,
      ultimaSincronizacao: v3.ultimaSincronizacao,
      tentativasPin: {},
      pinBloqueadoAte: {},
    });
  });

  it("a última sincronização ganha a hora no relógio da demo, pela âncora salva", () => {
    expect(migrarSessao(v3, 3, REAL)?.ultimaSincronizacaoSimulada).toBe(new Date(2026, 9, 16, 9, 40).toISOString());
    expect(migrarSessao({ ...v3, ultimaSincronizacao: null }, 3, REAL)?.ultimaSincronizacaoSimulada).toBeNull();
    expect(migrarSessao({ ...v3, relogio: undefined }, 3, REAL)?.ultimaSincronizacaoSimulada).toBeNull();
  });

  it("estado da v3 sem forma recomeça a demo", () => {
    expect(migrarSessao(null, 3, REAL)).toBeNull();
    expect(migrarSessao("v3", 3, REAL)).toBeNull();
  });

  it("da v3 chega à v5 com os dados da v0.5 vazios", () => {
    const atual = migrarSessao(v3, 3, REAL);
    expect(atual).toMatchObject({ usuarioId: "u-alberto", ...dadosV5Vazios() });
  });
});

describe("migração v4 → v5", () => {
  const v4 = (() => {
    const migrado = migrarSessao({ ...v2 }, 2, REAL) as unknown as Record<string, unknown>;
    for (const chave of Object.keys(dadosV5Vazios())) delete migrado[chave];
    return migrado;
  })();

  it("preserva tudo da v4 e começa os dados da v0.5 vazios", () => {
    const v5 = migrarSessao(v4, 4, REAL);
    expect(v5).toMatchObject({ usuarioId: "u-alberto", relogio, registros: v2.registros, ...dadosV5Vazios() });
  });

  it("estado da v4 sem forma recomeça a demo", () => {
    expect(migrarSessao(null, 4, REAL)).toBeNull();
  });

  it("na versão atual, o estado passa como está", () => {
    const v5 = migrarSessao(v4, 4, REAL);
    expect(migrarSessao(v5, 5, REAL)).toBe(v5);
  });
});
