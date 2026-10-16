"use client";

import { localRepository } from "@/data/repository";
import { turnoAtual } from "@/domain/turno";
import { useTarefas } from "@/hooks/use-turno";
import { formatarHora } from "@/lib/format";
import { useAgora, useSessionStore } from "@/stores/session/session-store";

import { paraLinha } from "./data";
import { Tasks } from "./tasks";

/** Visão da liderança: todas as tarefas da operação no posto, no turno atual. */
export function TarefasDoPosto() {
  const contexto = useSessionStore((s) => s.contexto);
  const agora = useAgora();
  const turno = turnoAtual(agora);
  const tarefas = useTarefas(contexto?.postoId, "operacao");
  const { linha, posto } = contexto ? localRepository.descreverContexto(contexto) : {};
  const atrasadas = tarefas.filter((t) => t.estado === "atrasada").length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-3xl tracking-tight">Tarefas do posto</h2>
        <p className="text-muted-foreground">
          {linha?.nome} · {posto?.nome} · {turno.numero}º turno, das {formatarHora(turno.inicio)} às{" "}
          {formatarHora(turno.fim)}
          {atrasadas > 0 && ` · ${atrasadas} ${atrasadas === 1 ? "atrasada" : "atrasadas"}`}
        </p>
      </div>
      <Tasks data={tarefas.map(paraLinha)} />
    </div>
  );
}
