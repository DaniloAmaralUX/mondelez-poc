import { describe, expect, it } from "vitest";

import type { AcaoAlerta, Conclusao, Registro } from "@/domain/types";

import { alertasDaLinha, tarefasDoTurno } from "../derivacao";

const agora = new Date("2026-10-16T09:30:00");
const conclusoes: Record<string, Conclusao> = {};
const registros: Record<string, Registro> = {};
const tratamentos: Record<string, AcaoAlerta[]> = {};

describe("derivação única de tarefas e alertas", () => {
  it("mesmo minuto e mesmas conclusões devolvem o mesmo array de tarefas", () => {
    const a = tarefasDoTurno("bis-2-embalagem", "operacao", agora, conclusoes);
    const b = tarefasDoTurno("bis-2-embalagem", "operacao", new Date(agora), conclusoes);
    expect(a.length).toBeGreaterThan(0);
    expect(b).toBe(a);
  });

  it("outro minuto, outras conclusões ou outro perfil regeram", () => {
    const a = tarefasDoTurno("bis-2-embalagem", "operacao", agora, conclusoes);
    expect(tarefasDoTurno("bis-2-embalagem", "operacao", new Date(agora.getTime() + 60_000), conclusoes)).not.toBe(a);
    const b = tarefasDoTurno("bis-2-embalagem", "operacao", agora, conclusoes);
    expect(tarefasDoTurno("bis-2-embalagem", "operacao", agora, { ...conclusoes })).not.toBe(b);
    expect(tarefasDoTurno("bis-2-embalagem", "supervisao", agora, conclusoes)).not.toBe(b);
  });

  it("alertas da linha calculados uma vez por estado", () => {
    const a = alertasDaLinha("bis-2", agora, conclusoes, registros, tratamentos);
    expect(alertasDaLinha("bis-2", new Date(agora), conclusoes, registros, tratamentos)).toBe(a);
    expect(alertasDaLinha("bis-2", agora, conclusoes, registros, { ...tratamentos })).not.toBe(a);
  });

  it("alertas veem as mesmas tarefas que a rotina do posto", () => {
    const tarefas = tarefasDoTurno("bis-2-embalagem", "operacao", agora, conclusoes);
    const alertas = alertasDaLinha("bis-2", agora, conclusoes, registros, tratamentos);
    const atrasadas = tarefas.filter((t) => t.estado === "atrasada").map((t) => `atraso:${t.id}`);
    for (const id of atrasadas) expect(alertas.some((al) => al.id === id)).toBe(true);
  });
});
