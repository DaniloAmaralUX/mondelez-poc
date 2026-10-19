import { describe, expect, it } from "vitest";

import { type Celula, lerCsv, modeloCsv, montarLeitura } from "./importacao";

const SEMANA = "2026-10-19";
const CAB: Celula[] = ["Linha", "SKU", "Data", "Toneladas"];

describe("lerCsv", () => {
  it("lê o CSV do Excel pt-BR (BOM, ponto e vírgula, aspas)", () => {
    const tabela = lerCsv('﻿Linha;SKU;Data;Toneladas\r\n"Bis 2";7622300990121;19/10/2026;"68,7"\r\n');
    expect(tabela).toEqual([CAB, ["Bis 2", "7622300990121", "19/10/2026", "68,7"]]);
  });

  it("aceita vírgula como separador", () => {
    expect(lerCsv("Linha,SKU,Data,Toneladas\nBis 1,x,2026-10-19,1.5")[1]).toEqual(["Bis 1", "x", "2026-10-19", "1.5"]);
  });
});

describe("montarLeitura", () => {
  it("monta itens válidos com data do Excel, número e texto", () => {
    const leitura = montarLeitura(
      [
        ["Plano semanal SAP"],
        CAB,
        ["Bis 2", "7622300990121", new Date(Date.UTC(2026, 9, 20)), 68.7],
        ["bis 2", "BIS BLACK 100,8G 40X", "21/10/2026", "22,5"],
        [null, null, null, null],
      ],
      "plano.xlsx",
      "2026-10-26",
    );
    expect(leitura.erroGeral).toBeUndefined();
    expect(leitura.semana).toBe(SEMANA);
    expect(leitura.linhas.map((l) => l.item)).toEqual([
      { linhaId: "bis-2", skuId: "bis-leite-126", data: "2026-10-20", toneladas: 68.7 },
      { linhaId: "bis-2", skuId: "bis-black-100", data: "2026-10-21", toneladas: 22.5 },
    ]);
    expect(leitura.linhas[0]?.numero).toBe(3);
  });

  it("aponta cada erro na linha da planilha", () => {
    const leitura = montarLeitura(
      [
        CAB,
        ["Bis 2", "7622300990121", "19/10/2026", 10],
        ["Bis 9", "7622300990121", "19/10/2026", 10],
        ["Bis 1", "7622300990169", "19/10/2026", 10],
        ["Bis 3", "7622300990152", "20/10/2026", -5],
        ["Bis 4", "7622300990169", "03/11/2026", 66],
        ["Bis 3", "7622300990152", "31/02/2026", "abc"],
        ["Bis 2", "7622300990121", "19/10/2026", 1],
      ],
      "plano.csv",
      SEMANA,
    );
    const erros = leitura.linhas.map((l) => l.erros);
    expect(erros[0]).toEqual([]);
    expect(erros[1]?.[0]).toMatch(/Bis 9.*não existe/);
    expect(erros[2]?.[0]).toMatch(/não roda na Bis 1/);
    expect(erros[3]).toEqual(["Toneladas negativas."]);
    expect(erros[4]?.[0]).toMatch(/fora da semana/);
    expect(erros[5]).toEqual(['Data "31/02/2026" inválida: use DD/MM/AAAA.', 'Toneladas "abc" não é um número.']);
    expect(erros[6]?.[0]).toMatch(/Repetida: a linha 2/);
    expect(leitura.linhas.filter((l) => l.item)).toHaveLength(1);
  });

  it("sem as colunas do modelo, erro do arquivo", () => {
    expect(montarLeitura([["Produto", "Qtd"]], "x.csv", SEMANA).erroGeral).toMatch(/Linha, SKU, Data, Toneladas/);
  });

  it("o modelo baixado volta igual na importação", () => {
    const itens = [
      { linhaId: "bis-2", skuId: "bis-leite-126", data: "2026-10-19", toneladas: 1234.5 },
      { linhaId: "bis-1", skuId: "bis-leite-126-l1", data: "2026-10-25", toneladas: 0 },
    ];
    const leitura = montarLeitura(lerCsv(modeloCsv(itens)), "modelo.csv", SEMANA);
    expect(leitura.linhas.map((l) => l.item)).toEqual(itens);
  });
});
