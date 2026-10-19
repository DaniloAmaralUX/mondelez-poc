// Exportação CSV do histórico (RF-09). Puro.

export interface ColunaCsv<T> {
  titulo: string;
  valor: (linha: T) => string | number | null | undefined;
}

/** Campo CSV com aspas quando precisa (separador ;, aspas ou quebra de linha). Separador ; para abrir no Excel PT-BR. */
function campo(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return "";
  const texto = typeof valor === "number" ? valor.toLocaleString("pt-BR") : valor;
  return /[;"\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/** CSV com BOM (acentos no Excel), separador ; e quebra CRLF. */
export function paraCsv<T>(linhas: readonly T[], colunas: readonly ColunaCsv<T>[]): string {
  const cabecalho = colunas.map((c) => campo(c.titulo)).join(";");
  const corpo = linhas.map((l) => colunas.map((c) => campo(c.valor(l))).join(";"));
  return `﻿${[cabecalho, ...corpo].join("\r\n")}\r\n`;
}
