"use client";

import * as React from "react";

import { cn } from "cn";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineDot,
  TimelineHeader,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/components/ui/timeline";
import { concluida } from "@/domain/routine-engine";
import type { TarefaInstancia } from "@/domain/types";
import { useMinhasTarefas } from "@/hooks/use-turno";
import { formatarHora } from "@/lib/format";

import { statusDaTarefa } from "./status-tarefa";

/** Coluna lateral (duas colunas, @4xl/content): o recorte da v0.2. */
const FEITAS_VISIVEIS = 3;
const PROXIMAS_VISIVEIS = 3;

/** Coluna única (retrato, paisagem com a sidebar aberta): as últimas feitas e as próximas a fazer. */
const FEITAS_NA_JANELA = 2;
const A_FAZER_NA_JANELA = 4;

/** Fora da janela: some na coluna única e volta na coluna lateral, que mantém o recorte da v0.2. */
const SO_NA_COLUNA_LATERAL = "hidden @4xl/content:flex";

function prefixoDaHora(tarefa: { concluidaEm?: Date; futura: boolean }) {
  if (tarefa.concluidaEm) return "feita ";
  return tarefa.futura ? "abre " : "até ";
}

/**
 * O rótulo de situação só repete o que a hora já diz ("feita 06:12" + "Feita", "abre 09:00" + "Abre 09:00", "até 08:00"
 * + "Aberta"). Na coluna única ele aparece só quando acrescenta: atrasada e com NC.
 */
function rotuloRedundante(tarefa: TarefaInstancia) {
  return tarefa.estado !== "atrasada" && tarefa.estado !== "com_nc";
}

/**
 * O turno lido de cima para baixo: o que já foi feito, o que está aberto e o que vem.
 * Substitui o calendário mensal da v0, que não servia a nenhuma tarefa do turno.
 *
 * Na coluna lateral (duas colunas) fica como na v0.2: 3 feitas, as abertas e 3 próximas, com o espaçamento do template.
 * Na coluna única a linha ocupava ~1.100 px no retrato e empurrava Recados para longe: lá ela fica compacta (menos
 * espaço entre itens, sem o rótulo repetido) e mostra só a janela que importa agora, as 2 últimas feitas e as 4
 * próximas a fazer, com "Ver o turno inteiro" para abrir no lugar todas as tarefas do turno. Tudo por container query:
 * sem medir em JS, sem divergência de hidratação.
 */
export function LinhaDoTurno() {
  const tarefas = useMinhasTarefas();
  const [inteiro, setInteiro] = React.useState(false);
  const timelineId = React.useId();
  const botaoRef = React.useRef<HTMLButtonElement>(null);
  const ordem = (t: TarefaInstancia) => (t.concluidaEm ?? t.abre).getTime();

  const todasFeitas = tarefas.filter(concluida).sort((a, b) => ordem(a) - ordem(b));
  const abertas = tarefas
    .filter((t) => !concluida(t) && !t.futura)
    .sort((a, b) => a.prazo.getTime() - b.prazo.getTime());
  const todasProximas = tarefas.filter((t) => t.futura).sort((a, b) => a.abre.getTime() - b.abre.getTime());

  const feitas = inteiro ? todasFeitas : todasFeitas.slice(-FEITAS_VISIVEIS);
  const proximas = inteiro ? todasProximas : todasProximas.slice(0, PROXIMAS_VISIVEIS);
  const itens = [...feitas, ...abertas, ...proximas];

  // Janela da coluna única, em índices de `itens`: [inicio, fim).
  const inicio = Math.max(0, feitas.length - FEITAS_NA_JANELA);
  const fim = Math.min(itens.length, feitas.length + A_FAZER_NA_JANELA);
  const foraDaJanela = (indice: number) => !inteiro && (indice < inicio || indice >= fim);
  const escondidas = tarefas.length - (fim - inicio);

  function alternar() {
    const proximo = !inteiro;
    setInteiro(proximo);
    // Ao recolher, a lista encolhe acima do botão: ele volta para a vista em vez de deixar a pessoa em Recados.
    if (!proximo) requestAnimationFrame(() => botaoRef.current?.scrollIntoView({ block: "nearest" }));
  }

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>Linha do turno</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {itens.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sem tarefas neste turno.</p>
        ) : (
          <Timeline id={timelineId} activeIndex={feitas.length} className="@4xl/content:gap-4 gap-3">
            {itens.map((tarefa, indice) => {
              const hora = tarefa.concluidaEm ?? (tarefa.futura ? tarefa.abre : tarefa.prazo);
              const { rotulo } = statusDaTarefa(tarefa);
              // Última da janela com mais itens depois: o conector apontaria para um item escondido.
              const ultimaDaJanela = !inteiro && indice === fim - 1 && fim < itens.length;
              return (
                <TimelineItem
                  key={tarefa.id}
                  // pb-2 na coluna única (o conector cobre até 20 px abaixo do item, então o gap-3 não o corta); pb-8,
                  // o do template, na coluna lateral.
                  className={cn("@4xl/content:not-last:pb-8 pb-2", foraDaJanela(indice) && SO_NA_COLUNA_LATERAL)}
                >
                  <TimelineDot />
                  <TimelineConnector className={ultimaDaJanela ? "@4xl/content:block hidden" : undefined} />
                  <TimelineContent>
                    <TimelineHeader>
                      {/* Tela do operador: no toque nada abaixo de 14 px (docs/12 §3.3). */}
                      <TimelineTime dateTime={hora.toISOString()} className="toque:text-sm tabular-nums">
                        {prefixoDaHora(tarefa)}
                        {formatarHora(hora)}
                      </TimelineTime>
                      <TimelineTitle className="line-clamp-2 text-sm">{tarefa.titulo.split(" · ")[0]}</TimelineTitle>
                    </TimelineHeader>
                    <TimelineDescription
                      className={cn(
                        rotuloRedundante(tarefa) && "@4xl/content:block hidden",
                        tarefa.estado === "atrasada" && "text-destructive",
                      )}
                    >
                      {rotulo}
                    </TimelineDescription>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        )}

        {/* Recolhida, só na coluna única e só se há o que mostrar; aberta, em qualquer arranjo, para poder recolher. */}
        {(inteiro || escondidas > 0) && (
          <Button
            ref={botaoRef}
            variant="outline"
            className={cn("w-full", !inteiro && "@4xl/content:hidden")}
            aria-expanded={inteiro}
            aria-controls={timelineId}
            onClick={alternar}
          >
            {inteiro ? (
              <>
                <ChevronUp data-icon="inline-start" />
                Ver só as próximas
              </>
            ) : (
              <>
                <ChevronDown data-icon="inline-start" />
                Ver o turno inteiro ({tarefas.length} tarefas)
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
