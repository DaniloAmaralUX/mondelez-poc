"use client";

import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { localRepository } from "@/data/repository";
import { LIMITE_REFUGO_KG, LIMITE_SOBREPESO_G } from "@/domain/alertas-indicadores";
import type { ApontamentoPerdas, TarefaInstancia } from "@/domain/types";
import { formatarHora, primeiroNome } from "@/lib/format";
import { STATUS_LEGIVEL } from "@/lib/status-legivel";

import { gramas, quilos, rotuloDoBloco } from "./formato";

export interface LinhaDoBloco {
  tarefa: TarefaInstancia;
  apontamento: ApontamentoPerdas | undefined;
}

function Situacao({ linha }: { readonly linha: LinhaDoBloco }) {
  const { tarefa, apontamento } = linha;
  let s: { rotulo: string; variante: "success" | "warning" | "error" | "info" | "default" };
  if (apontamento) {
    const acima = apontamento.refugoKg > LIMITE_REFUGO_KG || apontamento.sobrepesoG > LIMITE_SOBREPESO_G;
    s = acima
      ? { rotulo: "Acima do limite", variante: "warning" }
      : { rotulo: "Dentro do limite", variante: "success" };
  } else if (tarefa.estado === "atrasada") s = { rotulo: "Pendente", variante: "error" };
  else if (tarefa.futura) s = { rotulo: "Mais tarde", variante: "default" };
  else s = { rotulo: "Aberto", variante: "info" };
  return (
    <Status variant={s.variante} className={cn("toque:text-sm", STATUS_LEGIVEL)}>
      <StatusIndicator className={s.variante === "error" ? undefined : "before:hidden"} />
      <StatusLabel>{s.rotulo}</StatusLabel>
    </Status>
  );
}

/** Número com a marca de "acima do limite" por extenso, não só na cor. */
function Valor({
  rotulo,
  texto,
  acima,
}: {
  readonly rotulo: string;
  readonly texto: string;
  readonly acima?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted-foreground text-sm">{rotulo}</dt>
      <dd className={cn("font-medium tabular-nums", acima && "text-red-700 dark:text-red-400")}>
        {texto}
        {acima && <span className="sr-only"> (acima do limite)</span>}
      </dd>
    </div>
  );
}

/** Os blocos de 2 horas do turno, com o que foi apontado, quem apontou e a ação de apontar ou corrigir. */
export function BlocosDoTurno({
  linhas,
  podeEscrever,
  selecionada,
  onEscolher,
}: {
  readonly linhas: LinhaDoBloco[];
  readonly podeEscrever: boolean;
  readonly selecionada: string | undefined;
  readonly onEscolher: (linha: LinhaDoBloco) => void;
}) {
  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="pb-4">
        <CardTitle>Blocos do turno</CardTitle>
        <CardDescription>Um apontamento a cada 2 horas, na hora seguinte ao início do bloco.</CardDescription>
      </CardHeader>
      <ul aria-label="Blocos do turno" className="divide-y divide-border/60 border-t">
        {linhas.map((linha) => {
          const { tarefa, apontamento: a } = linha;
          const autor = a ? localRepository.usuario(a.usuarioId) : undefined;
          let acao: string | undefined;
          if (podeEscrever && a) acao = "Corrigir";
          else if (podeEscrever && !tarefa.futura) acao = "Apontar";
          return (
            <li
              key={tarefa.id}
              aria-current={selecionada === tarefa.id ? "true" : undefined}
              className={cn(
                "flex flex-col gap-3 @min-[60rem]/content:px-6 px-4 py-4",
                !a && tarefa.estado === "atrasada" && "bg-red-500/5",
                tarefa.futura && "text-muted-foreground",
                selecionada === tarefa.id && "bg-primary/5",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <p className="font-semibold text-lg tabular-nums">{rotuloDoBloco(tarefa)}</p>
                <Situacao linha={linha} />
              </div>
              {a ? (
                <dl className="grid grid-cols-3 gap-4">
                  <Valor rotulo="Sobrepeso" texto={gramas(a.sobrepesoG)} acima={a.sobrepesoG > LIMITE_SOBREPESO_G} />
                  <Valor rotulo="Refugo" texto={quilos(a.refugoKg)} acima={a.refugoKg > LIMITE_REFUGO_KG} />
                  <Valor rotulo="Reprocesso" texto={quilos(a.reprocessoKg)} />
                </dl>
              ) : (
                <p className="text-muted-foreground text-sm tabular-nums">
                  {tarefa.futura
                    ? `Abre para apontar às ${formatarHora(tarefa.abre)}.`
                    : `Apontar entre ${formatarHora(tarefa.abre)} e ${formatarHora(tarefa.prazo)}.`}
                </p>
              )}
              {(a || acao) && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="wrap-anywhere min-w-0 flex-1 text-muted-foreground text-sm">
                    {a &&
                      `${autor ? primeiroNome(autor.nome) : "—"} às ${formatarHora(new Date(a.em))}${a.motivo ? ` · ${a.motivo}` : ""}${a.observacao ? ` · ${a.observacao}` : ""}`}
                  </p>
                  {acao && (
                    <Button variant="outline" className="h-10 toque:h-14 px-4" onClick={() => onEscolher(linha)}>
                      {acao}
                    </Button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
