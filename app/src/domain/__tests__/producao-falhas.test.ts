import { describe, expect, it } from "vitest";

import { gerarAlertasDeIndicadores, situacaoDoPedido } from "../alertas-indicadores";
import { paraCsv } from "../csv";
import { escalaDoDia, turmaDoTurno, turnoDaTurma } from "../escala";
import { falhasRepetidas, indicadoresDeFalha, maiorParada, pareto } from "../falhas";
import { NOME_DO_PERFIL, pode } from "../permissoes";
import { caixasPara, farol, ge, metaHora, resumoDaSerie, semanaDe, serieDoTurno, toneladas } from "../producao";
import { montarTurno } from "../turno";
import type { ApontamentoHora, EventoFalha, PedidoAjuda, Sku, TipoFalha } from "../types";

const SKU: Sku = {
  id: "s1",
  codigo: "1",
  descricao: "BIS",
  linhaId: "bis-2",
  pesoCaixaKg: 4,
  capacidadeTonHora: 3,
};
const turno = montarTurno(1, new Date(2026, 9, 16));
const em = (h: number, m = 0) => new Date(2026, 9, 16, h, m);
const tipos: TipoFalha[] = [
  { id: "enrosco", nome: "Enrosco" },
  { id: "selagem", nome: "Selagem enrugada", critica: true },
];

function apontamento(hora: number, caixas: number): ApontamentoHora {
  return {
    id: `hxh#${hora}`,
    postoId: "p",
    linhaId: "bis-2",
    turnoChave: "2026-10-16T1",
    bloco: em(hora).toISOString(),
    skuId: "s1",
    caixas,
    usuarioId: "u",
    em: em(hora + 1, 2).toISOString(),
  };
}

function falha(id: string, tipoId: string, inicio: Date, minutos?: number): EventoFalha {
  return {
    id,
    postoId: "p",
    equipamentoId: "e",
    turnoChave: "2026-10-16T1",
    tipoId,
    inicio: inicio.toISOString(),
    fim: minutos === undefined ? undefined : new Date(inicio.getTime() + minutos * 60_000).toISOString(),
    usuarioId: "u",
  };
}

describe("produção (RN-03 a RN-05)", () => {
  it("toneladas = caixas × peso por caixa", () => {
    expect(toneladas(750, SKU)).toBe(3);
    expect(caixasPara(2.9, SKU)).toBe(725);
  });

  it("GE = toneladas ÷ (capacidade × horas); sem horas, null", () => {
    expect(ge(2.4, 3, 1)).toBeCloseTo(0.8);
    expect(ge(1, 3, 0)).toBeNull();
  });

  it("farol: verde ≥ 100 %, amarelo ≥ 90 %, vermelho abaixo", () => {
    expect(farol(10, 10)).toBe("verde");
    expect(farol(9.2, 10)).toBe("amarelo");
    expect(farol(8.9, 10)).toBe("vermelho");
  });

  it("meta da hora = plano do dia ÷ 24 h", () => {
    const itens = [
      { linhaId: "bis-2", skuId: "s1", data: "2026-10-16", toneladas: 48 },
      { linhaId: "bis-2", skuId: "s2", data: "2026-10-16", toneladas: 24 },
      { linhaId: "bis-1", skuId: "s3", data: "2026-10-16", toneladas: 99 },
    ];
    expect(metaHora(itens, "bis-2", "2026-10-16")).toBe(3);
  });

  it("semana do plano começa na segunda-feira", () => {
    expect(semanaDe(new Date(2026, 9, 18))).toBe("2026-10-12");
    expect(semanaDe(new Date(2026, 9, 12))).toBe("2026-10-12");
  });

  it("série do turno: horas apontadas e pendentes entram no acumulado; a hora aberta não", () => {
    const serie = serieDoTurno({
      turno,
      agora: em(9, 5),
      apontamentos: [apontamento(6, 750), apontamento(8, 600)],
      skus: { s1: SKU },
      metaHoraTon: 3,
      skuPadraoId: "s1",
    });
    expect(serie).toHaveLength(8);
    expect(serie.map((h) => h.estado).slice(0, 4)).toEqual(["apontada", "pendente", "apontada", "aberta"]);
    const resumo = resumoDaSerie(serie);
    expect(resumo.toneladas).toBeCloseTo(5.4);
    expect(resumo.metaAcumulada).toBe(9);
    expect(resumo.ge).toBeCloseTo(0.6);
    expect(resumo.farol).toBe("vermelho");
    expect(resumo.horasPendentes).toBe(1);
  });
});

describe("falhas e MTBF (RN-06)", () => {
  const eventos = [
    falha("1", "enrosco", em(6, 20), 10),
    falha("2", "enrosco", em(7, 0), 5),
    falha("3", "selagem", em(7, 30)),
  ];

  it("MTBF = tempo operando ÷ falhas; falha aberta conta até agora", () => {
    const ind = indicadoresDeFalha(eventos, turno, em(8, 0));
    expect(ind.minutosParados).toBe(45);
    expect(ind.minutosOperando).toBe(75);
    expect(ind.mtbfMin).toBe(25);
    expect(ind.emCurso).toBe(1);
  });

  it("falha aberta para de contar no fim do turno", () => {
    const ind = indicadoresDeFalha([falha("x", "enrosco", em(13, 30))], turno, em(15, 0));
    expect(ind.minutosParados).toBe(30);
  });

  it("Pareto por quantidade e maior parada por minutos", () => {
    const p = pareto(eventos, tipos, em(8, 0));
    expect(p.map((i) => [i.tipoId, i.quantidade])).toEqual([
      ["enrosco", 2],
      ["selagem", 1],
    ]);
    expect(p[1]?.acumulado).toBe(100);
    expect(maiorParada(eventos, tipos, em(8, 0))).toMatchObject({ tipoId: "selagem", minutos: 30 });
  });

  it("falha repetida: 3 ou mais do mesmo tipo, com o instante da 3ª", () => {
    const com3 = [...eventos, falha("4", "enrosco", em(7, 45), 2)];
    expect(falhasRepetidas(com3)).toEqual([{ tipoId: "enrosco", vezes: 3, atingidoEm: em(7, 45).toISOString() }]);
    expect(falhasRepetidas(eventos)).toEqual([]);
  });
});

describe("alertas de indicador (RN-07, RN-08)", () => {
  const base = {
    postoId: "p",
    turno,
    turnoChave: "2026-10-16T1",
    tipos,
    perdas: [],
    pedidos: [],
    tratamentos: {},
  };
  const serieCom = (caixas: number[], agora: Date) =>
    serieDoTurno({
      turno,
      agora,
      apontamentos: caixas.map((c, i) => apontamento(6 + i, c)),
      skus: { s1: SKU },
      metaHoraTon: 2.7,
      skuPadraoId: "s1",
    });

  it("A-GE só depois de 3 h e com GE acumulado < 70 %; A-META abaixo da meta − 1,3 t", () => {
    const agora = em(9, 30);
    const alertas = gerarAlertasDeIndicadores({ ...base, agora, serie: serieCom([500, 500, 500], agora), falhas: [] });
    expect(alertas.map((a) => a.regra).sort()).toEqual(["A-GE", "A-META"]);
    const ge = alertas.find((a) => a.regra === "A-GE");
    expect(ge?.criticidade).toBe("critico");
    expect(ge?.estado).toBe("aberto");
  });

  it("antes de 3 h não há A-GE", () => {
    const agora = em(8, 10);
    const alertas = gerarAlertasDeIndicadores({ ...base, agora, serie: serieCom([500, 500], agora), falhas: [] });
    expect(alertas.some((a) => a.regra === "A-GE")).toBe(false);
  });

  it("indicador que volta fecha o alerta sozinho, com nota automática (RN-08)", () => {
    const agora = em(11, 30);
    const alertas = gerarAlertasDeIndicadores({
      ...base,
      agora,
      serie: serieCom([500, 500, 500, 1500, 1500], agora),
      falhas: [],
    });
    const ge = alertas.find((a) => a.regra === "A-GE");
    expect(ge?.estado).toBe("resolvido");
    expect(ge?.acoes.at(-1)?.tipo).toBe("automatica");
  });

  it("A-REPET com 3 falhas do mesmo tipo; crítico se o tipo é crítico", () => {
    const agora = em(8, 0);
    const falhas = [
      falha("1", "selagem", em(6, 10), 2),
      falha("2", "selagem", em(6, 40), 2),
      falha("3", "selagem", em(7, 10), 2),
    ];
    const alertas = gerarAlertasDeIndicadores({ ...base, agora, serie: [], falhas });
    expect(alertas).toHaveLength(1);
    expect(alertas[0]).toMatchObject({ regra: "A-REPET", criticidade: "critico", moduloSlug: "mtbf" });
    expect(alertas[0]?.contexto).toHaveLength(3);
  });

  it("pedido de ajuda vira A-AJUDA; segurança é crítico; o operador vê quando alguém viu e quando atendeu", () => {
    const pedido: PedidoAjuda = {
      id: "a1",
      postoId: "p",
      motivo: "seguranca",
      texto: "Proteção solta",
      usuarioId: "u",
      em: em(7).toISOString(),
    };
    const alertas = gerarAlertasDeIndicadores({ ...base, agora: em(7, 10), serie: [], falhas: [], pedidos: [pedido] });
    expect(alertas[0]).toMatchObject({ regra: "A-AJUDA", criticidade: "critico", pedidoAjudaId: "a1" });

    expect(situacaoDoPedido(pedido, {}).situacao).toBe("enviado");
    const visto = {
      "ajuda:a1": [{ tipo: "assumir" as const, texto: "", em: em(7, 5).toISOString(), usuarioId: "u-renata" }],
    };
    expect(situacaoDoPedido(pedido, visto)).toMatchObject({ situacao: "visto", por: "u-renata" });
    const atendido = {
      "ajuda:a1": [
        ...visto["ajuda:a1"],
        { tipo: "resolver" as const, texto: "Proteção fixada", em: em(7, 20).toISOString(), usuarioId: "u-renata" },
      ],
    };
    expect(situacaoDoPedido(pedido, atendido)).toMatchObject({ situacao: "atendido", resposta: "Proteção fixada" });
  });

  it("A-PERDA com refugo acima do limite", () => {
    const perdas = [
      {
        id: "s#08",
        postoId: "p",
        turnoChave: "2026-10-16T1",
        bloco: em(7).toISOString(),
        sobrepesoG: 1,
        refugoKg: 32,
        reprocessoKg: 0,
        usuarioId: "u",
        em: em(8, 5).toISOString(),
      },
    ];
    const alertas = gerarAlertasDeIndicadores({ ...base, agora: em(9), serie: [], falhas: [], perdas });
    expect(alertas[0]).toMatchObject({ regra: "A-PERDA", criticidade: "atencao" });
    // bloco guarda o início do bloco de 2 h: o título diz o bloco inteiro, não a hora em que a tarefa abriu.
    expect(alertas[0]?.titulo).toBe("Perdas acima do limite no bloco 07:00–09:00");
  });
});

describe("permissões (doc 05 §4)", () => {
  it("operação registra, não trata alertas nem vê o relatório", () => {
    expect(pode("operacao", "apontamentos", "escrever")).toBe(true);
    expect(pode("operacao", "alertas")).toBe(false);
    expect(pode("operacao", "relatorio")).toBe(false);
  });

  it("assistência administra plano, escala e agenda; especialista, padrões e documentos", () => {
    expect(pode("assistencia", "plano", "administrar")).toBe(true);
    expect(pode("assistencia", "escala", "administrar")).toBe(true);
    expect(pode("especialista", "padroes", "administrar")).toBe(true);
    expect(pode("especialista", "documentos", "administrar")).toBe(true);
    expect(pode("supervisao", "plano", "administrar")).toBe(false);
    expect(pode(undefined, "rotina")).toBe(false);
    expect(NOME_DO_PERFIL.gerencia).toBe("Gerência");
  });
});

describe("escala por turma (RM-06)", () => {
  it("todo dia cada turno tem uma turma e uma folga", () => {
    for (const data of ["2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19"]) {
      const dias = (["A", "B", "C", "D"] as const).map((t) => turnoDaTurma(t, data));
      expect(new Set(dias)).toEqual(new Set([1, 2, 3, "folga"]));
      expect(turmaDoTurno(1, data)).toBeDefined();
    }
  });

  it("ajuste pontual vale por cima da turma", () => {
    const ajustes = {
      "u|2026-10-16": {
        id: "u|2026-10-16",
        usuarioId: "u",
        data: "2026-10-16",
        turno: "folga" as const,
        autorId: "c",
        em: "",
      },
    };
    expect(escalaDoDia({ id: "u", turma: "A" }, "2026-10-16", ajustes)).toEqual({ dia: "folga", ajustado: true });
    expect(escalaDoDia({ id: "x" }, "2026-10-16", {})).toBeNull();
  });
});

describe("CSV do histórico", () => {
  it("separador ;, BOM, aspas quando precisa e número no formato brasileiro", () => {
    const csv = paraCsv(
      [{ a: "PPLI; L4", b: 1.5 }],
      [
        { titulo: "Registro", valor: (l: { a: string; b: number }) => l.a },
        { titulo: "Valor", valor: (l: { a: string; b: number }) => l.b },
      ],
    );
    expect(csv).toBe('﻿Registro;Valor\r\n"PPLI; L4";1,5\r\n');
  });
});
