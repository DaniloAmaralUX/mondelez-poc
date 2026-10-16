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

export const progressRingClasses: Record<StatusVisual, string> = {
  critico: "text-destructive",
  atencao: "text-amber-500",
  tratamento: "text-primary",
  resolvido: "text-green-600",
};

export const statusBadgeClasses: Record<StatusVisual, string> = {
  critico: "border-destructive/20 bg-destructive/10 text-destructive",
  atencao: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  tratamento: "border-primary/20 bg-primary/10 text-primary",
  resolvido: "border-green-600/20 bg-green-600/10 text-green-600",
};

export function getProgressRingClass(status: StatusVisual) {
  return cn(
    "grid size-3 place-items-center rounded-full p-[0.5px] bg-[conic-gradient(currentColor_0deg_var(--angle),transparent_var(--angle)_360deg)]",
    progressRingClasses[status],
  );
}
