"use client";

import * as React from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Calendar1, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { localRepository } from "@/data/repository";
import { concluida, proximaTarefa } from "@/domain/routine-engine";
import type { TarefaInstancia } from "@/domain/types";
import { useMinhasTarefas } from "@/hooks/use-turno";
import { formatarHora } from "@/lib/format";
import { hrefDaTarefa } from "@/lib/rotas";
import { useSessionStore } from "@/stores/session/session-store";

type Filtro = "agora" | "turno" | "feitas";

const FILTROS: Record<Filtro, (t: TarefaInstancia) => boolean> = {
  agora: (t) => !concluida(t) && !t.futura,
  turno: () => true,
  feitas: concluida,
};

export function TasksSection() {
  const router = useRouter();
  const tarefas = useMinhasTarefas();
  const confirmarTarefa = useSessionStore((s) => s.confirmarTarefa);
  const [filtro, setFiltro] = React.useState<Filtro>("agora");
  const proxima = proximaTarefa(tarefas);
  const items = tarefas.filter(FILTROS[filtro]);

  function concluir(tarefa: TarefaInstancia) {
    if (tarefa.formularioId || tarefa.rota) {
      router.push(hrefDaTarefa(tarefa));
      return;
    }
    confirmarTarefa(tarefa.id);
    toast("Tarefa registrada", { description: tarefa.titulo });
  }

  return (
    <section id="tarefas" className="flex scroll-mt-16 flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl tracking-tight">Tarefas</h2>
        <div className="flex items-center gap-2">
          <Select value={filtro} onValueChange={(value) => setFiltro(value as Filtro)}>
            <SelectTrigger className="w-30">
              <SelectValue placeholder="Agora" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="agora">Agora</SelectItem>
                <SelectItem value="turno">Turno inteiro</SelectItem>
                <SelectItem value="feitas">Feitas</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button asChild>
            <Link prefetch={false} href={proxima ? hrefDaTarefa(proxima) : "#tarefas"}>
              <Plus data-icon="inline-start" />
              Registrar
            </Link>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
        <div className="divide-y">
          {items.length === 0 && (
            <p className="p-4 text-muted-foreground text-sm">
              {filtro === "feitas" ? "Nenhuma tarefa feita ainda neste turno." : "Nada para fazer agora."}
            </p>
          )}
          {items.map((task) => {
            const feita = concluida(task);
            const modulo = localRepository.modulo(task.moduloSlug);
            return (
              <div key={task.id} className="flex items-center gap-2 p-4">
                <Checkbox
                  checked={feita}
                  disabled={feita || task.futura}
                  aria-label={task.titulo}
                  onCheckedChange={(checked) => checked === true && concluir(task)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
                      {feita || task.futura || !(task.formularioId || task.rota) ? (
                        <span className="truncate text-sm">{task.titulo}</span>
                      ) : (
                        <Link prefetch={false} href={hrefDaTarefa(task)} className="truncate text-sm hover:underline">
                          {task.titulo}
                        </Link>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-3 py-1 font-normal">
                          {modulo?.nome}
                        </Badge>
                        {task.estado === "atrasada" && (
                          <Badge variant="destructive" className="px-3 py-1 font-normal">
                            Atrasada
                          </Badge>
                        )}
                        {task.estado === "com_nc" && (
                          <Badge variant="destructive" className="px-3 py-1 font-normal">
                            Com NC
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-muted-foreground text-sm">
                      <span className="tabular-nums">
                        {task.concluidaEm
                          ? `feita ${formatarHora(task.concluidaEm)}`
                          : `${formatarHora(task.abre)}–${formatarHora(task.prazo)}`}
                      </span>
                      <Calendar1 className="size-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
