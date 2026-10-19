import { localRepository } from "@/data/repository";

/**
 * Início do bloco de 2 h de uma tarefa de perdas (RM-03). A tarefa abre 1 h depois do início do bloco (janela do
 * template `sobrepeso` no seed): a das 07:00 aponta o que saiu das 06:00 às 08:00. É o que `ApontamentoPerdas.bloco`
 * guarda; antes guardava a hora em que a tarefa abre, e o alerta A-PERDA dizia "07:00" para o bloco das 06:00.
 */
export function inicioDoBlocoDePerdas(abre: Date): Date {
  const atraso = localRepository.templates().find((t) => t.id === "sobrepeso")?.janela.inicioMin ?? 60;
  return new Date(abre.getTime() - atraso * 60_000);
}
