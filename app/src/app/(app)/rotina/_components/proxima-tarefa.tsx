import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { EstadoTarefaBadge } from "@/components/rotina/estado-tarefa";
import { descreverPrazo } from "@/components/rotina/prazo-tarefa";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TarefaInstancia } from "@/domain/types";
import { toque } from "@/lib/touch";

import { hrefTarefa } from "./tarefa-item";

/** A tarefa em destaque: o que fazer agora, com um botão grande para começar. */
export function ProximaTarefa({ tarefa, agora }: { tarefa: TarefaInstancia; agora: Date }) {
  return (
    <Card className="border-primary ring-1 ring-primary">
      <CardHeader>
        <CardDescription className="font-strong text-primary text-sm uppercase tracking-wide">
          Fazer agora
        </CardDescription>
        <CardTitle className="text-2xl leading-tight">{tarefa.titulo}</CardTitle>
        <CardAction>
          <EstadoTarefaBadge tarefa={tarefa} />
        </CardAction>
      </CardHeader>
      <CardContent className="text-lg">
        <p>{descreverPrazo(tarefa, agora)}</p>
      </CardContent>
      <CardFooter>
        <Button asChild className={toque.botao}>
          <Link href={hrefTarefa(tarefa)}>
            Começar
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
