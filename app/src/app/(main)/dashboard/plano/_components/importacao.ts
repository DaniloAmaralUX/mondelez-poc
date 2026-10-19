// Leitura da planilha do plano (RM-01): CSV ou XLSX vira itens do plano, com validação por linha. Puro, exceto a
// leitura do arquivo (`lerArquivo`), que usa o File do navegador.

import { localRepository } from "@/data/repository";
import { type ColunaCsv, paraCsv } from "@/domain/csv";
import { dataLocal, semanaDe } from "@/domain/producao";
import type { ItemPlano, Linha, Sku } from "@/domain/types";

import { deChave, diaMes, diasDaSemana } from "./semana";

export type Celula = string | number | boolean | Date | null;

/** Colunas do modelo, na ordem do arquivo. */
export const COLUNAS = ["Linha", "SKU", "Data", "Toneladas"] as const;
type Coluna = (typeof COLUNAS)[number];

export interface LinhaLida {
  /** Número da linha na planilha (o cabeçalho é a 1). */
  numero: number;
  /** Texto de cada coluna como veio, para a prévia. */
  original: Record<Coluna, string>;
  item?: ItemPlano;
  erros: string[];
}

export interface Leitura {
  arquivo: string;
  semana: string;
  linhas: LinhaLida[];
  /** Erro do arquivo inteiro (formato, colunas). Com ele, `linhas` vem vazio. */
  erroGeral?: string;
}

/** Sem acento, minúsculas, sem espaços extras. */
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function texto(celula: Celula | undefined): string {
  if (celula === null || celula === undefined) return "";
  if (celula instanceof Date) return dataLocal(dataDaCelulaXlsx(celula));
  if (typeof celula === "number") return Number.isInteger(celula) ? String(celula) : celula.toLocaleString("pt-BR");
  return String(celula).trim();
}

/** O read-excel-file entrega a data da célula à meia-noite UTC: a data do plano é o dia escrito, não o fuso. */
function dataDaCelulaXlsx(d: Date): Date {
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Qual coluna do modelo é este título (aceita os nomes usuais do SAP). */
function colunaDoTitulo(titulo: string): Coluna | undefined {
  const t = normalizar(titulo);
  if (t === "linha" || t.startsWith("linha ")) return "Linha";
  if (t === "sku" || t.startsWith("sku ") || t === "material" || t.startsWith("codigo")) return "SKU";
  if (t === "data" || t === "dia" || t.startsWith("data ")) return "Data";
  if (t.startsWith("ton") || t === "t" || t === "quantidade (t)") return "Toneladas";
  return undefined;
}

// CSV ----------------------------------------------------------------------------------------------------------------

/**
 * CSV com `;` (Excel em português, o que o "Baixar modelo" gera) ou `,`, aspas duplas e BOM. O separador é o que
 * mais aparece na primeira linha.
 */
export function lerCsv(conteudo: string): Celula[][] {
  const textoLimpo = conteudo.replace(/^﻿/, "");
  const primeira = textoLimpo.split(/\r?\n/, 1)[0] ?? "";
  const separador = (primeira.match(/;/g)?.length ?? 0) >= (primeira.match(/,/g)?.length ?? 0) ? ";" : ",";
  const linhas: Celula[][] = [];
  let linha: string[] = [];
  let campo = "";
  let aspas = false;
  for (let i = 0; i < textoLimpo.length; i++) {
    const c = textoLimpo[i];
    if (aspas) {
      if (c === '"' && textoLimpo[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === separador) {
      linha.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && textoLimpo[i + 1] === "\n") i++;
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = "";
    } else campo += c;
  }
  if (campo || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }
  return linhas;
}

// Arquivo ------------------------------------------------------------------------------------------------------------

export class ArquivoInvalido extends Error {}

/** Lê .csv ou .xlsx (primeira aba) no navegador. O leitor de Excel só baixa quando alguém importa. */
export async function lerArquivo(arquivo: File): Promise<Celula[][]> {
  const nome = arquivo.name.toLowerCase();
  if (nome.endsWith(".csv")) return lerCsv(await arquivo.text());
  if (nome.endsWith(".xlsx")) {
    const { readSheet } = await import("read-excel-file/browser");
    try {
      // Os tipos do read-excel-file declaram a data como `typeof Date`; em execução é um Date.
      return (await readSheet(arquivo)) as unknown as Celula[][];
    } catch {
      throw new ArquivoInvalido("Não deu para ler a planilha. Salve de novo como .xlsx (Excel 2007 ou mais novo).");
    }
  }
  if (nome.endsWith(".xls"))
    throw new ArquivoInvalido("Arquivo .xls antigo: salve como .xlsx ou .csv e importe de novo.");
  throw new ArquivoInvalido("Formato não aceito. Use a planilha do SAP em .xlsx ou o modelo em .csv.");
}

// Validação ----------------------------------------------------------------------------------------------------------

function todasAsLinhas(): readonly Linha[] {
  return localRepository.plantas().flatMap((p) => localRepository.linhas(p.id));
}

function acharLinha(valor: string): Linha | undefined {
  const v = normalizar(valor).replace(/^linha /, "");
  if (!v) return undefined;
  return todasAsLinhas().find(
    (l) => normalizar(l.nome) === v || l.id === v || normalizar(l.nome).replace(/\s/g, "") === v.replace(/[\s-]/g, ""),
  );
}

function skuConfere(sku: Sku, valor: string): boolean {
  const v = normalizar(valor);
  return sku.codigo === valor.trim() || sku.id === v || normalizar(sku.descricao) === v;
}

/** Número em pt-BR ("68,7", "1.234,5") ou com ponto ("68.7"). */
function lerNumero(celula: Celula | undefined): number | null {
  if (typeof celula === "number") return celula;
  const t = texto(celula).replace(/\s/g, "");
  if (!t) return null;
  const normal = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  if (!/^-?\d+(\.\d+)?$/.test(normal)) return Number.NaN;
  return Number(normal);
}

/** AAAA-MM-DD, DD/MM/AAAA, DD/MM/AA, data do Excel ou número de série do Excel. Inválida: null. */
function lerData(celula: Celula | undefined): string | null {
  if (celula instanceof Date) return Number.isNaN(celula.getTime()) ? null : dataLocal(dataDaCelulaXlsx(celula));
  if (typeof celula === "number") {
    // Série do Excel (dias desde 30/12/1899), quando a célula não tem formato de data.
    if (celula < 20000 || celula > 80000) return null;
    const utc = new Date(Date.UTC(1899, 11, 30) + Math.round(celula) * 86_400_000);
    return dataLocal(dataDaCelulaXlsx(utc));
  }
  const t = texto(celula);
  let a: number;
  let m: number;
  let d: number;
  const iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const br = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (iso) [a, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (br) [d, m, a] = [Number(br[1]), Number(br[2]), Number(br[3]?.length === 2 ? `20${br[3]}` : br[3])];
  else return null;
  const data = new Date(a, m - 1, d);
  if (data.getFullYear() !== a || data.getMonth() !== m - 1 || data.getDate() !== d) return null;
  return dataLocal(data);
}

/** Semana mais frequente nas datas válidas da planilha; sem nenhuma, a semana padrão. */
function semanaDaPlanilha(datas: readonly string[], padrao: string): string {
  const contagem = new Map<string, number>();
  for (const data of datas) {
    const s = semanaDe(deChave(data));
    contagem.set(s, (contagem.get(s) ?? 0) + 1);
  }
  let melhor = padrao;
  let maior = 0;
  for (const [s, n] of contagem) {
    if (n > maior) [melhor, maior] = [s, n];
  }
  return melhor;
}

/**
 * Tabela lida → itens do plano, linha a linha. Erros por linha: linha de produção ou SKU desconhecido (ou SKU de outra
 * linha), toneladas inválidas ou negativas, data inválida ou fora da semana, e a mesma linha × SKU × dia repetida. A
 * semana é a da maioria das datas; linhas em branco são ignoradas.
 */
export function montarLeitura(tabela: readonly Celula[][], arquivo: string, semanaPadrao: string): Leitura {
  const indiceCabecalho = tabela.findIndex((linha) => {
    const colunas = new Set(linha.map((c) => colunaDoTitulo(texto(c))));
    return COLUNAS.every((c) => colunas.has(c));
  });
  if (indiceCabecalho < 0) {
    return {
      arquivo,
      semana: semanaPadrao,
      linhas: [],
      erroGeral: `Não achei as colunas ${COLUNAS.join(", ")}. Baixe o modelo para ver o formato.`,
    };
  }

  const cabecalho = tabela[indiceCabecalho] ?? [];
  const posicao = {} as Record<Coluna, number>;
  cabecalho.forEach((c, i) => {
    const coluna = colunaDoTitulo(texto(c));
    if (coluna && posicao[coluna] === undefined) posicao[coluna] = i;
  });

  const brutas = tabela
    .slice(indiceCabecalho + 1)
    .map((linha, i) => ({ linha, numero: indiceCabecalho + i + 2 }))
    .filter(({ linha }) => linha.some((c) => texto(c) !== ""));

  const datasValidas = brutas.map(({ linha }) => lerData(linha[posicao.Data])).filter((d) => d !== null);
  const semana = semanaDaPlanilha(datasValidas, semanaPadrao);
  const dias = new Set(diasDaSemana(semana));
  const primeiraVez = new Map<string, number>();

  const linhas = brutas.map(({ linha, numero }): LinhaLida => {
    const original = Object.fromEntries(COLUNAS.map((c) => [c, texto(linha[posicao[c]])])) as Record<Coluna, string>;
    const erros: string[] = [];

    const linhaProducao = acharLinha(original.Linha);
    if (!original.Linha) erros.push("Linha em branco.");
    else if (!linhaProducao) erros.push(`Linha "${original.Linha}" não existe na fábrica.`);

    let sku: Sku | undefined;
    if (!original.SKU) erros.push("SKU em branco.");
    else if (linhaProducao) {
      sku = localRepository.skus(linhaProducao.id).find((s) => skuConfere(s, original.SKU));
      if (!sku) {
        const deOutra = localRepository.skus().find((s) => skuConfere(s, original.SKU));
        erros.push(
          deOutra
            ? `SKU ${original.SKU} não roda na ${linhaProducao.nome}.`
            : `SKU ${original.SKU} não está no cadastro.`,
        );
      }
    }

    const data = lerData(linha[posicao.Data]);
    if (!original.Data) erros.push("Data em branco.");
    else if (!data) erros.push(`Data "${original.Data}" inválida: use DD/MM/AAAA.`);
    else if (!dias.has(data)) {
      const todos = [...dias];
      erros.push(
        `Data ${diaMes(data)} fora da semana de ${diaMes(todos[0] ?? semana)} a ${diaMes(todos[6] ?? semana)}.`,
      );
    }

    const toneladas = lerNumero(linha[posicao.Toneladas]);
    if (toneladas === null) erros.push("Toneladas em branco.");
    else if (Number.isNaN(toneladas)) erros.push(`Toneladas "${original.Toneladas}" não é um número.`);
    else if (toneladas < 0) erros.push("Toneladas negativas.");

    if (linhaProducao && sku && data) {
      const chave = `${linhaProducao.id}|${sku.id}|${data}`;
      const anterior = primeiraVez.get(chave);
      if (anterior !== undefined) erros.push(`Repetida: a linha ${anterior} já tem esta linha, SKU e dia.`);
      else primeiraVez.set(chave, numero);
    }

    const item =
      erros.length === 0 && linhaProducao && sku && data && toneladas !== null
        ? { linhaId: linhaProducao.id, skuId: sku.id, data, toneladas: Math.round(toneladas * 1000) / 1000 }
        : undefined;
    return { numero, original, item, erros };
  });

  return { arquivo, semana, linhas };
}

// Modelo -------------------------------------------------------------------------------------------------------------

const COLUNAS_DO_MODELO: ColunaCsv<ItemPlano>[] = [
  { titulo: "Linha", valor: (i) => localRepository.linha(i.linhaId)?.nome ?? i.linhaId },
  { titulo: "SKU", valor: (i) => localRepository.sku(i.skuId)?.codigo ?? i.skuId },
  { titulo: "Data", valor: (i) => deChave(i.data).toLocaleDateString("pt-BR") },
  { titulo: "Toneladas", valor: (i) => i.toneladas },
];

/** CSV do modelo (colunas Linha, SKU, Data, Toneladas) já preenchido com o plano da semana mostrada. */
export function modeloCsv(itens: readonly ItemPlano[]): string {
  return paraCsv(itens, COLUNAS_DO_MODELO);
}
