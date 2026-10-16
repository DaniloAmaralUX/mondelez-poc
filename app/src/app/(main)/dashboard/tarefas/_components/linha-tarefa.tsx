"use client";

import Link from "next/link";

import { cn } from "cn";
import { ChevronRight, LayoutGrid } from "lucide-react";

import { ICONE_MODULO } from "@/lib/modulo-icones";

import { SituacaoBadge } from "./columns";
import { priorities, type Task } from "./data";

/**
 * Tarefa do posto como linha tocável, para quando a tabela não cabe (abaixo de 896 px de área: tablet em retrato e em
 * paisagem com a sidebar aberta, docs/12 §3.4). Mesmo desenho da lista de Minha Rotina: ícone do módulo, título em
 * text-base, janela e criticidade em text-sm, situação no Badge da tabela e chevron. A linha inteira é o link (≥ 64 px);
 * tarefas que ainda não abriram ficam como texto, sem chevron, como o "Abrir" desabilitado da tabela.
 */
export function LinhaTarefa({ task }: { readonly task: Task }) {
  const Icone = ICONE_MODULO[task.label] ?? LayoutGrid;
  const criticidade = priorities.find((p) => p.value === task.priority)?.label.toLowerCase();

  const conteudo = (
    <>
      <div className="grid size-9 shrink-0 place-items-center rounded-lg border bg-muted text-muted-foreground">
        <Icone className="size-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 font-medium text-base">{task.title}</div>
        <div className="text-muted-foreground text-sm tabular-nums">
          {task.janela}
          {criticidade && ` · criticidade ${criticidade}`}
        </div>
      </div>
      {/* No toque, 14 px de texto (docs/12 §3.3); h-6 para caber a linha de 20 px. */}
      <SituacaoBadge value={task.status} className="toque:h-6 shrink-0 toque:text-sm" />
    </>
  );

  const linha = "flex min-h-16 items-center gap-3 px-4 py-3";

  if (task.futura) {
    return (
      <div className={cn(linha, "text-muted-foreground")}>
        {conteudo}
        {/* Lugar do chevron: as situações ficam alinhadas na coluna da direita. */}
        <span className="size-4 shrink-0" aria-hidden />
      </div>
    );
  }

  return (
    // prefetch: o checklist abre sem rede (lib/rotas.ts). Anel de foco por dentro: o card tem overflow-hidden.
    // active:bg-muted: retorno no toque, onde o hover não existe e o flash do navegador está desligado (tablet.css).
    <Link
      prefetch
      href={task.href}
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
