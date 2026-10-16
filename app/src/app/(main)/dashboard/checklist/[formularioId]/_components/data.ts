import type { Rascunho } from "@/domain/types";

// Mesmas medidas do papel da Invoice do template (Carta, 816 × 1056 px a 96 dpi).
export const PAPER_WIDTH = 816;
export const PAPER_HEIGHT = 1056;
export const PAPER_SCALE = 0.6;

export type ChecklistFormValues = Rascunho;

export const RASCUNHO_VAZIO: ChecklistFormValues = { respostas: {}, observacao: "" };
