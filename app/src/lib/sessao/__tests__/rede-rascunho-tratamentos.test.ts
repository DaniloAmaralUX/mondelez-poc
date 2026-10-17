import { describe, expect, it } from "vitest";

import type { AcaoAlerta } from "@/domain/types";

import { assumirRascunho, gravarRascunho, type RascunhoSalvo } from "../rascunho";
import { redeEfetiva } from "../rede";
import { removerUltimaAcao } from "../tratamentos";

describe("rede efetiva", () => {
  it("segue o aparelho quando não há simulação", () => {
    expect(redeEfetiva("online", false)).toBe("online");
    expect(redeEfetiva("offline", false)).toBe("offline");
  });

  it("'Simular sem rede' desliga, mas nunca liga uma rede que não existe", () => {
    expect(redeEfetiva("online", true)).toBe("offline");
    expect(redeEfetiva("offline", true)).toBe("offline");
  });
});

describe("rascunho com autor", () => {
  const valores = { respostas: { i1: { valor: "C" as const } }, observacao: "", equipamentoId: "eq-1" };

  it("a primeira gravação registra quem começou e quando", () => {
    expect(gravarRascunho(undefined, valores, "u-alberto", "2026-10-16T10:40:00.000Z")).toEqual({
      ...valores,
      iniciadoPor: "u-alberto",
      iniciadoEm: "2026-10-16T10:40:00.000Z",
    });
  });

  it("as próximas gravações preservam autor e início, mesmo com outra pessoa no posto", () => {
    const existente = gravarRascunho(undefined, valores, "u-alberto", "2026-10-16T10:40:00.000Z");
    const depois = gravarRascunho(
      existente,
      { ...valores, observacao: "Lote 42" },
      "u-joana",
      "2026-10-16T10:50:00.000Z",
    );
    expect(depois).toMatchObject({
      observacao: "Lote 42",
      iniciadoPor: "u-alberto",
      iniciadoEm: "2026-10-16T10:40:00.000Z",
    });
  });

  it("ignora autoria vinda do formulário", () => {
    const comAutor = { ...valores, iniciadoPor: "u-outro", iniciadoEm: "2020-01-01T00:00:00.000Z" };
    expect(gravarRascunho(undefined, comAutor, "u-alberto", "2026-10-16T10:40:00.000Z")).toMatchObject({
      iniciadoPor: "u-alberto",
      iniciadoEm: "2026-10-16T10:40:00.000Z",
    });
  });

  it("assumir passa a autoria a partir de agora; o próprio autor não muda nada", () => {
    const r: RascunhoSalvo = { ...valores, iniciadoPor: "u-alberto", iniciadoEm: "2026-10-16T10:40:00.000Z" };
    expect(assumirRascunho(r, "u-joana", "2026-10-16T10:55:00.000Z")).toEqual({
      ...r,
      iniciadoPor: "u-joana",
      iniciadoEm: "2026-10-16T10:55:00.000Z",
    });
    expect(assumirRascunho(r, "u-alberto", "2026-10-16T10:55:00.000Z")).toBe(r);
  });
});

describe("desfazer tratamento", () => {
  const acao = (tipo: AcaoAlerta["tipo"], usuarioId: string, em: string): AcaoAlerta => ({
    tipo,
    texto: tipo,
    usuarioId,
    em,
  });

  it("remove só a última ação do alerta, quando é da pessoa", () => {
    const tratamentos = {
      a1: [acao("assumir", "u-renata", "1"), acao("acao", "u-joao", "2"), acao("acao", "u-renata", "3")],
      a2: [acao("assumir", "u-renata", "4")],
    };
    const proximo = removerUltimaAcao(tratamentos, "a1", "u-renata");
    expect(proximo.a1.map((a) => a.em)).toEqual(["1", "2"]);
    expect(proximo.a2).toBe(tratamentos.a2);
  });

  it("depois que outra pessoa agiu no alerta, a ação anterior não sai", () => {
    const tratamentos = { a1: [acao("assumir", "u-renata", "1"), acao("acao", "u-joao", "2")] };
    expect(removerUltimaAcao(tratamentos, "a1", "u-renata")).toBe(tratamentos);
  });

  it("com o instante, só sai a ação que o aviso anunciou", () => {
    const tratamentos = { a1: [acao("assumir", "u-renata", "1"), acao("acao", "u-renata", "2")] };
    // O "Desfazer" do Assumir (em "1") não apaga a ação registrada depois (em "2").
    expect(removerUltimaAcao(tratamentos, "a1", "u-renata", "1")).toBe(tratamentos);
    expect(removerUltimaAcao(tratamentos, "a1", "u-renata", "2").a1.map((a) => a.em)).toEqual(["1"]);
  });

  it("sem ações restantes, o alerta sai do mapa", () => {
    expect(removerUltimaAcao({ a1: [acao("assumir", "u-renata", "1")] }, "a1", "u-renata")).toEqual({});
  });

  it("sem ação da pessoa, devolve o mesmo mapa", () => {
    const tratamentos = { a1: [acao("assumir", "u-joao", "1")] };
    expect(removerUltimaAcao(tratamentos, "a1", "u-renata")).toBe(tratamentos);
    expect(removerUltimaAcao(tratamentos, "a9", "u-renata")).toBe(tratamentos);
  });
});
