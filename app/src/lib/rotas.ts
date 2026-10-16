import type { TarefaInstancia } from "@/domain/types";

/** Tela que resolve a tarefa: o checklist do formulário, a tela indicada na rotina ou a própria Minha Rotina. */
export function hrefDaTarefa(tarefa: Pick<TarefaInstancia, "formularioId" | "rota">): string {
  if (tarefa.formularioId) return `/dashboard/checklist/${tarefa.formularioId}`;
  return tarefa.rota ?? "/dashboard/rotina#tarefas";
}
