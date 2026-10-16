/**
 * Relógio injetável (D6). O horário simulado anda junto com o real a partir de uma âncora,
 * para a demo ser previsível e os testes determinísticos.
 */
export interface ClockAnchor {
  /** Horário simulado no momento da ancoragem (ISO). */
  simulado: string;
  /** Epoch real (ms) no momento da ancoragem. */
  real: number;
}

export function agoraSimulado(anchor: ClockAnchor, realAgora: number = Date.now()): Date {
  return new Date(new Date(anchor.simulado).getTime() + (realAgora - anchor.real));
}

/** Âncora padrão da demo: hoje às 07:40, no meio do 1º turno. */
export function ancoraPadrao(realAgora: number = Date.now()): ClockAnchor {
  const d = new Date(realAgora);
  d.setHours(7, 40, 0, 0);
  return { simulado: d.toISOString(), real: realAgora };
}

export function avancar(anchor: ClockAnchor, minutos: number, realAgora: number = Date.now()): ClockAnchor {
  const atual = agoraSimulado(anchor, realAgora);
  return { simulado: new Date(atual.getTime() + minutos * 60 * 1000).toISOString(), real: realAgora };
}

export const MINUTO_MS = 60_000;

/** Minuto simulado corrente (minutos desde a época); muda exatamente na virada do minuto do relógio da demo. */
export function minutoSimulado(anchor: ClockAnchor, realAgora: number = Date.now()): number {
  return Math.floor(agoraSimulado(anchor, realAgora).getTime() / MINUTO_MS);
}

/** Milissegundos reais até a próxima virada de minuto simulado (o simulado anda junto com o real). */
export function msAteViradaDoMinuto(anchor: ClockAnchor, realAgora: number = Date.now()): number {
  const resto = agoraSimulado(anchor, realAgora).getTime() % MINUTO_MS;
  return MINUTO_MS - (resto < 0 ? resto + MINUTO_MS : resto);
}

export function mesmaAncora(a: ClockAnchor, b: ClockAnchor): boolean {
  return a.simulado === b.simulado && a.real === b.real;
}
