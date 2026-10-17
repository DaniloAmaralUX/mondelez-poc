import type { Rascunho } from "@/domain/types";

// Mesmas medidas do papel da Invoice do template (Carta, 816 × 1056 px a 96 dpi). "Ver documento" mostra em escala 1.
export const PAPER_WIDTH = 816;
export const PAPER_HEIGHT = 1056;

export type ChecklistFormValues = Rascunho;

export const RASCUNHO_VAZIO: ChecklistFormValues = { respostas: {}, observacao: "" };

/**
 * Retorno de toque (doc 11 §5, docs/12 §2 item 3): a pressão aparece no pointerdown e a ação acontece no pointerup.
 * Com prefers-reduced-motion o retorno fica, sem a transição. Ações primárias e respostas C/NC/N/A do checklist.
 */
export const PRESSAO = "transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none";

/** Rolagem suave, ou instantânea com prefers-reduced-motion. Só em handlers e efeitos (lê matchMedia). */
export function rolagem(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}
