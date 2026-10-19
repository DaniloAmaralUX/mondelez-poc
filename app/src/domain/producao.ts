// Produção do turno: toneladas, meta, GE e farol (RN-03, RN-04, RN-05). Puro, sem React nem Next.

import type { ApontamentoHora, ItemPlano, Sku, Turno } from "./types";

const HORA_MS = 60 * 60 * 1000;

/** Horas programadas por dia na linha: três turnos de 8 h (RN-05). */
export const HORAS_PROGRAMADAS_DIA = 24;

/** Farol da meta acumulada (RN-05): verde ≥ 100 %, amarelo ≥ 90 %, vermelho abaixo. */
export type Farol = "verde" | "amarelo" | "vermelho";

/** Toneladas de uma quantidade de caixas (RN-03). */
export function toneladas(caixas: number, sku: Pick<Sku, "pesoCaixaKg">): number {
  return (caixas * sku.pesoCaixaKg) / 1000;
}

/** Caixas que dão uma tonelagem (arredondado para cima), para mostrar a meta em caixas ao operador. */
export function caixasPara(toneladasAlvo: number, sku: Pick<Sku, "pesoCaixaKg">): number {
  return Math.ceil((toneladasAlvo * 1000) / sku.pesoCaixaKg);
}

/**
 * GE (RN-04) = toneladas produzidas ÷ (capacidade nominal t/h × horas). Definição a validar com a Mondelez; o rótulo da
 * tela diz isso. Sem horas, null.
 */
export function ge(toneladasProduzidas: number, capacidadeTonHora: number, horas: number): number | null {
  if (horas <= 0 || capacidadeTonHora <= 0) return null;
  return toneladasProduzidas / (capacidadeTonHora * horas);
}

export function farol(realizado: number, meta: number): Farol {
  if (meta <= 0) return "verde";
  const razao = realizado / meta;
  if (razao >= 1) return "verde";
  if (razao >= 0.9) return "amarelo";
  return "vermelho";
}

/** Data local AAAA-MM-DD (chave do plano). */
export function dataLocal(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Segunda-feira da semana de `d` (AAAA-MM-DD), id do plano. */
export function semanaDe(d: Date): string {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  const dia = s.getDay();
  s.setDate(s.getDate() - (dia === 0 ? 6 : dia - 1));
  return dataLocal(s);
}

/** Itens do plano de uma linha num dia, com toneladas > 0, na ordem do plano. */
export function planoDoDia(itens: readonly ItemPlano[], linhaId: string, data: string): ItemPlano[] {
  return itens.filter((i) => i.linhaId === linhaId && i.data === data && i.toneladas > 0);
}

/**
 * Meta por hora da linha (RN-05): plano do dia ÷ horas programadas. Com mais de um SKU no dia, a soma; sem plano, 0.
 */
export function metaHora(itens: readonly ItemPlano[], linhaId: string, data: string): number {
  const total = planoDoDia(itens, linhaId, data).reduce((soma, i) => soma + i.toneladas, 0);
  return total / HORAS_PROGRAMADAS_DIA;
}

/** SKU em produção: o primeiro do plano do dia da linha. */
export function skuDoDia(itens: readonly ItemPlano[], linhaId: string, data: string): string | undefined {
  return planoDoDia(itens, linhaId, data)[0]?.skuId;
}

export type EstadoHora = "apontada" | "aberta" | "pendente" | "futura";

export interface HoraDoTurno {
  /** Início da hora (ISO). */
  bloco: string;
  /** "06:00". */
  rotulo: string;
  estado: EstadoHora;
  apontamento?: ApontamentoHora;
  caixas: number | null;
  toneladas: number | null;
  metaToneladas: number;
  /** GE da hora (0–1) ou null sem apontamento. */
  ge: number | null;
  toneladasAcumuladas: number;
  metaAcumulada: number;
  geAcumulado: number | null;
  farolAcumulado: Farol | null;
}

export interface SerieHoraInput {
  turno: Turno;
  agora: Date;
  apontamentos: readonly ApontamentoHora[];
  /** SKUs por id, para peso e capacidade de cada apontamento. */
  skus: Readonly<Record<string, Sku>>;
  /** Meta da hora (t) e SKU padrão do dia. */
  metaHoraTon: number;
  skuPadraoId: string;
  /** Minutos depois do fim da hora em que ela ainda pode ser apontada sem virar pendente (janela da tarefa). */
  toleranciaMin?: number;
}

/**
 * As oito horas do turno com apontamento, meta, GE da hora e acumulados (RM-10). Acumulados contam só as horas
 * já encerradas ou apontadas: a hora em curso sem apontamento não puxa o GE para baixo.
 */
export function serieDoTurno({
  turno,
  agora,
  apontamentos,
  skus,
  metaHoraTon,
  skuPadraoId,
  toleranciaMin = 10,
}: SerieHoraInput): HoraDoTurno[] {
  const porBloco = new Map(apontamentos.map((a) => [new Date(a.bloco).getTime(), a]));
  const horas: HoraDoTurno[] = [];
  let tonAcum = 0;
  let metaAcum = 0;
  let horasContadas = 0;
  let capacidadeAcum = 0;

  for (let inicio = turno.inicio.getTime(); inicio < turno.fim.getTime(); inicio += HORA_MS) {
    const bloco = new Date(inicio);
    const fimHora = inicio + HORA_MS;
    const apontamento = porBloco.get(inicio);
    const sku = skus[apontamento?.skuId ?? skuPadraoId];
    const ton = apontamento && sku ? toneladas(apontamento.caixas, sku) : null;

    let estado: EstadoHora;
    if (apontamento) estado = "apontada";
    else if (agora.getTime() < inicio) estado = "futura";
    else if (agora.getTime() < fimHora + toleranciaMin * 60_000) estado = "aberta";
    else estado = "pendente";

    const conta = estado === "apontada" || estado === "pendente";
    if (conta) {
      tonAcum += ton ?? 0;
      metaAcum += metaHoraTon;
      horasContadas += 1;
      capacidadeAcum += sku?.capacidadeTonHora ?? 0;
    }

    horas.push({
      bloco: bloco.toISOString(),
      rotulo: `${String(bloco.getHours()).padStart(2, "0")}:00`,
      estado,
      apontamento,
      caixas: apontamento?.caixas ?? null,
      toneladas: ton,
      metaToneladas: metaHoraTon,
      ge: ton !== null && sku ? ge(ton, sku.capacidadeTonHora, 1) : null,
      toneladasAcumuladas: tonAcum,
      metaAcumulada: metaAcum,
      geAcumulado: horasContadas > 0 && capacidadeAcum > 0 ? tonAcum / capacidadeAcum : null,
      farolAcumulado: horasContadas > 0 ? farol(tonAcum, metaAcum) : null,
    });
  }
  return horas;
}

/** Resumo do turno a partir da série: o último ponto com horas contadas. */
export function resumoDaSerie(serie: readonly HoraDoTurno[]) {
  const contadas = serie.filter((h) => h.estado === "apontada" || h.estado === "pendente");
  const ultima = contadas.at(-1);
  return {
    toneladas: ultima?.toneladasAcumuladas ?? 0,
    metaAcumulada: ultima?.metaAcumulada ?? 0,
    ge: ultima?.geAcumulado ?? null,
    farol: ultima?.farolAcumulado ?? null,
    horasApontadas: serie.filter((h) => h.estado === "apontada").length,
    horasPendentes: serie.filter((h) => h.estado === "pendente").length,
    metaTurno: serie.reduce((s, h) => s + h.metaToneladas, 0),
  };
}
