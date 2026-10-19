import { describe, expect, it } from "vitest";

import { falhasDoTurno, falhasRepetidas, indicadoresDeFalha, pareto } from "../falhas";
import { chaveTurno, montarTurno } from "../turno";
import type { EventoFalha } from "../types";

// 1º turno das 06:00 às 14:00; o 2º começa às 14:00.
const primeiro = montarTurno(1, new Date(2026, 9, 16));
const segundo = montarTurno(2, new Date(2026, 9, 16));
const em = (h: number, m = 0) => new Date(2026, 9, 16, h, m);

function falha(id: string, inicio: Date, fim?: Date): EventoFalha {
  return {
    id,
    postoId: "p",
    equipamentoId: "eq",
    turnoChave: chaveTurno(primeiro),
    tipoId: "enrosco",
    inicio: inicio.toISOString(),
    ...(fim ? { fim: fim.toISOString() } : {}),
    usuarioId: "u",
  };
}

describe("falha aberta na virada do turno (doc 17 §4)", () => {
  const aberta = falha("a", em(13, 50));

  it("aparece no turno seguinte recortada no início do turno, marcada como continuação", () => {
    const lista = falhasDoTurno([aberta], chaveTurno(segundo), "p", segundo);
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({
      id: "a",
      inicio: segundo.inicio.toISOString(),
      continuacao: true,
      inicioOriginal: em(13, 50).toISOString(),
    });
  });

  it("conta o tempo parado no turno novo, mas não a quantidade (MTBF, Pareto, repetição)", () => {
    const lista = falhasDoTurno([aberta], chaveTurno(segundo), "p", segundo);
    const ind = indicadoresDeFalha(lista, segundo, em(14, 30));
    expect(ind.minutosParados).toBe(30);
    expect(ind.falhas).toBe(0);
    expect(ind.mtbfMin).toBeNull();
    expect(ind.emCurso).toBe(1);
    expect(pareto(lista, [], em(14, 30))[0]).toMatchObject({ quantidade: 0, minutos: 30 });
    expect(falhasRepetidas(lista)).toEqual([]);
  });

  it("falha encerrada antes da virada fica só no turno dela", () => {
    expect(falhasDoTurno([falha("b", em(13, 0), em(13, 20))], chaveTurno(segundo), "p", segundo)).toEqual([]);
  });

  it("sem o turno, o comportamento antigo (só as falhas gravadas no turno)", () => {
    expect(falhasDoTurno([aberta], chaveTurno(segundo), "p")).toEqual([]);
    expect(falhasDoTurno([aberta], chaveTurno(primeiro), "p")).toHaveLength(1);
  });
});
