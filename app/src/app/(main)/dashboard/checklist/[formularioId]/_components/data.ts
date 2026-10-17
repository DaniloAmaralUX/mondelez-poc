import type { Rascunho } from "@/domain/types";

// Mesmas medidas do papel da Invoice do template (Carta, 816 × 1056 px a 96 dpi). "Ver documento" mostra em escala 1.
export const PAPER_WIDTH = 816;
export const PAPER_HEIGHT = 1056;

export type ChecklistFormValues = Rascunho;

export const RASCUNHO_VAZIO: ChecklistFormValues = { respostas: {}, observacao: "" };

// Retorno de toque das ações primárias e das respostas C/NC/N/A: `PRESSAO` em src/lib/pressao.ts (uma definição para
// checklist, Minha Rotina e Alertas).

/** Rolagem suave, ou instantânea com prefers-reduced-motion. Só em handlers e efeitos (lê matchMedia). */
export function rolagem(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}
