import { cn } from "cn";

import type { Alerta } from "@/domain/types";

// Mesmas cores de status da tela Logistics do template.
export type StatusVisual = "critico" | "atencao" | "tratamento" | "resolvido";

export function statusVisual(alerta: Alerta): StatusVisual {
  if (alerta.estado === "resolvido") return "resolvido";
  if (alerta.estado === "em_tratamento") return "tratamento";
  return alerta.criticidade === "critico" ? "critico" : "atencao";
}

export const STATUS_LABEL: Record<StatusVisual, string> = {
  critico: "Crítico",
  atencao: "Atenção",
  tratamento: "Em tratamento",
  resolvido: "Resolvido",
};

/** Variante do componente Status para cada estado visual. */
export const STATUS_VARIANTE = {
  critico: "error",
  atencao: "warning",
  tratamento: "info",
  resolvido: "success",
} as const satisfies Record<StatusVisual, "error" | "warning" | "info" | "success">;

export const progressRingClasses: Record<StatusVisual, string> = {
  critico: "text-destructive",
  atencao: "text-amber-500",
  tratamento: "text-primary",
  resolvido: "text-green-600",
};

/**
 * Selo de estado no detalhe. Texto um tom acima do template no claro (700; 400 no escuro), como o Status das outras
 * telas (src/lib/status-legivel.ts): com o 600 e o `text-destructive` sobre o fundo /10 o texto ficava abaixo de 4,5:1.
 * Em tratamento fica no `text-primary` no claro (6,07:1); no escuro o primary do Linear é escuro (2,1:1 sobre
 * primary/10), então o violet-400, o mesmo matiz.
 */
export const statusBadgeClasses: Record<StatusVisual, string> = {
  critico: "border-destructive/20 bg-destructive/10 text-red-700 dark:text-red-400",
  atencao: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  tratamento: "border-primary/20 bg-primary/10 text-primary dark:text-violet-400",
  resolvido: "border-green-600/20 bg-green-600/10 text-green-700 dark:text-green-400",
};

export function getProgressRingClass(status: StatusVisual) {
  return cn(
    "grid size-3 place-items-center rounded-full p-[0.5px] bg-[conic-gradient(currentColor_0deg_var(--angle),transparent_var(--angle)_360deg)]",
    progressRingClasses[status],
  );
}
