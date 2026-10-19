import { LIMITE_GE } from "@/domain/alertas-indicadores";
import type { KpisTurno } from "@/domain/types";

/**
 * Formatação dos indicadores do turno, usada pelo Relatório, pela Troca de turno e pelo Painel das linhas (as três telas
 * mostram os mesmos números e precisam escrevê-los igual).
 */

const UMA_CASA = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const INTEIRO = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const DIA_CURTO = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

export function formatarGe(ge: number | null): string {
  return ge === null ? "—" : `${UMA_CASA.format(ge * 100)} %`;
}

export function formatarToneladas(t: number): string {
  return `${UMA_CASA.format(t)} t`;
}

export function formatarMinutos(min: number | null): string {
  return min === null ? "—" : `${INTEIRO.format(Math.round(min))} min`;
}

export function formatarPercentual(fracao: number): string {
  return `${INTEIRO.format(Math.round(fracao * 100))} %`;
}

/** "17/10 · 2º" a partir da chave do turno (2026-10-17T2). */
export function rotuloDoTurno(turnoChave: string): string {
  const [data, numero] = turnoChave.split("T");
  const [a, m, d] = (data ?? "").split("-").map(Number);
  const dia = DIA_CURTO.format(new Date(a ?? 2026, (m ?? 1) - 1, d ?? 1));
  return `${dia} · ${numero}º`;
}

/** Toneladas sobre a meta acumulada até agora (0–1+), ou null quando o posto não aponta caixas. */
export function aderenciaAMeta(kpis: KpisTurno): number | null {
  return kpis.metaToneladas > 0 ? kpis.toneladas / kpis.metaToneladas : null;
}

export function geAbaixoDoLimite(ge: number | null): boolean {
  return ge !== null && ge < LIMITE_GE;
}

export type Tendencia = "melhor" | "pior" | "igual";

export interface Comparacao {
  tendencia: Tendencia;
  /** Diferença já formatada, com sinal ("+1,3 p.p.", "−8 min"). */
  texto: string;
}

function sinal(n: number): string {
  if (n > 0) return "+";
  if (n < 0) return "−";
  return "±";
}

/** Igual dentro da folga; senão melhor quando sobe (ou quando desce, com `menosEMelhor`). */
function tendenciaDe(d: number, folga: number, menosEMelhor = false): Tendencia {
  if (Math.abs(d) < folga || d === 0) return "igual";
  return d > 0 !== menosEMelhor ? "melhor" : "pior";
}

/**
 * Comparação com o turno anterior. GE em pontos percentuais; MTBF em minutos (mais é melhor); alertas e pedidos de
 * ajuda em quantidade (menos é melhor). Diferenças pequenas contam como iguais, para a seta não acender por arredondamento.
 */
export function compararGe(atual: number | null, anterior: number | null): Comparacao | null {
  if (atual === null || anterior === null) return null;
  const pp = (atual - anterior) * 100;
  return { tendencia: tendenciaDe(pp, 0.5), texto: `${sinal(pp)}${UMA_CASA.format(Math.abs(pp))} p.p.` };
}

export function compararMtbf(atual: number | null, anterior: number | null): Comparacao | null {
  if (atual === null || anterior === null) return null;
  const d = Math.round(atual - anterior);
  return { tendencia: tendenciaDe(d, 3), texto: `${sinal(d)}${INTEIRO.format(Math.abs(d))} min` };
}

export function compararQuantidade(atual: number, anterior: number): Comparacao {
  const d = atual - anterior;
  return { tendencia: tendenciaDe(d, 0, true), texto: `${sinal(d)}${Math.abs(d)}` };
}
