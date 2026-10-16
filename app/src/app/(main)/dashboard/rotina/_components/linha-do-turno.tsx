"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineDot,
  TimelineHeader,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/components/ui/timeline";
import { concluida } from "@/domain/routine-engine";
import { useMinhasTarefas } from "@/hooks/use-turno";
import { formatarHora } from "@/lib/format";

import { statusDaTarefa } from "./status-tarefa";

const FEITAS_VISIVEIS = 3;

function prefixoDaHora(tarefa: { concluidaEm?: Date; futura: boolean }) {
  if (tarefa.concluidaEm) return "feita ";
  return tarefa.futura ? "abre " : "até ";
}
const PROXIMAS_VISIVEIS = 3;

/**
 * O turno lido de cima para baixo: o que já foi feito, o que está aberto e o que vem.
 * Substitui o calendário mensal da v0, que não servia a nenhuma tarefa do turno.
 */
export function LinhaDoTurno() {
  const tarefas = useMinhasTarefas();
  const ordem = (t: (typeof tarefas)[number]) => (t.concluidaEm ?? t.abre).getTime();

  const feitas = tarefas
    .filter(concluida)
    .sort((a, b) => ordem(a) - ordem(b))
    .slice(-FEITAS_VISIVEIS);
  const abertas = tarefas
    .filter((t) => !concluida(t) && !t.futura)
    .sort((a, b) => a.prazo.getTime() - b.prazo.getTime());
  const proximas = tarefas
    .filter((t) => t.futura)
    .sort((a, b) => a.abre.getTime() - b.abre.getTime())
    .slice(0, PROXIMAS_VISIVEIS);
  const itens = [...feitas, ...abertas, ...proximas];

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>Linha do turno</CardTitle>
      </CardHeader>
      <CardContent>
        {itens.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sem tarefas neste turno.</p>
        ) : (
          <Timeline activeIndex={feitas.length} className="gap-4">
            {itens.map((tarefa) => {
              const hora = tarefa.concluidaEm ?? (tarefa.futura ? tarefa.abre : tarefa.prazo);
              const { rotulo } = statusDaTarefa(tarefa);
              return (
                <TimelineItem key={tarefa.id}>
                  <TimelineDot />
                  <TimelineConnector />
                  <TimelineContent>
                    <TimelineHeader>
                      <TimelineTime dateTime={hora.toISOString()} className="tabular-nums">
                        {prefixoDaHora(tarefa)}
                        {formatarHora(hora)}
                      </TimelineTime>
                      <TimelineTitle className="line-clamp-2 text-sm">{tarefa.titulo.split(" · ")[0]}</TimelineTitle>
                    </TimelineHeader>
                    <TimelineDescription className={tarefa.estado === "atrasada" ? "text-destructive" : undefined}>
                      {rotulo}
                    </TimelineDescription>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        )}
      </CardContent>
    </Card>
  );
}
