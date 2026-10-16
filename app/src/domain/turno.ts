import type { NumeroTurno, Turno } from "./types";

/** Horário de início de cada turno (8 h cada). */
export const INICIO_TURNO: Record<NumeroTurno, number> = { 1: 6, 2: 14, 3: 22 };
export const DURACAO_TURNO_HORAS = 8;

function emHora(base: Date, hora: number): Date {
  const d = new Date(base);
  d.setHours(hora, 0, 0, 0);
  return d;
}

export function turnoAtual(agora: Date): Turno {
  const h = agora.getHours();

  if (h >= INICIO_TURNO[1] && h < INICIO_TURNO[2]) return montarTurno(1, agora);
  if (h >= INICIO_TURNO[2] && h < INICIO_TURNO[3]) return montarTurno(2, agora);

  // 3º turno: das 22:00 às 06:00; antes das 06:00 pertence ao dia anterior.
  const data = new Date(agora);
  if (h < INICIO_TURNO[1]) data.setDate(data.getDate() - 1);
  return montarTurno(3, data);
}

export function montarTurno(numero: NumeroTurno, data: Date): Turno {
  const dia = new Date(data);
  dia.setHours(0, 0, 0, 0);
  const inicio = emHora(dia, INICIO_TURNO[numero]);
  const fim = new Date(inicio.getTime() + DURACAO_TURNO_HORAS * 60 * 60 * 1000);
  return { numero, data: dia, inicio, fim };
}

/** Chave estável do turno, usada nos ids de tarefas (ex.: 2026-10-16T1). */
export function chaveTurno(turno: Turno): string {
  const d = turno.data;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}T${turno.numero}`;
}
