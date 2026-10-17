import { describe, expect, it } from "vitest";

import { equipamentos, formularios, rotinaTemplates } from "@/data/seed";

import { limitarRespostas, resumirRespostas, situacaoItem, validarRespostas } from "../formulario-engine";
import { LIMITES, limitarTexto } from "../limites";
import type { Formulario, Resposta } from "../types";

const ppli = formularios.find((f) => f.id === "ppli-l4") as Formulario;
const temperatura = ppli.itens.find((i) => i.id === "temp-longitudinal");

function tudoConforme(): Record<string, Resposta> {
  return {
    mordentes: { valor: "C" },
    bandeja: { valor: "C" },
    sensor: { valor: "C" },
    corrente: { valor: "C" },
    redutor: { valor: "C" },
    "temp-longitudinal": { numero: 170 },
    "temp-transversal": { numero: 185 },
    pressao: { numero: 6 },
    velocidade: { numero: 100 },
  };
}

describe("situacaoItem", () => {
  it("considera não conforme o centerline fora da faixa", () => {
    if (!temperatura) throw new Error("seed sem item");
    expect(situacaoItem(temperatura, { numero: 178 })).toBe("NC");
    expect(situacaoItem(temperatura, { numero: 165 })).toBe("C");
    expect(situacaoItem(temperatura, {})).toBe("pendente");
    expect(situacaoItem(temperatura, { valor: "NA" })).toBe("NA");
  });
});

describe("validarRespostas", () => {
  it("aceita o checklist completo e conforme", () => {
    expect(validarRespostas(ppli, tudoConforme())).toEqual({});
  });

  it("exige resposta em todos os itens", () => {
    const { mordentes: _, ...semMordentes } = tudoConforme();
    expect(Object.keys(validarRespostas(ppli, semMordentes))).toEqual(["mordentes"]);
  });

  it("exige justificativa de 10 caracteres no item não conforme (RN-02)", () => {
    const respostas = { ...tudoConforme(), bandeja: { valor: "NC" as const, justificativa: "suja" } };
    expect(validarRespostas(ppli, respostas).bandeja).toMatch(/mínimo 10/);
    respostas.bandeja.justificativa = "Bandeja com refugo do turno anterior";
    expect(validarRespostas(ppli, respostas)).toEqual({});
  });

  it("exige justificativa também quando o centerline está fora da faixa", () => {
    const respostas = { ...tudoConforme(), pressao: { numero: 7.2 } };
    expect(validarRespostas(ppli, respostas).pressao).toBeDefined();
  });

  it("recusa justificativa e lote acima do limite de tamanho", () => {
    const respostas = {
      ...tudoConforme(),
      bandeja: { valor: "NC" as const, justificativa: "x".repeat(LIMITES.justificativa + 1) },
    };
    expect(validarRespostas(ppli, respostas).bandeja).toMatch(/até 500/);

    const completo = formularios.find((f) => f.id === "rastreabilidade-envoltorio") as Formulario;
    const rastreabilidade = { ...completo, itens: completo.itens.filter((i) => i.tipo === "texto") };
    const lotes = Object.fromEntries(rastreabilidade.itens.map((i) => [i.id, { texto: "L-2026-1016" }]));
    expect(validarRespostas(rastreabilidade, lotes)).toEqual({});
    const loteLongo = { ...lotes, "lote-pa": { texto: "L".repeat(LIMITES.textoDoItem + 1) } };
    expect(validarRespostas(rastreabilidade, loteLongo)["lote-pa"]).toMatch(/até 40/);
  });
});

describe("limitarRespostas", () => {
  it("corta texto e justificativa no limite e não mexe no resto", () => {
    const dentro = tudoConforme();
    expect(limitarRespostas(dentro)).toBe(dentro);

    const fora: Record<string, Resposta> = {
      ...dentro,
      bandeja: { valor: "NC" as const, justificativa: "j".repeat(LIMITES.justificativa + 10) },
      lote: { texto: "t".repeat(LIMITES.textoDoItem + 10) },
    };
    const limitado = limitarRespostas(fora);
    expect(limitado.bandeja).toEqual({ valor: "NC", justificativa: "j".repeat(LIMITES.justificativa) });
    expect(limitado.lote).toEqual({ texto: "t".repeat(LIMITES.textoDoItem) });
    expect(limitado.mordentes).toBe(fora.mordentes);
  });

  it("não parte um emoji ao meio", () => {
    expect(limitarTexto(`${"a".repeat(9)}😀`, 10)).toBe("a".repeat(9));
    expect(limitarTexto("curto", 10)).toBe("curto");
  });
});

describe("seed dentro dos limites", () => {
  it("títulos, grupos e nomes de equipamento cabem nos limites da fronteira de dados", () => {
    for (const t of rotinaTemplates) expect(t.titulo.length, t.id).toBeLessThanOrEqual(LIMITES.titulo);
    for (const f of formularios) {
      expect(f.titulo.length, f.id).toBeLessThanOrEqual(LIMITES.titulo);
      for (const i of f.itens) expect(i.grupo.length, `${f.id}/${i.id}`).toBeLessThanOrEqual(LIMITES.grupo);
    }
    for (const e of equipamentos) expect(e.nome.length, e.id).toBeLessThanOrEqual(LIMITES.nomeDoEquipamento);
  });
});

describe("resumirRespostas", () => {
  it("conta conformes, não conformes, críticos e não aplicáveis", () => {
    const respostas = {
      ...tudoConforme(),
      mordentes: { valor: "NC" as const, justificativa: "Resíduo de chocolate no mordente" },
      sensor: { valor: "NA" as const },
      "temp-longitudinal": { numero: 160, justificativa: "Aquecendo após parada" },
    };
    expect(resumirRespostas(ppli, respostas)).toEqual({
      total: 9,
      respondidos: 9,
      conformes: 6,
      naoConformes: 2,
      naoAplicaveis: 1,
      criticosNaoConformes: 2,
    });
  });
});
