import { describe, expect, it } from "vitest";

import { rotinaTemplates } from "@/data/seed";

import { gerarTarefas, proximaTarefa } from "../routine-engine";
import { montarTurno } from "../turno";
import type { RotinaTemplate } from "../types";

// 16/10/2026 é uma sexta-feira: a limpeza semanal entra na rotina.
const turno = montarTurno(1, new Date("2026-10-16T00:00:00"));
const as = (hhmm: string) => new Date(`2026-10-16T${hhmm}:00`);

function operador(agora: Date, conclusoes = {}) {
  return gerarTarefas({
    templates: rotinaTemplates,
    postoId: "bis-2-embalagem",
    perfil: "operacao",
    turno,
    agora,
    conclusoes,
  });
}

describe("gerarTarefas", () => {
  it("filtra por posto e perfil", () => {
    const tarefas = gerarTarefas({
      templates: rotinaTemplates,
      postoId: "bis-2-embalagem",
      perfil: "gerencia",
      turno,
      agora: as("07:40"),
      conclusoes: {},
    });
    expect(tarefas.every((t) => t.templateId.startsWith("ger-"))).toBe(true);
    expect(operador(as("07:40")).some((t) => t.templateId.startsWith("sup-"))).toBe(false);
  });

  it("gera uma tarefa por bloco nas rotinas por hora", () => {
    const horaXHora = operador(as("07:40")).filter((t) => t.templateId === "hora-x-hora");
    expect(horaXHora).toHaveLength(8);
    expect(horaXHora.map((t) => t.id)).toContain("hora-x-hora@2026-10-16T1#06");
    const sobrepeso = operador(as("07:40")).filter((t) => t.templateId === "sobrepeso");
    expect(sobrepeso).toHaveLength(4);
  });

  it("inclui a rotina semanal apenas no dia configurado", () => {
    expect(operador(as("07:40")).some((t) => t.templateId === "limpeza-semanal")).toBe(true);
    const quinta = montarTurno(1, new Date("2026-10-15T00:00:00"));
    const tarefas = gerarTarefas({
      templates: rotinaTemplates,
      postoId: "bis-2-embalagem",
      perfil: "operacao",
      turno: quinta,
      agora: new Date("2026-10-15T07:40:00"),
      conclusoes: {},
    });
    expect(tarefas.some((t) => t.templateId === "limpeza-semanal")).toBe(false);
  });

  it("marca como atrasada a tarefa pendente com prazo vencido", () => {
    const prePartida = operador(as("07:40")).find((t) => t.templateId === "pre-partida-l4");
    expect(prePartida?.estado).toBe("atrasada");
  });

  it("respeita a conclusão registrada, mesmo depois do prazo", () => {
    const tarefas = operador(as("07:40"), {
      "pre-partida-l4@2026-10-16T1": { estado: "feita", em: "2026-10-16T06:12:00", usuarioId: "u-alberto" },
    });
    const prePartida = tarefas.find((t) => t.templateId === "pre-partida-l4");
    expect(prePartida?.estado).toBe("feita");
    expect(prePartida?.concluidaEm?.getHours()).toBe(6);
  });

  it("sinaliza tarefas cuja janela ainda não abriu", () => {
    const troca = operador(as("07:40")).find((t) => t.templateId === "troca-de-turno-op");
    expect(troca?.futura).toBe(true);
    expect(troca?.estado).toBe("a_fazer");
  });

  it("ordena atrasadas primeiro, depois prazo, e concluídas por último", () => {
    const tarefas = operador(as("07:40"), {
      "hora-x-hora@2026-10-16T1#06": { estado: "feita", em: "2026-10-16T07:04:00", usuarioId: "u-alberto" },
    });
    expect(tarefas[0]?.estado).toBe("atrasada");
    expect(tarefas.at(-1)?.estado).toBe("feita");
    const pendentes = tarefas.filter((t) => t.estado === "a_fazer");
    for (let i = 1; i < pendentes.length; i++) {
      expect(pendentes[i].prazo.getTime()).toBeGreaterThanOrEqual(pendentes[i - 1].prazo.getTime());
    }
  });

  it("desempata o mesmo prazo pela criticidade", () => {
    const base: Omit<RotinaTemplate, "id" | "criticidade" | "titulo"> = {
      moduloSlug: "x",
      frequencia: { tipo: "turno" },
      janela: { inicioMin: 0, duracaoMin: 60 },
      postoIds: ["p"],
      perfis: ["operacao"],
    };
    const tarefas = gerarTarefas({
      templates: [
        { ...base, id: "a", titulo: "A", criticidade: "normal" },
        { ...base, id: "b", titulo: "B", criticidade: "critica" },
      ],
      postoId: "p",
      perfil: "operacao",
      turno,
      agora: as("06:10"),
      conclusoes: {},
    });
    expect(tarefas.map((t) => t.templateId)).toEqual(["b", "a"]);
  });
});

describe("proximaTarefa", () => {
  it("é a primeira pendente com a janela aberta", () => {
    const tarefas = operador(as("07:40"), {
      "pre-partida-l4@2026-10-16T1": { estado: "feita", em: "2026-10-16T06:12:00", usuarioId: "u-alberto" },
      "hora-x-hora@2026-10-16T1#06": { estado: "feita", em: "2026-10-16T07:04:00", usuarioId: "u-alberto" },
    });
    const proxima = proximaTarefa(tarefas);
    expect(proxima?.templateId).toBe("ppli-l4");
  });
});
