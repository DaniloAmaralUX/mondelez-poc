import { Quote } from "lucide-react";

import { passagemTurnoAnterior } from "@/data/seed";

/** Recado da passagem do turno anterior. */
export function QuoteCard() {
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-xs">
      <div className="flex items-start gap-4">
        <div className="grid size-8 shrink-0 place-items-center text-muted-foreground">
          <Quote className="size-6" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xl leading-tight tracking-tight">{passagemTurnoAnterior.pendencia}</p>
          <p className="text-muted-foreground">
            {passagemTurnoAnterior.sugestao} · {passagemTurnoAnterior.autor}, turno anterior
          </p>
        </div>
      </div>
    </section>
  );
}
