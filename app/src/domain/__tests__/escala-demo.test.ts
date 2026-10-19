import { afterEach, describe, expect, it } from "vitest";

import { alinharEscalaAoDia, turmaDoTurno, turnoDaTurma } from "../escala";

describe("escala alinhada ao dia da demo (v0.5)", () => {
  afterEach(() => alinharEscalaAoDia("2026-01-05"));

  it("põe a turma A no 1º turno, a D no 2º, a C no 3º e a B de folga no dia da demo, em qualquer data", () => {
    for (const dia of ["2026-10-19", "2026-11-03", "2027-02-28"]) {
      alinharEscalaAoDia(dia);
      expect(turnoDaTurma("A", dia)).toBe(1);
      expect(turmaDoTurno(1, dia)).toBe("A");
      expect(turmaDoTurno(2, dia)).toBe("D");
      expect(turmaDoTurno(3, dia)).toBe("C");
      expect(turnoDaTurma("B", dia)).toBe("folga");
    }
  });

  it("mantém o ciclo de 8 dias a partir do dia alinhado", () => {
    alinharEscalaAoDia("2026-10-19");
    expect(turnoDaTurma("A", "2026-10-20")).toBe(1);
    expect(turnoDaTurma("A", "2026-10-21")).toBe(2);
    expect(turnoDaTurma("A", "2026-10-25")).toBe("folga");
    expect(turnoDaTurma("A", "2026-10-27")).toBe(1);
  });
});
