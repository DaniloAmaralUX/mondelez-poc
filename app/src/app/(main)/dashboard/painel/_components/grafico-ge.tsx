"use client";

import { CartesianGrid, LabelList, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LIMITE_GE } from "@/domain/alertas-indicadores";
import type { Linha } from "@/domain/types";

import { formatarGe } from "../../relatorio-turno/_components/indicadores";
import { COR_DA_LINHA, type ColunaDeTurno } from "./dados";

const ALTURA = 280;
const MARGEM = { top: 12, right: 96, bottom: 0, left: 0 };
/** Altura útil aproximada da área de plotagem (altura menos margens e eixo X), para afastar os rótulos diretos. */
const ALTURA_PLOT = ALTURA - MARGEM.top - 30;
const DOMINIO: [number, number] = [55, 100];
const VAO_MIN_PX = 16;

/**
 * GE por linha nos últimos turnos e no atual (RF-15): uma linha por Bis, cor fixa por linha, rótulo direto no fim de
 * cada uma (nome e GE de agora, afastados para não se sobreporem) e o limite de 70 % tracejado. A tabela embaixo tem os
 * mesmos números, para quem não distingue as cores e para o toque, onde o tooltip não abre por hover.
 */
export function GraficoGe({ linhas, colunas }: { linhas: readonly Linha[]; colunas: readonly ColunaDeTurno[] }) {
  const dados = colunas.map((c) => ({
    rotulo: c.rotulo,
    ...Object.fromEntries(linhas.map((l) => [l.id, ge100(c.porLinha[l.id]?.ge ?? null)])),
  }));
  const config = Object.fromEntries(
    linhas.map((l) => [l.id, { label: l.nome, color: COR_DA_LINHA[l.id]?.cor ?? "var(--chart-2)" }]),
  ) satisfies ChartConfig;

  // Rótulos diretos: valores finais em ordem, empurrados para baixo até ficarem a 16 px um do outro.
  const ultimo = dados.length - 1;
  const pxPorPonto = ALTURA_PLOT / (DOMINIO[1] - DOMINIO[0]);
  const finais = linhas
    .map((l) => ({ id: l.id, valor: ge100(colunas[ultimo]?.porLinha[l.id]?.ge ?? null) }))
    .filter((f): f is { id: string; valor: number } => f.valor !== null)
    .sort((a, b) => b.valor - a.valor);
  const deslocamento: Record<string, number> = {};
  let anterior = Number.NEGATIVE_INFINITY;
  for (const f of finais) {
    const y = (DOMINIO[1] - f.valor) * pxPorPonto;
    const ajustado = Math.max(y, anterior + VAO_MIN_PX);
    deslocamento[f.id] = ajustado - y;
    anterior = ajustado;
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>GE por linha</CardTitle>
        <CardDescription>Últimos {colunas.length - 1} turnos e o turno atual, até agora.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Legenda">
          {linhas.map((l) => (
            <li key={l.id} className="flex items-center gap-1.5">
              <span aria-hidden className={`h-0.5 w-4 rounded-full ${COR_DA_LINHA[l.id]?.amostra ?? "bg-muted"}`} />
              {l.nome}
            </li>
          ))}
          <li className="flex items-center gap-1.5 text-muted-foreground">
            <span aria-hidden className="w-4 border-muted-foreground border-t border-dashed" />
            Limite de {Math.round(LIMITE_GE * 100)} %
          </li>
        </ul>
        <ChartContainer config={config} className="w-full" style={{ height: ALTURA }}>
          <LineChart accessibilityLayer data={dados} margin={MARGEM}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="rotulo" axisLine={false} tickLine={false} tickMargin={10} tick={{ fontSize: 13 }} />
            <YAxis
              domain={DOMINIO}
              ticks={[60, 70, 80, 90, 100]}
              axisLine={false}
              tickLine={false}
              width={44}
              tick={{ fontSize: 13 }}
              tickFormatter={(v: number) => `${v} %`}
            />
            <ReferenceLine y={LIMITE_GE * 100} stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeWidth={1} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(valor, nome) => (
                    <span className="flex w-full justify-between gap-4">
                      <span className="text-muted-foreground">{config[String(nome)]?.label ?? nome}</span>
                      <span className="font-medium font-mono text-foreground tabular-nums">
                        {formatarGe(typeof valor === "number" ? valor / 100 : null)}
                      </span>
                    </span>
                  )}
                />
              }
            />
            {linhas.map((l) => (
              <Line
                key={l.id}
                dataKey={l.id}
                type="linear"
                stroke={`var(--color-${l.id})`}
                strokeWidth={l.id === "bis-2" ? 2.5 : 2}
                strokeLinecap="round"
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
                isAnimationActive={false}
              >
                <LabelList
                  dataKey={l.id}
                  content={(props) => {
                    const { index, x, y, value } = props as {
                      index?: number;
                      x?: number | string;
                      y?: number | string;
                      value?: number | string;
                    };
                    if (index !== ultimo || value === undefined || value === null) return null;
                    return (
                      <text
                        x={Number(x) + 8}
                        y={Number(y) + (deslocamento[l.id] ?? 0)}
                        dy={4}
                        className="fill-foreground text-[13px]"
                      >
                        {l.nome} · {Math.round(Number(value))} %
                      </text>
                    );
                  }}
                />
              </Line>
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function ge100(ge: number | null): number | null {
  return ge === null ? null : Math.round(ge * 1000) / 10;
}
