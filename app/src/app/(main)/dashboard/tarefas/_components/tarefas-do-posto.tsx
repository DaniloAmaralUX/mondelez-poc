"use client";

import { useState } from "react";

import { cn } from "cn";
import { UserRound } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { localRepository } from "@/data/repository";
import { escalaDoDia } from "@/domain/escala";
import { dataLocal } from "@/domain/producao";
import { concluida } from "@/domain/routine-engine";
import { turnoAtual } from "@/domain/turno";
import type { Posto, TarefaInstancia } from "@/domain/types";
import { useTarefas } from "@/hooks/use-turno";
import { formatarHora, primeiroNome } from "@/lib/format";
import { STATUS_LEGIVEL } from "@/lib/status-legivel";
import { useAgora, useSessionStore } from "@/stores/session/session-store";

import { paraLinha } from "./data";
import { Tasks } from "./tasks";

function contar(tarefas: readonly TarefaInstancia[]) {
  return {
    atrasadas: tarefas.filter((t) => t.estado === "atrasada").length,
    abertas: tarefas.filter((t) => !concluida(t) && !t.futura && t.estado !== "atrasada").length,
    comNc: tarefas.filter((t) => t.estado === "com_nc").length,
    feitas: tarefas.filter((t) => t.estado === "feita").length,
    maisTarde: tarefas.filter((t) => t.futura).length,
    progresso: tarefas.length ? Math.round((tarefas.filter(concluida).length / tarefas.length) * 100) : 0,
  };
}

/**
 * Visão da liderança: os postos da linha no turno atual (v0.5, job da supervisão "ver o status de cada posto para
 * decidir onde ir primeiro") e, embaixo, todas as tarefas da operação do posto escolhido. Começa no posto do tablet.
 */
export function TarefasDoPosto() {
  const contexto = useSessionStore((s) => s.contexto);
  const agora = useAgora();
  const turno = turnoAtual(agora);
  const [escolhido, setEscolhido] = useState<string | undefined>(undefined);
  const postoId = escolhido ?? contexto?.postoId;
  const tarefas = useTarefas(postoId, "operacao");
  const linha = contexto ? localRepository.linha(contexto.linhaId) : undefined;
  const postos = contexto ? localRepository.postos(contexto.linhaId) : [];
  const posto = postoId ? localRepository.posto(postoId) : undefined;
  const c = contar(tarefas);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[2rem] leading-[1.1]">Tarefas dos postos</h1>
        <p className="text-lg text-muted-foreground">
          {linha?.nome} · {turno.numero}º turno, das {formatarHora(turno.inicio)} às {formatarHora(turno.fim)}
        </p>
      </header>

      <section
        aria-label="Postos da linha"
        className="grid @2xl/content:grid-cols-2 @min-[60rem]/content:grid-cols-3 gap-4"
      >
        {postos.map((p) => (
          <CardDoPosto key={p.id} posto={p} ativo={p.id === postoId} onEscolher={() => setEscolhido(p.id)} />
        ))}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="tarefas-do-posto-titulo">
        <h2 id="tarefas-do-posto-titulo" className="text-xl">
          {posto?.nome ?? "Posto"}
          {c.atrasadas > 0 && (
            <span className="ml-2 font-normal text-base text-destructive">
              {c.atrasadas} {c.atrasadas === 1 ? "atrasada" : "atrasadas"}
            </span>
          )}
        </h2>
        {/* Resumo do posto antes da tabela (UI Audit): onde está o problema sem precisar filtrar. Cores um tom acima do
            Status do template (STATUS_LEGIVEL). */}
        <div className="flex flex-wrap gap-2">
          {[
            { rotulo: "atrasadas", n: c.atrasadas, variante: "error" as const },
            { rotulo: "abertas", n: c.abertas, variante: "info" as const },
            { rotulo: "com NC", n: c.comNc, variante: "warning" as const },
            { rotulo: "feitas", n: c.feitas, variante: "success" as const },
            { rotulo: "mais tarde", n: c.maisTarde, variante: "default" as const },
          ].map((item) => (
            <Status key={item.rotulo} variant={item.variante} className={cn("toque:text-sm", STATUS_LEGIVEL)}>
              <StatusIndicator className={item.variante === "error" && item.n > 0 ? undefined : "before:hidden"} />
              <StatusLabel className="tabular-nums">
                {item.n} {item.rotulo}
              </StatusLabel>
            </Status>
          ))}
        </div>
        <Tasks key={postoId} data={tarefas.map(paraLinha)} />
      </section>
    </div>
  );
}

/** Um posto: quem está de turno pela escala, progresso e o que está atrasado. Tocar mostra as tarefas dele embaixo. */
function CardDoPosto({ posto, ativo, onEscolher }: { posto: Posto; ativo: boolean; onEscolher: () => void }) {
  const tarefas = useTarefas(posto.id, "operacao");
  const agora = useAgora();
  const ajustes = useSessionStore((s) => s.ajustesEscala);
  const turno = turnoAtual(agora);
  const hoje = dataLocal(turno.data);
  const deTurno = localRepository
    .usuarios()
    .filter((u) => u.postoId === posto.id && escalaDoDia(u, hoje, ajustes)?.dia === turno.numero);
  const c = contar(tarefas);

  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onEscolher}
      className={cn(
        "flex flex-col gap-3 rounded-xl bg-card p-4 text-left shadow-sm ring-1 ring-foreground/5 transition-colors",
        "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted/60",
        ativo && "ring-2 ring-primary/50",
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="flex flex-col gap-0.5">
          <span className="font-semibold text-lg leading-tight">{posto.nome}</span>
          <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <UserRound className="size-4" aria-hidden />
            {deTurno.length > 0 ? deTurno.map((u) => primeiroNome(u.nome)).join(", ") : "Sem operador escalado"}
          </span>
        </span>
        {c.atrasadas > 0 ? (
          <Status variant="error" className={cn("toque:text-sm", STATUS_LEGIVEL)}>
            <StatusIndicator />
            <StatusLabel className="tabular-nums">
              {c.atrasadas} {c.atrasadas === 1 ? "atrasada" : "atrasadas"}
            </StatusLabel>
          </Status>
        ) : (
          <Status variant="success" className={cn("toque:text-sm", STATUS_LEGIVEL)}>
            <StatusIndicator className="before:hidden" />
            <StatusLabel>Em dia</StatusLabel>
          </Status>
        )}
      </span>
      <Progress value={c.progresso} aria-label={`${c.progresso}% do turno feito`} className="h-1.5 bg-secondary" />
      <span className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-sm tabular-nums">
        <span>
          <span className="font-medium text-foreground">{c.abertas}</span> abertas
        </span>
        <span>
          <span className="font-medium text-foreground">{c.feitas + c.comNc}</span> feitas
        </span>
        {c.comNc > 0 && <span className="text-amber-700 dark:text-amber-400">{c.comNc} com NC</span>}
        <span>{c.progresso}% do turno</span>
      </span>
    </button>
  );
}
