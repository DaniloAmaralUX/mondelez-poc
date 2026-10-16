"use client";

import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { localRepository } from "@/data/repository";
import { concluida } from "@/domain/routine-engine";
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
        {/* h1 da tela (UI Audit 10.5: a tela começava em h2). */}
        <h1 className="text-3xl tracking-tight">Tarefas do posto</h1>
        <p className="text-muted-foreground">
          {linha?.nome} · {posto?.nome} · {turno.numero}º turno, das {formatarHora(turno.inicio)} às{" "}
          {formatarHora(turno.fim)}
          {atrasadas > 0 && ` · ${atrasadas} ${atrasadas === 1 ? "atrasada" : "atrasadas"}`}
        </p>
      </div>
      {/* Resumo do posto antes da tabela (UI Audit): onde está o problema sem precisar filtrar. */}
      <div className="flex flex-wrap gap-2">
        {[
          { rotulo: "Atrasadas", n: atrasadas, variante: "error" as const },
          {
            rotulo: "Abertas",
            n: tarefas.filter((t) => !concluida(t) && !t.futura && t.estado !== "atrasada").length,
            variante: "info" as const,
          },
          { rotulo: "Com NC", n: tarefas.filter((t) => t.estado === "com_nc").length, variante: "warning" as const },
          { rotulo: "Feitas", n: tarefas.filter((t) => t.estado === "feita").length, variante: "success" as const },
          { rotulo: "Mais tarde", n: tarefas.filter((t) => t.futura).length, variante: "default" as const },
        ].map((c) => (
          <Status key={c.rotulo} variant={c.variante} className="toque:text-sm">
            <StatusIndicator className={c.variante === "error" && c.n > 0 ? undefined : "before:hidden"} />
            <StatusLabel className="tabular-nums">
              {c.n} {c.rotulo.toLowerCase()}
            </StatusLabel>
          </Status>
        ))}
      </div>
      <Tasks data={tarefas.map(paraLinha)} />
    </div>
  );
}
