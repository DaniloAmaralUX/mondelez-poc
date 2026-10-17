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
 * Ponto + rótulo. Texto em text-sm: tela do operador.
 *
 * `pulsar`: só no foco da tela ("Fazer agora") e só no atraso, o único estado que pede atenção agora. Nas linhas da
 * lista o ponto vermelho fica fixo: com vários atrasos, um pulso em cada linha repetia o selo "Atrasada" e o
 * contador e diluía a atenção (ISA-101). Sem pulsar com prefers-reduced-motion, pela camada em src/styles/tablet.css.
 */
export function StatusTarefa({
  tarefa,
  className,
  pulsar = false,
}: {
  readonly tarefa: TarefaInstancia;
  readonly className?: string;
  readonly pulsar?: boolean;
}) {
  const { variante, rotulo } = statusDaTarefa(tarefa);
  return (
    <Status variant={variante} className={cn("text-sm", className)}>
      <StatusIndicator className={variante === "error" && pulsar ? undefined : "before:hidden"} />
      <StatusLabel>{rotulo}</StatusLabel>
    </Status>
  );
}
