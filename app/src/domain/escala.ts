// Escala por turma (RM-06). Puro.

import { dataLocal } from "./producao";
import type { AjusteEscala, NumeroTurno, Turma, Usuario } from "./types";

export type DiaDeEscala = NumeroTurno | "folga";

/**
 * Ciclo de 8 dias por turma: dois dias em cada turno e duas folgas (1, 1, 2, 2, 3, 3, folga, folga). As quatro turmas
 * começam defasadas de 2 dias, então todo dia cada turno tem uma turma e uma turma folga.
 */
const CICLO: readonly DiaDeEscala[] = [1, 1, 2, 2, 3, 3, "folga", "folga"];
const DEFASAGEM: Record<Turma, number> = { A: 0, B: 6, C: 4, D: 2 };
const DIA_MS = 24 * 60 * 60 * 1000;

function utcDoDia(data: string): number {
  const [a, m, d] = data.split("-").map(Number);
  return Date.UTC(a ?? 2026, (m ?? 1) - 1, d ?? 1);
}

/** Dia zero do ciclo: a turma A no primeiro dia do 1º turno. Padrão: segunda-feira, 5 de janeiro de 2026. */
let origem = Date.UTC(2026, 0, 5);

/**
 * Alinha o ciclo ao dia da demonstração (v0.5): a demo começa "hoje" às 07:40 com as pessoas da turma A no 1º turno
 * (Alberto, Renata, João), então nesse dia a turma A tem de estar no primeiro dia do 1º turno, a D no 2º, a C no 3º e a
 * B de folga. Sem isso, num dia qualquer a escala dizia "Hoje: folga" para quem está trabalhando na demo. O store chama
 * ao criar a demo, ao carregar a sessão salva e ao reiniciar a demonstração (stores/session/session-store.ts).
 */
export function alinharEscalaAoDia(data: string): void {
  origem = utcDoDia(data);
}

function indiceDoDia(data: string): number {
  return Math.round((utcDoDia(data) - origem) / DIA_MS);
}

export function turnoDaTurma(turma: Turma, data: string): DiaDeEscala {
  const n = CICLO.length;
  const i = (((indiceDoDia(data) + DEFASAGEM[turma]) % n) + n) % n;
  return CICLO[i] ?? "folga";
}

/** Turma que trabalha num turno num dia. */
export function turmaDoTurno(numero: NumeroTurno, data: string): Turma | undefined {
  return (["A", "B", "C", "D"] as const).find((t) => turnoDaTurma(t, data) === numero);
}

/** Escala de uma pessoa num dia, com o ajuste pontual por cima. Sem turma (liderança administrativa), null. */
export function escalaDoDia(
  usuario: Pick<Usuario, "id" | "turma">,
  data: string,
  ajustes: Readonly<Record<string, AjusteEscala>>,
): { dia: DiaDeEscala; ajustado: boolean } | null {
  const ajuste = ajustes[`${usuario.id}|${data}`];
  if (ajuste) return { dia: ajuste.turno, ajustado: true };
  if (!usuario.turma) return null;
  return { dia: turnoDaTurma(usuario.turma, data), ajustado: false };
}

/** Dias de um mês (AAAA-MM-DD), para o calendário. */
export function diasDoMes(ano: number, mes0: number): string[] {
  const dias: string[] = [];
  const d = new Date(ano, mes0, 1);
  while (d.getMonth() === mes0) {
    dias.push(dataLocal(d));
    d.setDate(d.getDate() + 1);
  }
  return dias;
}
