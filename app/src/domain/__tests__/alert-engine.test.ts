import { describe, expect, it } from "vitest";

import { formularios, rotinaTemplates } from "@/data/seed";

import { gerarAlertas } from "../alert-engine";
import { gerarTarefas } from "../routine-engine";
import { montarTurno } from "../turno";
import type { AcaoAlerta, Conclusao, Registro } from "../types";

const turno = montarTurno(1, new Date("2026-10-16T00:00:00"));
const as = (hhmm: string) => new Date(`2026-10-16T${hhmm}:00`);
const FORMULARIOS = Object.fromEntries(formularios.map((f) => [f.id, f]));

function alertas(
  agora: Date,
  {
    conclusoes = {},
    registros = [],
    tratamentos = {},
  }: {
    conclusoes?: Record<string, Conclusao>;
    registros?: Registro[];
    tratamentos?: Record<string, AcaoAlerta[]>;
  } = {},
) {
  const tarefas = gerarTarefas({
    templates: rotinaTemplates,
    postoId: "bis-2-embalagem",
    perfil: "operacao",
    turno,
    agora,
    conclusoes,
  }).map((tarefa) => ({ postoId: "bis-2-embalagem", tarefa }));

  return gerarAlertas({ tarefas, registros, formularios: FORMULARIOS, tratamentos, agora });
}

const registroPpliComNc: Registro = {
  id: "reg-1",
  tarefaId: "ppli-l4@2026-10-16T1",
  formularioId: "ppli-l4",
  versaoFormulario: 3,
  respostas: {
    mordentes: { valor: "NC", justificativa: "Resíduo de chocolate no mordente" },
    bandeja: { valor: "C" },
    sensor: { valor: "C" },
    corrente: { valor: "C" },
    redutor: { valor: "C" },
    "temp-longitudinal": { numero: 170 },
    "temp-transversal": { numero: 185 },
    pressao: { numero: 6 },
    velocidade: { numero: 100 },
  },
  criadoEm: as("07:50").toISOString(),
  turnoChave: "2026-10-16T1",
  postoId: "bis-2-embalagem",
  equipamentoId: "loeschpack-4",
  usuarioId: "u-alberto",
  dispositivoId: "tablet",
  syncStatus: "sincronizado",
  naoConformes: 1,
};

describe("A-ATRASO (RN-01)", () => {
  it("abre alerta de atenção quando a tarefa obrigatória passa do prazo", () => {
    const atraso = alertas(as("06:40")).find((a) => a.id === "atraso:pre-partida-l4@2026-10-16T1");
    expect(atraso?.criticidade).toBe("atencao");
    expect(atraso?.estado).toBe("aberto");
  });

  it("vira crítico depois de 30 minutos sem registro", () => {
    const atraso = alertas(as("07:05")).find((a) => a.id === "atraso:pre-partida-l4@2026-10-16T1");
    expect(atraso?.criticidade).toBe("critico");
  });

  it("encerra automaticamente quando a tarefa é registrada com atraso", () => {
    const atraso = alertas(as("07:40"), {
      conclusoes: {
        "pre-partida-l4@2026-10-16T1": { estado: "feita", em: as("06:45").toISOString(), usuarioId: "u-alberto" },
      },
    }).find((a) => a.id === "atraso:pre-partida-l4@2026-10-16T1");
    expect(atraso?.estado).toBe("resolvido");
    expect(atraso?.criticidade).toBe("atencao");
  });

  it("não alerta tarefa feita no prazo", () => {
    const todos = alertas(as("07:40"), {
      conclusoes: {
        "pre-partida-l4@2026-10-16T1": { estado: "feita", em: as("06:12").toISOString(), usuarioId: "u-alberto" },
      },
    });
    expect(todos.some((a) => a.tarefaId === "pre-partida-l4@2026-10-16T1")).toBe(false);
  });
});

describe("A-NC (RN-02)", () => {
  it("abre alerta crítico para item crítico não conforme, com o detalhe do item", () => {
    const nc = alertas(as("07:55"), { registros: [registroPpliComNc] }).find((a) => a.regra === "A-NC");
    expect(nc?.criticidade).toBe("critico");
    expect(nc?.itensNaoConformes).toEqual([
      {
        texto: "Mordentes sem resíduo de chocolate",
        detalhe: "Não conforme · Resíduo de chocolate no mordente",
        critico: true,
      },
    ]);
  });

  it("segue o ciclo aberto → em tratamento → resolvido", () => {
    const id = "nc:reg-1";
    const assumir: AcaoAlerta = {
      tipo: "assumir",
      texto: "Assumido",
      usuarioId: "u-renata",
      em: as("08:00").toISOString(),
    };
    const resolver: AcaoAlerta = {
      tipo: "resolver",
      texto: "Mordente limpo",
      usuarioId: "u-renata",
      em: as("08:20").toISOString(),
    };

    const emTratamento = alertas(as("08:05"), { registros: [registroPpliComNc], tratamentos: { [id]: [assumir] } });
    expect(emTratamento.find((a) => a.id === id)).toMatchObject({ estado: "em_tratamento", responsavelId: "u-renata" });

    const resolvido = alertas(as("08:25"), {
      registros: [registroPpliComNc],
      tratamentos: { [id]: [assumir, resolver] },
    });
    expect(resolvido.find((a) => a.id === id)?.estado).toBe("resolvido");
  });
});

describe("ordenação", () => {
  it("lista abertos e críticos primeiro", () => {
    const lista = alertas(as("08:30"), { registros: [registroPpliComNc] });
    const estados = lista.map((a) => a.estado);
    expect(estados.indexOf("resolvido") === -1 || estados.indexOf("aberto") < estados.indexOf("resolvido")).toBe(true);
    expect(lista[0]?.criticidade).toBe("critico");
  });
});
