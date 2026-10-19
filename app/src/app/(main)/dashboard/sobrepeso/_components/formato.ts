import { localRepository } from "@/data/repository";
import type { TarefaInstancia } from "@/domain/types";
import { formatarHora } from "@/lib/format";

const UMA_CASA = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const gramas = (g: number) => `${UMA_CASA.format(g)} g`;
export const quilos = (kg: number) => `${UMA_CASA.format(kg)} kg`;

/** Motivos de perda do bloco (RM-03). "Outro" pede a observação. */
export const MOTIVOS_PERDA = [
  "Ajuste de balança",
  "Selagem com defeito",
  "Produto quebrado",
  "Troca de bobina",
  "Setup",
  "Outro",
] as const;

/**
 * Início do bloco de produção de uma tarefa de perdas. A tarefa abre 1 h depois do início do bloco de 2 h (janela do
 * template `sobrepeso` no seed): a de 07:00 aponta o que saiu das 06:00 às 08:00.
 */
export function inicioDoBloco(tarefa: Pick<TarefaInstancia, "abre">): Date {
  const atraso = localRepository.templates().find((t) => t.id === "sobrepeso")?.janela.inicioMin ?? 60;
  return new Date(tarefa.abre.getTime() - atraso * 60_000);
}

const BLOCO_MS = 2 * 60 * 60 * 1000;

/** "06:00–08:00". */
export function rotuloDoBloco(tarefa: Pick<TarefaInstancia, "abre">): string {
  const inicio = inicioDoBloco(tarefa);
  return `${formatarHora(inicio)}–${formatarHora(new Date(inicio.getTime() + BLOCO_MS))}`;
}
