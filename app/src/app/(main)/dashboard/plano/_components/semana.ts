import { localRepository } from "@/data/repository";
import { dataLocal } from "@/domain/producao";
import type { ItemPlano, Linha, PlanoProducao, Sku } from "@/domain/types";
import { formatarHora } from "@/lib/format";

/** Data local de uma chave AAAA-MM-DD (meia-noite no fuso do tablet). */
export function deChave(data: string): Date {
  const [a, m, d] = data.split("-").map(Number);
  return new Date(a ?? 2026, (m ?? 1) - 1, d ?? 1);
}

/** Os sete dias (seg a dom) da semana que começa em `semana`. */
export function diasDaSemana(semana: string): string[] {
  const inicio = deChave(semana);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(d.getDate() + i);
    return dataLocal(d);
  });
}

const DIA_CURTO = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const DIA_MES = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
const DIA_MES_LONGO = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" });

/** "seg" (sem o ponto do Intl). */
export function diaCurto(data: string): string {
  return DIA_CURTO.format(deChave(data)).replace(".", "");
}

/** "19/10". */
export function diaMes(data: string): string {
  return DIA_MES.format(deChave(data));
}

/** "19 a 25 de out." ou "26 de out. a 1 de nov.". */
export function rotuloDaSemana(semana: string): string {
  const dias = diasDaSemana(semana);
  const inicio = deChave(dias[0] ?? semana);
  const fim = deChave(dias[6] ?? semana);
  if (inicio.getMonth() === fim.getMonth()) return `${inicio.getDate()} a ${DIA_MES_LONGO.format(fim)}`;
  return `${DIA_MES_LONGO.format(inicio)} a ${DIA_MES_LONGO.format(fim)}`;
}

const TON = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const TON_HORA = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Toneladas com uma casa ("68,7"). */
export function formatarTon(t: number): string {
  return TON.format(t);
}

/** Meta por hora com duas casas ("2,86"). */
export function formatarTonHora(t: number): string {
  return TON_HORA.format(t);
}

export interface LinhaDoSku {
  sku: Sku;
  /** Toneladas por dia, na ordem de `diasDaSemana`. */
  porDia: number[];
  total: number;
}

export interface GrupoDaLinha {
  linha: Linha;
  skus: LinhaDoSku[];
  porDia: number[];
  total: number;
}

/**
 * Plano da semana agrupado por linha e SKU, na ordem do cadastro de linhas. SKUs sem nenhuma tonelada na semana ficam
 * de fora; uma linha sem plano aparece vazia, para não sumir da tabela.
 */
export function agruparPlano(itens: readonly ItemPlano[], dias: readonly string[]): GrupoDaLinha[] {
  const linhas = localRepository.plantas().flatMap((p) => localRepository.linhas(p.id));
  return linhas.map((linha) => {
    const skus: LinhaDoSku[] = [];
    for (const sku of localRepository.skus(linha.id)) {
      const porDia = dias.map((data) =>
        itens
          .filter((i) => i.linhaId === linha.id && i.skuId === sku.id && i.data === data)
          .reduce((soma, i) => soma + i.toneladas, 0),
      );
      const total = porDia.reduce((s, t) => s + t, 0);
      if (total > 0) skus.push({ sku, porDia, total });
    }
    const porDia = dias.map((_, i) => skus.reduce((s, l) => s + (l.porDia[i] ?? 0), 0));
    return { linha, skus, porDia, total: porDia.reduce((s, t) => s + t, 0) };
  });
}

const DIA_E_HORA = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });

/** "Exemplo do SAP" ou "Importado de plano.xlsx por Carlos Mendes, seg., 19/10 às 07:52". */
export function origemDoPlano(plano: PlanoProducao): string {
  if (plano.origem === "seed")
    return `Exemplo do SAP${plano.arquivo ? ` (${plano.arquivo})` : ""}, ainda sem importação.`;
  const quem = plano.publicadoPor ? localRepository.usuario(plano.publicadoPor)?.nome : undefined;
  const quando = plano.publicadoEm ? new Date(plano.publicadoEm) : undefined;
  return [
    `Importado${plano.arquivo ? ` de ${plano.arquivo}` : ""}`,
    quem && ` por ${quem}`,
    quando && `, ${DIA_E_HORA.format(quando)} às ${formatarHora(quando)}`,
    ".",
  ]
    .filter(Boolean)
    .join("");
}
