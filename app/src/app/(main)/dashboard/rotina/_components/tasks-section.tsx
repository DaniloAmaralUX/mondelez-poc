"use client";

import * as React from "react";

import Link from "next/link";

import { cn } from "cn";
import { Check, ChevronRight, LayoutGrid } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { concluida } from "@/domain/routine-engine";
import type { TarefaInstancia } from "@/domain/types";
import { useMinhasTarefas } from "@/hooks/use-turno";
import { formatarHora } from "@/lib/format";
import { ICONE_MODULO } from "@/lib/modulo-icones";
import { descreverPrazo } from "@/lib/prazo";
import { hrefDaTarefa } from "@/lib/rotas";
import { useAgora } from "@/stores/session/session-store";

import { StatusTarefa } from "./status-tarefa";
import { temTela, useConcluirTarefa } from "./use-concluir";

type Filtro = "agora" | "turno" | "feitas";

const FILTROS: Record<Filtro, (t: TarefaInstancia) => boolean> = {
  agora: (t) => !concluida(t) && !t.futura,
  turno: () => true,
  feitas: concluida,
};

const VAZIO: Record<Filtro, string> = {
  agora: "Nada para fazer agora.",
  turno: "Nenhuma tarefa neste turno.",
  feitas: "Nenhuma tarefa feita ainda neste turno.",
};

// Saída rápida e sem salto quando a tarefa muda de grupo (oportunidades de movimento, item 1).
const SAIDA = { duration: 0.18, ease: [0.23, 1, 0.32, 1] } as const;

export function TasksSection() {
  const tarefas = useMinhasTarefas();
  const agora = useAgora();
  const concluir = useConcluirTarefa();
  const [filtro, setFiltro] = React.useState<Filtro>("agora");
  const items = tarefas.filter(FILTROS[filtro]);

  return (
    <section id="tarefas" className="flex scroll-mt-16 flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl tracking-tight">Tarefas</h2>
        <Select value={filtro} onValueChange={(value) => setFiltro(value as Filtro)}>
          <SelectTrigger className="w-36" aria-label="Filtrar tarefas">
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
      </div>

      <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
        {/* Movimento só no que muda (docs/12 §3.6, GPU modesta do Tab Active5):
            - layoutDependency: cada linha só é medida quando a posição dela na lista muda; a virada do minuto
              re-renderiza a lista inteira (prazo "vence em") e, sem isso, o motion mediria todas as linhas a cada tick.
            - mode="popLayout": a linha concluída sai do fluxo na hora (some com opacidade e escala) e as de baixo sobem
              no mesmo render em que o índice delas muda, então a medição acontece quando precisa. O ul é relative
              porque o popLayout posiciona a linha que sai em relação a ele.
            - Com prefers-reduced-motion o MotionConfig do app desliga escala e deslocamento; fica só a opacidade. */}
        <ul className="relative divide-y">
          {items.length === 0 && <li className="p-4 text-muted-foreground text-sm">{VAZIO[filtro]}</li>}
          <AnimatePresence initial={false} mode="popLayout">
            {items.map((tarefa, indice) => (
              <motion.li
                key={tarefa.id}
                layout="position"
                layoutDependency={indice}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={SAIDA}
              >
                <LinhaTarefa tarefa={tarefa} agora={agora} onConcluir={() => concluir(tarefa)} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </section>
  );
}

/**
 * Linha inteira tocável (≥ 56 px, docs/12 §3.4); a ação fica explícita no fim da linha, nunca num checkbox.
 * active:bg-muted: retorno no toque, onde o hover não existe e o flash do navegador está desligado (tablet.css).
 */
function LinhaTarefa({ tarefa, agora, onConcluir }: { tarefa: TarefaInstancia; agora: Date; onConcluir: () => void }) {
  const Icone = ICONE_MODULO[tarefa.moduloSlug] ?? LayoutGrid;
  const feita = concluida(tarefa);
  const conteudo = (
    <>
      <div className="grid size-9 shrink-0 place-items-center rounded-lg border bg-muted text-muted-foreground">
        <Icone className="size-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 font-medium text-base">{tarefa.titulo}</div>
        <div className="text-muted-foreground text-sm tabular-nums">
          {formatarHora(tarefa.abre)}–{formatarHora(tarefa.prazo)} · {descreverPrazo(tarefa, agora)}
        </div>
      </div>
      <StatusTarefa tarefa={tarefa} className="hidden sm:inline-flex" />
    </>
  );

  const linha = "flex min-h-14 items-center gap-3 px-4 py-2.5";

  if (!feita && !tarefa.futura && temTela(tarefa)) {
    return (
      <Link
        // prefetch: o checklist abre sem rede (lib/rotas.ts).
        prefetch
        href={hrefDaTarefa(tarefa)}
        // Anel de foco do template, por dentro: a lista tem overflow-hidden e cortaria um anel externo.
        className={cn(
          linha,
          "outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-muted",
        )}
      >
        {conteudo}
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
    );
  }

  return (
    <div className={cn(linha, (feita || tarefa.futura) && "text-muted-foreground")}>
      {conteudo}
      {!feita && !tarefa.futura && (
        // 40 px no notebook (v0.2); no toque a camada leva a 56 px e toque:min-w-28 alarga o alvo para a luva.
        <Button
          variant="outline"
          className="h-10 toque:min-w-28 shrink-0 transition-transform duration-150 ease-out active:scale-[0.97]"
          onClick={onConcluir}
        >
          <Check data-icon="inline-start" />
          Concluir
        </Button>
      )}
    </div>
  );
}
