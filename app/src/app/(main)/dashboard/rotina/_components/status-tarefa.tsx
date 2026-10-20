import { cn } from "cn";

import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import type { TarefaInstancia } from "@/domain/types";
import { formatarHora } from "@/lib/format";
import { STATUS_LEGIVEL } from "@/lib/status-legivel";

type Variante = "default" | "success" | "error" | "warning" | "info";

export function statusDaTarefa(tarefa: TarefaInstancia): { variante: Variante; rotulo: string } {
  if (tarefa.estado === "feita") return { variante: "success", rotulo: "Feita" };
  if (tarefa.estado === "com_nc") return { variante: "warning", rotulo: "Com NC" };
  if (tarefa.estado === "atrasada") return { variante: "error", rotulo: "Atrasada" };
  if (tarefa.futura) return { variante: "default", rotulo: `Abre ${formatarHora(tarefa.abre)}` };
  return { variante: "info", rotulo: "Aberta" };
}

/**
 * Ponto + rótulo. Texto em text-sm: tela do operador. Cores de texto um tom acima do Status do template
 * (`STATUS_LEGIVEL`): "Atrasada" dava 3,97:1 e "Feita" 2,9:1 sobre o fundo do selo.
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
    <Status variant={variante} className={cn("text-sm", STATUS_LEGIVEL, className)}>
      {/* Atrasada: três pulsos e depois parado (um alarme que pisca o turno inteiro deixa de ser visto). */}
      <StatusIndicator
        className={variante === "error" && pulsar ? "before:[animation-iteration-count:3]" : "before:hidden"}
      />
      <StatusLabel>{rotulo}</StatusLabel>
    </Status>
  );
}
