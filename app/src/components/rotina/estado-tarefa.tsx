import { cva } from "class-variance-authority";
import { cn } from "cn";
import { CircleCheck, CircleDashed, CircleDot, Clock, OctagonAlert, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { EstadoTarefa, TarefaInstancia } from "@/domain/types";
import { formatarHora } from "@/lib/format";

// Estado sempre com ícone e rótulo; a cor só reforça (doc 09 §8).
const estadoBadgeVariants = cva("h-7 gap-1.5 px-2.5 text-sm [&>svg]:size-4!", {
  variants: {
    estado: {
      a_fazer: "bg-secondary text-secondary-foreground",
      em_andamento: "bg-info/10 text-info",
      feita: "bg-success/10 text-success",
      atrasada: "bg-destructive/10 text-destructive",
      com_nc: "bg-warning/10 text-warning",
      futura: "border-border bg-transparent text-muted-foreground",
    },
  },
});

const ESTADOS: Record<EstadoTarefa, { rotulo: string; icone: typeof CircleCheck }> = {
  a_fazer: { rotulo: "A fazer", icone: CircleDashed },
  em_andamento: { rotulo: "Em andamento", icone: CircleDot },
  feita: { rotulo: "Feita", icone: CircleCheck },
  atrasada: { rotulo: "Atrasada", icone: TriangleAlert },
  com_nc: { rotulo: "Com NC", icone: OctagonAlert },
};

export function EstadoTarefaBadge({ tarefa, className }: { tarefa: TarefaInstancia; className?: string }) {
  if (tarefa.futura) {
    return (
      <Badge variant="outline" className={cn(estadoBadgeVariants({ estado: "futura" }), className)}>
        <Clock aria-hidden />
        Abre às {formatarHora(tarefa.abre)}
      </Badge>
    );
  }

  const { rotulo, icone: Icone } = ESTADOS[tarefa.estado];
  return (
    <Badge className={cn(estadoBadgeVariants({ estado: tarefa.estado }), className)}>
      <Icone aria-hidden />
      {rotulo}
    </Badge>
  );
}
