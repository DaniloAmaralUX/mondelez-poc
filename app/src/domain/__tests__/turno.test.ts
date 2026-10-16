import { describe, expect, it } from "vitest";

import { chaveTurno, turnoAtual } from "../turno";

const em = (iso: string) => new Date(iso);

describe("turnoAtual", () => {
  it("identifica o 1º turno das 06:00 às 14:00", () => {
    const t = turnoAtual(em("2026-10-16T07:40:00"));
    expect(t.numero).toBe(1);
    expect(t.inicio.getHours()).toBe(6);
    expect(t.fim.getHours()).toBe(14);
  });

  it("identifica o 2º turno a partir das 14:00", () => {
    expect(turnoAtual(em("2026-10-16T14:00:00")).numero).toBe(2);
  });

  it("atribui a madrugada ao 3º turno do dia anterior", () => {
    const t = turnoAtual(em("2026-10-17T03:00:00"));
    expect(t.numero).toBe(3);
    expect(chaveTurno(t)).toBe("2026-10-16T3");
    expect(t.fim.getDate()).toBe(17);
    expect(t.fim.getHours()).toBe(6);
  });
});
