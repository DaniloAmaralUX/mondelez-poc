import { cn } from "cn";

import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import type { TarefaInstancia } from "@/domain/types";
import { formatarHora } from "@/lib/format";

type Variante = "default" | "success" | "error" | "warning" | "info";

export function statusDaTarefa(tarefa: TarefaInstancia): { variante: Variante; rotulo: string } {
  if (tarefa.estado === "feita") return { variante: "success", rotulo: "Feita" };
  if (tarefa.estado === "com_nc") return { variante: "warning", rotulo: "Com NC" };
  if (tarefa.estado === "atrasada") return { variante: "error", rotulo: "Atrasada" };
  if (tarefa.futura) return { variante: "default", rotulo: `Abre ${formatarHora(tarefa.abre)}` };
  return { variante: "info", rotulo: "Aberta" };
}

/**
 * Ponto + rótulo. Só o atraso pulsa: é o único estado que pede atenção agora (sem pulsar com
 * prefers-reduced-motion, pela camada em src/styles/tablet.css). Texto em text-sm: tela do operador.
 */
export function StatusTarefa({ tarefa, className }: { readonly tarefa: TarefaInstancia; readonly className?: string }) {
  const { variante, rotulo } = statusDaTarefa(tarefa);
  return (
    <Status variant={variante} className={cn("text-sm", className)}>
      <StatusIndicator className={variante === "error" ? undefined : "before:hidden"} />
      <StatusLabel>{rotulo}</StatusLabel>
    </Status>
  );
}
