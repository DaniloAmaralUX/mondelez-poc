import { BLOCO_DE_PERDAS_MS } from "@/domain/alertas-indicadores";
import type { TarefaInstancia } from "@/domain/types";
import { formatarHora } from "@/lib/format";
import { inicioDoBlocoDePerdas } from "@/lib/sessao/perdas";

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

/** Início do bloco de produção de uma tarefa de perdas (o mesmo que o store grava em `bloco`). */
export function inicioDoBloco(tarefa: Pick<TarefaInstancia, "abre">): Date {
  return inicioDoBlocoDePerdas(tarefa.abre);
}

/** "06:00–08:00". */
export function rotuloDoBloco(tarefa: Pick<TarefaInstancia, "abre">): string {
  const inicio = inicioDoBloco(tarefa);
  return `${formatarHora(inicio)}–${formatarHora(new Date(inicio.getTime() + BLOCO_DE_PERDAS_MS))}`;
}
