import Link from "next/link";

import { ChevronRight, LayoutGrid } from "lucide-react";

import { EstadoTarefaBadge } from "@/components/rotina/estado-tarefa";
import { ICONE_MODULO } from "@/components/rotina/icone-modulo";
import { descreverPrazo } from "@/components/rotina/prazo-tarefa";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { localRepository } from "@/data/repository";
import type { TarefaInstancia } from "@/domain/types";

export function hrefTarefa(t: TarefaInstancia) {
  return `/modulos/${t.moduloSlug}?tarefa=${encodeURIComponent(t.id)}`;
}

/** Uma linha da rotina. A linha inteira é o alvo de toque; tarefas que ainda não abriram não são clicáveis. */
export function TarefaItem({ tarefa, agora }: { tarefa: TarefaInstancia; agora: Date }) {
  const modulo = localRepository.modulo(tarefa.moduloSlug);
  const Icone = ICONE_MODULO[tarefa.moduloSlug] ?? LayoutGrid;
  const conteudo = (
    <>
      <ItemMedia variant="icon" className="size-10 rounded-lg bg-muted text-muted-foreground [&_svg]:size-5!">
        <Icone aria-label={modulo?.nome} />
      </ItemMedia>
      <ItemContent className="gap-1">
        <ItemTitle className="text-base">{tarefa.titulo}</ItemTitle>
        <ItemDescription className="text-sm">{descreverPrazo(tarefa, agora)}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <EstadoTarefaBadge tarefa={tarefa} />
        {!tarefa.futura && <ChevronRight aria-hidden className="size-5 text-muted-foreground" />}
      </ItemActions>
    </>
  );

  if (tarefa.futura) {
    return (
      <Item variant="outline" className="min-h-touch bg-muted/30">
        {conteudo}
      </Item>
    );
  }

  return (
    <Item asChild variant="outline" className="min-h-touch">
      <Link href={hrefTarefa(tarefa)}>{conteudo}</Link>
    </Item>
  );
}
