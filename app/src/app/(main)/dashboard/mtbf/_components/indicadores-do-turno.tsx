"use client";

import { TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { localRepository } from "@/data/repository";
import { corteDoTurno, falhasRepetidas, indicadoresDeFalha, LIMITE_REPETICAO, maiorParada } from "@/domain/falhas";
import { turnoAtual } from "@/domain/turno";
import type { EventoFalha } from "@/domain/types";
import { formatarDuracao } from "@/lib/format";
import { useAgora } from "@/stores/session/session-store";

const minutos = (min: number) => formatarDuracao(min * 60_000);

/**
 * Indicadores do turno até agora (RN-06): falhas, tempo parado, MTBF e falhas em curso, no padrão de número grande dos
 * widgets da Minha Rotina. Quando um tipo chega a `LIMITE_REPETICAO`, o aviso diz que a liderança já recebeu o alerta
 * A-REPET: o operador não precisa ligar para ninguém por isso.
 */
export function IndicadoresDoTurno({ falhas }: { falhas: readonly EventoFalha[] }) {
  const agora = useAgora();
  const turno = turnoAtual(agora);
  const corte = corteDoTurno(turno, agora);
  const tipos = localRepository.tiposFalha();
  const indicadores = indicadoresDeFalha(falhas, turno, agora);
  const maior = maiorParada(falhas, tipos, corte);
  const repetidas = falhasRepetidas(falhas);

  const numeros = [
    { rotulo: "Falhas", valor: String(indicadores.falhas) },
    { rotulo: "Parado", valor: minutos(indicadores.minutosParados) },
    { rotulo: "MTBF", valor: indicadores.mtbfMin === null ? "—" : minutos(indicadores.mtbfMin) },
    { rotulo: "Em curso", valor: String(indicadores.emCurso), alerta: indicadores.emCurso > 0 },
  ];

  return (
    <Card className="@container/indicadores h-full">
      <CardHeader>
        <CardTitle>Turno até agora</CardTitle>
        <CardDescription>
          {indicadores.mtbfMin === null
            ? "Sem falhas no turno: o MTBF aparece na primeira."
            : "MTBF = tempo operando ÷ número de falhas."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid @min-[34rem]/indicadores:grid-cols-4 grid-cols-2 gap-3">
          {numeros.map((n) => (
            <div key={n.rotulo} className="flex min-w-0 flex-col gap-1 rounded-xl bg-muted/60 p-3">
              <dt className="text-muted-foreground text-sm">{n.rotulo}</dt>
              <dd
                className={
                  n.alerta
                    ? "font-semibold text-2xl text-amber-700 tabular-nums leading-tight tracking-tight dark:text-amber-400"
                    : "font-semibold text-2xl tabular-nums leading-tight tracking-tight"
                }
              >
                {n.valor}
              </dd>
            </div>
          ))}
        </dl>

        {maior && maior.minutos >= 1 && (
          <p className="text-muted-foreground text-sm">
            Maior parada: <span className="font-medium text-foreground">{maior.nome}</span>, {minutos(maior.minutos)}
          </p>
        )}

        {repetidas.map((rep) => {
          const tipo = tipos.find((t) => t.id === rep.tipoId);
          return (
            <Alert key={rep.tipoId} className="border-amber-500/40 bg-amber-500/5">
              <TriangleAlert className="text-amber-600 dark:text-amber-400" />
              <AlertTitle>
                {tipo?.nome ?? rep.tipoId} se repetiu {rep.vezes} vezes
              </AlertTitle>
              <AlertDescription>
                Com {LIMITE_REPETICAO} falhas do mesmo tipo no turno, a liderança recebeu o alerta de falha repetida
                (A-REPET){tipo?.critica ? " como crítico" : ""}. Continue apontando normalmente.
              </AlertDescription>
            </Alert>
          );
        })}
      </CardContent>
    </Card>
  );
}
