"use client";

import Link from "next/link";

import { ArrowRight, Clock3, Focus, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { concluida, proximaTarefa } from "@/domain/routine-engine";
import { useMinhasTarefas } from "@/hooks/use-turno";
import { descreverPrazo } from "@/lib/prazo";
import { hrefDaTarefa } from "@/lib/rotas";
import { useAgora } from "@/stores/session/session-store";

export function SummaryCards() {
  const tarefas = useMinhasTarefas();
  const agora = useAgora();
  const proxima = proximaTarefa(tarefas);
  const paraAgora = tarefas.filter((t) => !concluida(t) && !t.futura).length;
  const feitas = tarefas.filter(concluida).length;
  const progresso = tarefas.length ? Math.round((feitas / tarefas.length) * 100) : 0;

  const summaryCards = [
    {
      title: "Agora",
      value: String(paraAgora),
      description: paraAgora === 1 ? "tarefa para fazer" : "tarefas para fazer",
      icon: Clock3,
      href: "#tarefas",
    },
    { title: "Turno", value: `${progresso}%`, description: "concluído", icon: TrendingUp, href: "#rotinas" },
    {
      title: "Próxima",
      value: proxima ? proxima.titulo.split(" · ")[0] : "Tudo em dia",
      description: proxima ? descreverPrazo(proxima, agora) : "nenhuma tarefa aberta",
      icon: Focus,
      href: proxima ? hrefDaTarefa(proxima) : "#tarefas",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {summaryCards.map((item) => (
        <Link key={item.title} href={item.href} prefetch={false} className="rounded-xl">
          <Card className="h-full shadow-xs">
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <div className="grid size-7 place-items-center rounded-lg border bg-muted">
                    <item.icon className="size-4" />
                  </div>
                  {item.title}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="truncate text-2xl leading-none tracking-tight">{item.value}</div>
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground tabular-nums leading-none">{item.description}</p>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
