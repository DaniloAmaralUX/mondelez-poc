"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { concluida } from "@/domain/routine-engine";
import { useMinhasTarefas } from "@/hooks/use-turno";

function mensagem(atrasadas: number, pendentes: number) {
  if (atrasadas > 0) return `${atrasadas} ${atrasadas === 1 ? "tarefa atrasada gerou" : "tarefas atrasadas geraram"} alerta para a supervisão.`;
  if (pendentes === 0) return "Turno em dia. Nenhuma pendência para passar.";
  return "Tudo no prazo. Siga a próxima tarefa.";
}

export function WeeklySummaryCard() {
  const tarefas = useMinhasTarefas();
  const feitas = tarefas.filter(concluida).length;
  const atrasadas = tarefas.filter((t) => t.estado === "atrasada").length;
  const progresso = tarefas.length ? Math.round((feitas / tarefas.length) * 100) : 0;

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>Este turno</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
            <Link href="#tarefas">Ver todas</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground">{mensagem(atrasadas, tarefas.length - feitas)}</p>
        <div className="flex flex-col gap-2">
          <div className="font-medium tabular-nums">
            {feitas} de {tarefas.length} tarefas feitas
          </div>
          <Progress value={progresso} className="h-2" aria-label="Progresso do turno" />
        </div>
      </CardContent>
    </Card>
  );
}
