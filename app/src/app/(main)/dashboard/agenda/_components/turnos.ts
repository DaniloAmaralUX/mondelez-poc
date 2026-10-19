import { localRepository } from "@/data/repository";
import type { DiaDeEscala } from "@/domain/escala";
import { DURACAO_TURNO_HORAS, INICIO_TURNO } from "@/domain/turno";
import type { NumeroTurno, Usuario } from "@/domain/types";

export const DIAS_DE_ESCALA: readonly DiaDeEscala[] = [1, 2, 3, "folga"];

function hh(h: number) {
  return String(h % 24).padStart(2, "0");
}

/** "06–14". */
export function faixaDoTurno(numero: NumeroTurno): string {
  const inicio = INICIO_TURNO[numero];
  return `${hh(inicio)}–${hh(inicio + DURACAO_TURNO_HORAS)}`;
}

/** "das 06:00 às 14:00". */
export function horarioDoTurno(numero: NumeroTurno): string {
  const inicio = INICIO_TURNO[numero];
  return `das ${hh(inicio)}:00 às ${hh(inicio + DURACAO_TURNO_HORAS)}:00`;
}

/** "1º turno" ou "Folga". */
export function nomeDoDia(dia: DiaDeEscala): string {
  return dia === "folga" ? "Folga" : `${dia}º turno`;
}

/** "1º" ou "Folga", para célula estreita. */
export function nomeCurto(dia: DiaDeEscala): string {
  return dia === "folga" ? "Folga" : `${dia}º`;
}

/**
 * Tinta de cada turno na escala, sempre com o nome escrito ao lado (a cor nunca é a única pista). Manhã em azul-claro,
 * tarde em âmbar, noite em ardósia; folga em verde. Fora do roxo, que é o acento da tela.
 */
export const TINTA_DA_ESCALA: Record<string, string> = {
  "1": "bg-sky-500/15 text-sky-800 dark:text-sky-300",
  "2": "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  "3": "bg-slate-500/20 text-slate-800 dark:text-slate-200",
  folga: "bg-emerald-500/12 text-emerald-800 dark:text-emerald-300",
};

/**
 * Quem entra na escala do posto: as pessoas lotadas nele (operação) e a supervisão da linha que trabalha por turma.
 * Pela ordem de turma e nome.
 */
export function pessoasDoPosto(postoId: string | undefined): Usuario[] {
  return localRepository
    .usuarios()
    .filter((u) => u.turma && (u.postoId === postoId || (u.perfil === "supervisao" && !u.postoId)))
    .sort((a, b) => (a.turma ?? "").localeCompare(b.turma ?? "") || a.nome.localeCompare(b.nome, "pt-BR"));
}
