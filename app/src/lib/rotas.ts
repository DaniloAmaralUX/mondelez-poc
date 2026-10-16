import type { TarefaInstancia } from "@/domain/types";

/** Tela que resolve a tarefa: o checklist do formulário, a tela indicada na rotina ou a própria Minha Rotina. */
export function hrefDaTarefa(tarefa: Pick<TarefaInstancia, "formularioId" | "rota">): string {
  if (tarefa.formularioId) return `/dashboard/checklist/${tarefa.formularioId}`;
  return tarefa.rota ?? "/dashboard/rotina#tarefas";
}

/**
 * Prefetch dos links do app (docs/12 §3.5, fase F).
 *
 * As telas do dashboard são dinâmicas (o layout lê cookies) e não têm `loading.js`: com o prefetch padrão o Next não
 * busca nada antes do toque, e sem rede o toque em "Registrar" fica esperando a conexão. `prefetch={true}` busca a rota
 * inteira quando o link aparece na tela e a guarda no cache do cliente (`staleTimes.static`: um turno, 8 h, em
 * next.config.mjs): o operador troca entre Minha Rotina, checklists e Alertas mesmo com o Wi-Fi caindo. Itens "em
 * breve", desabilitados e links que abrem em outra aba não são buscados.
 */
export function prefetchDaRota(rota: { readonly url: string; readonly disabled?: boolean; readonly newTab?: boolean }) {
  if (rota.disabled || rota.newTab) return false;
  return rota.url.startsWith("/dashboard/") && !rota.url.startsWith("/dashboard/coming-soon");
}
