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

/** Recorte de partida: as 3 últimas feitas, as abertas e as 3 próximas. */
const FEITAS_VISIVEIS = 3;
const PROXIMAS_VISIVEIS = 3;

/** Janela visível em qualquer arranjo (v0.4): as últimas feitas e as próximas a fazer. */
const FEITAS_NA_JANELA = 2;
const A_FAZER_NA_JANELA = 4;

function prefixoDaHora(tarefa: { concluidaEm?: Date; futura: boolean }) {
  if (tarefa.concluidaEm) return "feita ";
  return tarefa.futura ? "abre " : "até ";
}

/**
 * O rótulo de situação só repete o que a hora já diz ("feita 06:12" + "Feita", "abre 09:00" + "Abre 09:00", "até 08:00"
 * + "Aberta"). Ele aparece só quando acrescenta: atrasada e com NC.
 */
function rotuloRedundante(tarefa: TarefaInstancia) {
  return tarefa.estado !== "atrasada" && tarefa.estado !== "com_nc";
}

/**
 * O turno lido de cima para baixo: o que já foi feito, o que está aberto e o que vem.
 * Substitui o calendário mensal da v0, que não servia a nenhuma tarefa do turno.
 *
 * v0.4 (docs/14): compacta em todos os arranjos. No notebook a versão longa (3 feitas, abertas, 3 próximas, com o
 * espaçamento do template) passava de 1.000 px no trilho lateral e deixava a coluna principal vazia embaixo. Agora
 * mostra só a janela que importa agora, as 2 últimas feitas e as 4 próximas a fazer, sem o rótulo que repete a hora,
 * com "Ver o turno inteiro" para abrir no lugar todas as tarefas do turno.
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

  // Título curto (o trecho antes de " · ", sem o equipamento repetido em toda linha), a não ser que duas rotinas
  // diferentes do turno fiquem com o mesmo nome curto (ex.: PPLI de duas envolvedoras): aí vai o título inteiro.
  const nomeCurto = (t: TarefaInstancia) => t.titulo.split(" · ")[0] ?? t.titulo;
  const titulosPorNome = new Map<string, Set<string>>();
  for (const t of tarefas)
    titulosPorNome.set(nomeCurto(t), (titulosPorNome.get(nomeCurto(t)) ?? new Set()).add(t.titulo));
  const tituloNaLinha = (t: TarefaInstancia) =>
    (titulosPorNome.get(nomeCurto(t))?.size ?? 0) > 1 ? t.titulo : nomeCurto(t);

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
    <Card>
      <CardHeader>
        <CardTitle>Linha do turno</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {itens.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sem tarefas neste turno.</p>
        ) : (
          <Timeline id={timelineId} activeIndex={feitas.length} className="gap-3">
            {itens.map((tarefa, indice) => {
              const hora = tarefa.concluidaEm ?? (tarefa.futura ? tarefa.abre : tarefa.prazo);
              const { rotulo } = statusDaTarefa(tarefa);
              // Última da janela com mais itens depois: o conector apontaria para um item escondido.
              const ultimaDaJanela = !inteiro && indice === fim - 1 && fim < itens.length;
              return (
                <TimelineItem
                  key={tarefa.id}
                  // pb-2: o conector cobre até 20 px abaixo do item, então o gap-3 não o corta.
                  className={cn("pb-2", foraDaJanela(indice) && "hidden")}
                >
                  <TimelineDot />
                  <TimelineConnector className={ultimaDaJanela ? "hidden" : undefined} />
                  <TimelineContent>
                    <TimelineHeader>
                      {/* Tela do operador: no toque nada abaixo de 14 px (docs/12 §3.3). */}
                      <TimelineTime dateTime={hora.toISOString()} className="toque:text-sm tabular-nums">
                        {prefixoDaHora(tarefa)}
                        {formatarHora(hora)}
                      </TimelineTime>
                      <TimelineTitle className="line-clamp-2 text-sm">{tituloNaLinha(tarefa)}</TimelineTitle>
                    </TimelineHeader>
                    <TimelineDescription
                      className={cn(
                        rotuloRedundante(tarefa) && "hidden",
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

        {/* Só se há o que mostrar; aberta, para poder recolher. */}
        {(inteiro || escondidas > 0) && (
          <Button
            ref={botaoRef}
            variant="secondary"
            className="w-full"
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
