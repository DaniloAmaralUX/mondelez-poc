import { MessageSquareQuote } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { passagemTurnoAnterior } from "@/data/seed";

/**
 * Recado da passagem do turno anterior. v0.4 (docs/14): card do template com a origem no topo (quem deixou e de qual
 * turno), a pendência como título e a sugestão como corpo, em vez das aspas grandes soltas. O âmbar marca "pendente
 * de outro turno" sem competir com o roxo da ação principal.
 */
export function QuoteCard() {
  return (
    <Card>
      <CardHeader className="grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <div
          aria-hidden
          className="row-span-2 grid size-9 place-items-center rounded-lg bg-amber-500/12 text-amber-700 dark:text-amber-400"
        >
          <MessageSquareQuote className="size-5" />
        </div>
        <CardDescription>Do turno anterior · {passagemTurnoAnterior.autor}</CardDescription>
        <CardTitle className="text-lg leading-snug">{passagemTurnoAnterior.pendencia}</CardTitle>
      </CardHeader>
      <CardContent className="pl-[calc(var(--card-spacing)+3rem)] text-base text-muted-foreground">
        {passagemTurnoAnterior.sugestao}
      </CardContent>
    </Card>
  );
}
