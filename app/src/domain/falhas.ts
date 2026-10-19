// Falhas por toque e MTBF (RM-05, RN-06). Puro, sem React nem Next.

import type { EventoFalha, TipoFalha, Turno } from "./types";

const MIN_MS = 60_000;

/** Limite de falhas do mesmo tipo no turno que vira alerta A-REPET (RN-07). */
export const LIMITE_REPETICAO = 3;

/** Fim efetivo de uma falha: o registrado, ou o instante de corte (agora ou fim do turno, o que vier antes). RN-06. */
export function fimEfetivo(evento: EventoFalha, corte: Date): Date {
  return evento.fim ? new Date(evento.fim) : corte;
}

export function duracaoMin(evento: EventoFalha, corte: Date): number {
  const inicio = new Date(evento.inicio).getTime();
  return Math.max(0, (fimEfetivo(evento, corte).getTime() - inicio) / MIN_MS);
}

/** Instante de corte do turno: agora, limitado ao fim do turno. */
export function corteDoTurno(turno: Turno, agora: Date): Date {
  return agora.getTime() < turno.fim.getTime() ? agora : turno.fim;
}

/** Falhas do turno, da mais antiga para a mais recente. */
export function falhasDoTurno(eventos: readonly EventoFalha[], turnoChave: string, postoId?: string): EventoFalha[] {
  return eventos
    .filter((e) => e.turnoChave === turnoChave && (!postoId || e.postoId === postoId))
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
}

export interface IndicadoresFalha {
  falhas: number;
  minutosParados: number;
  /** Tempo de turno decorrido menos o parado. */
  minutosOperando: number;
  /** RN-06: tempo operacional ÷ número de falhas; null sem falhas. */
  mtbfMin: number | null;
  emCurso: number;
}

export function indicadoresDeFalha(eventos: readonly EventoFalha[], turno: Turno, agora: Date): IndicadoresFalha {
  const corte = corteDoTurno(turno, agora);
  const decorrido = Math.max(0, (corte.getTime() - turno.inicio.getTime()) / MIN_MS);
  const minutosParados = eventos.reduce((s, e) => s + duracaoMin(e, corte), 0);
  const minutosOperando = Math.max(0, decorrido - minutosParados);
  return {
    falhas: eventos.length,
    minutosParados,
    minutosOperando,
    mtbfMin: eventos.length > 0 ? minutosOperando / eventos.length : null,
    emCurso: eventos.filter((e) => !e.fim).length,
  };
}

export interface ItemPareto {
  tipoId: string;
  nome: string;
  quantidade: number;
  minutos: number;
  /** % acumulado da quantidade, 0–100. */
  acumulado: number;
}

/** Pareto por quantidade (desempate por minutos parados). */
export function pareto(eventos: readonly EventoFalha[], tipos: readonly TipoFalha[], corte: Date): ItemPareto[] {
  const porTipo = new Map<string, { quantidade: number; minutos: number }>();
  for (const e of eventos) {
    const atual = porTipo.get(e.tipoId) ?? { quantidade: 0, minutos: 0 };
    atual.quantidade += 1;
    atual.minutos += duracaoMin(e, corte);
    porTipo.set(e.tipoId, atual);
  }
  const total = eventos.length;
  let acumulado = 0;
  return [...porTipo.entries()]
    .map(([tipoId, v]) => ({ tipoId, nome: tipos.find((t) => t.id === tipoId)?.nome ?? tipoId, ...v }))
    .sort((a, b) => b.quantidade - a.quantidade || b.minutos - a.minutos)
    .map((item) => {
      acumulado += item.quantidade;
      return { ...item, acumulado: total > 0 ? (acumulado / total) * 100 : 0 };
    });
}

/** Tipo de falha com mais tempo parado no turno ("maior índice de parada" da troca de turno). */
export function maiorParada(eventos: readonly EventoFalha[], tipos: readonly TipoFalha[], corte: Date) {
  const itens = pareto(eventos, tipos, corte).sort((a, b) => b.minutos - a.minutos);
  const primeiro = itens[0];
  return primeiro ? { tipoId: primeiro.tipoId, nome: primeiro.nome, minutos: primeiro.minutos } : undefined;
}

/** Tipos com `LIMITE_REPETICAO` ou mais falhas, com o instante em que o limite foi atingido. */
export function falhasRepetidas(
  eventos: readonly EventoFalha[],
): { tipoId: string; vezes: number; atingidoEm: string }[] {
  const porTipo = new Map<string, EventoFalha[]>();
  for (const e of [...eventos].sort((a, b) => a.inicio.localeCompare(b.inicio))) {
    porTipo.set(e.tipoId, [...(porTipo.get(e.tipoId) ?? []), e]);
  }
  const repetidas: { tipoId: string; vezes: number; atingidoEm: string }[] = [];
  for (const [tipoId, lista] of porTipo) {
    const marco = lista[LIMITE_REPETICAO - 1];
    if (marco) repetidas.push({ tipoId, vezes: lista.length, atingidoEm: marco.inicio });
  }
  return repetidas;
}

/** Falhas que começaram dentro de uma hora (para o contexto do alerta de GE e do Hora x Hora). */
export function falhasNaHora(eventos: readonly EventoFalha[], blocoIso: string): EventoFalha[] {
  const inicio = new Date(blocoIso).getTime();
  return eventos.filter((e) => {
    const t = new Date(e.inicio).getTime();
    return t >= inicio && t < inicio + 60 * MIN_MS;
  });
}
