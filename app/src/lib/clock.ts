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
