"use client";

import * as React from "react";

import Link from "next/link";

import { LayoutGrid, ListTodo } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { localRepository } from "@/data/repository";
import { concluida } from "@/domain/routine-engine";
import type { Frequencia, TarefaInstancia } from "@/domain/types";
import { useMinhasTarefas } from "@/hooks/use-turno";
import { formatarHora } from "@/lib/format";
import { ICONE_MODULO } from "@/lib/modulo-icones";

type Filtro = "ativas" | "concluidas" | "todas";

interface Rotina {
  templateId: string;
  titulo: string;
  moduloSlug: string;
  frequencia: Frequencia;
  tarefas: TarefaInstancia[];
}

function descreverFrequencia(f: Frequencia, total: number) {
  if (f.tipo === "hora") return f.aCadaHoras === 1 ? `A cada hora · ${total} no turno` : `A cada ${f.aCadaHoras} h · ${total} no turno`;
  if (f.tipo === "semanal") return "Uma vez por semana";
  return "Uma vez por turno";
}

function situacao(rotina: Rotina) {
  const pendentes = rotina.tarefas.filter((t) => !concluida(t));
  if (pendentes.length === 0) return { status: "Concluída", rodape: "Todas as tarefas feitas" };
  if (pendentes.some((t) => t.estado === "atrasada")) {
    const venceu = pendentes.find((t) => t.estado === "atrasada");
    return { status: "Atrasada", rodape: venceu ? `Venceu às ${formatarHora(venceu.prazo)}` : "" };
  }
  const proxima = pendentes[0];
  if (proxima?.futura) return { status: "Mais tarde", rodape: `Abre às ${formatarHora(proxima.abre)}` };
  return { status: "Em andamento", rodape: proxima ? `Até ${formatarHora(proxima.prazo)}` : "" };
}

export function ProjectsSection() {
  const tarefas = useMinhasTarefas();
  const [filtro, setFiltro] = React.useState<Filtro>("ativas");

  const rotinas = React.useMemo(() => {
    const porTemplate = new Map<string, Rotina>();
    for (const tarefa of tarefas) {
      const template = localRepository.templates().find((t) => t.id === tarefa.templateId);
      if (!template) continue;
      const rotina = porTemplate.get(template.id) ?? {
        templateId: template.id,
        titulo: template.titulo,
        moduloSlug: template.moduloSlug,
        frequencia: template.frequencia,
        tarefas: [],
      };
      rotina.tarefas.push(tarefa);
      porTemplate.set(template.id, rotina);
    }
    for (const rotina of porTemplate.values()) rotina.tarefas.sort((a, b) => a.prazo.getTime() - b.prazo.getTime());
    return [...porTemplate.values()];
  }, [tarefas]);

  const visiveis = rotinas.filter((r) => {
    const completa = r.tarefas.every(concluida);
    if (filtro === "ativas") return !completa;
    if (filtro === "concluidas") return completa;
    return true;
  });

  return (
    <section id="rotinas" className="flex scroll-mt-16 flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl tracking-tight">Rotinas</h2>
        <div className="flex items-center gap-2">
          <Select value={filtro} onValueChange={(value) => setFiltro(value as Filtro)}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Ativas" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ativas">Ativas</SelectItem>
                <SelectItem value="concluidas">Concluídas</SelectItem>
                <SelectItem value="todas">Todas</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button variant="outline" asChild>
            <Link prefetch={false} href="/dashboard/tarefas">
              <ListTodo data-icon="inline-start" />
              Posto
            </Link>
          </Button>
        </div>
      </div>

      {visiveis.length === 0 && (
        <p className="text-muted-foreground text-sm">
          {filtro === "concluidas" ? "Nenhuma rotina concluída ainda." : "Nenhuma rotina pendente."}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {visiveis.map((rotina) => {
          const Icone = ICONE_MODULO[rotina.moduloSlug] ?? LayoutGrid;
          const feitas = rotina.tarefas.filter(concluida).length;
          const progresso = Math.round((feitas / rotina.tarefas.length) * 100);
          const { status, rodape } = situacao(rotina);

          return (
            <Card key={rotina.templateId} className="shadow-xs">
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <Icone className="size-4 shrink-0 text-muted-foreground" />
                    <span className="line-clamp-1">{rotina.titulo.split(" · ")[0]}</span>
                  </div>
                </CardTitle>
                <CardAction>
                  <Badge variant={status === "Atrasada" ? "destructive" : "outline"}>{status}</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1">
                  <div className="text-sm leading-none">
                    {descreverFrequencia(rotina.frequencia, rotina.tarefas.length)}
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={progresso} className="h-2" aria-label={`${rotina.titulo}: ${progresso}%`} />
                    <span className="shrink-0 text-sm tabular-nums">{progresso}%</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="py-2.5">
                <span className="text-muted-foreground">{rodape}</span>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
