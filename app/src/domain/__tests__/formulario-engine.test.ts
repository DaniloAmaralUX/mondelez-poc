import { describe, expect, it } from "vitest";

import { formularios } from "@/data/seed";

import { resumirRespostas, situacaoItem, validarRespostas } from "../formulario-engine";
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
