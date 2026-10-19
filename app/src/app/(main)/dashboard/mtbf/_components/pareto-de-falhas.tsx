"use client";

import { ChartColumn } from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, LabelList, Line, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { localRepository } from "@/data/repository";
import { corteDoTurno, pareto } from "@/domain/falhas";
import { turnoAtual } from "@/domain/turno";
import type { EventoFalha } from "@/domain/types";
import { useAgora } from "@/stores/session/session-store";

/** Barras em âmbar, a cor de "parada" da tela (faixas da linha do tempo); o % acumulado no texto, sem cor nova. */
const chartConfig = {
  quantidade: { label: "Falhas", color: "var(--chart-5)" },
  acumulado: { label: "% acumulado", color: "var(--foreground)" },
} satisfies ChartConfig;

/** Rótulo do eixo em até duas linhas: os nomes dos tipos ("Ajuste de temperatura") não cabem numa só. */
function RotuloDoTipo({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const palavras = (payload?.value ?? "").split(" ");
  const linhas: string[] = [];
  for (const palavra of palavras) {
    const ultima = linhas.at(-1);
    if (ultima !== undefined && `${ultima} ${palavra}`.length <= 11) linhas[linhas.length - 1] = `${ultima} ${palavra}`;
    else linhas.push(palavra);
  }
  return (
    <text x={x} y={y} textAnchor="middle" className="fill-muted-foreground">
      {linhas.slice(0, 2).map((linha, i) => (
        <tspan key={linha} x={x} dy={i === 0 ? 12 : 14}>
          {i === 1 && linhas.length > 2 ? `${linha}…` : linha}
        </tspan>
      ))}
    </text>
  );
}

/**
 * Pareto do turno: falhas por tipo em barras (da mais frequente para a menos), com a linha do % acumulado. Legenda
 * direta: o número em cima de cada barra e o % acumulado no último ponto da linha, sem caixa de legenda. Altura fixa,
 * para o card não pular quando os tipos mudam.
 */
export function ParetoDeFalhas({ falhas }: { falhas: readonly EventoFalha[] }) {
  const agora = useAgora();
  const corte = corteDoTurno(turnoAtual(agora), agora);
  const dados = pareto(falhas, localRepository.tiposFalha(), corte).map((item) => ({
    ...item,
    acumulado: Math.round(item.acumulado),
  }));
  const maximo = Math.max(1, ...dados.map((d) => d.quantidade));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Pareto das falhas</CardTitle>
        <CardDescription>
          {dados.length > 0
            ? `Barras: falhas por tipo. Linha: % acumulado. ${dados[0]?.nome} lidera.`
            : "Quais tipos mais param a máquina neste turno."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {dados.length === 0 ? (
          <Empty className="h-64 border-none p-0 md:p-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ChartColumn />
              </EmptyMedia>
              <EmptyTitle>Sem falhas para comparar</EmptyTitle>
              <EmptyDescription>O Pareto aparece com a primeira falha apontada.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full toque:text-sm">
            <ComposedChart data={dados} margin={{ top: 22, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="nome"
                tickLine={false}
                axisLine={false}
                interval={0}
                height={40}
                tick={<RotuloDoTipo />}
              />
              <YAxis
                yAxisId="quantidade"
                allowDecimals={false}
                domain={[0, maximo]}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <YAxis
                yAxisId="acumulado"
                orientation="right"
                domain={[0, 100]}
                ticks={[0, 50, 100]}
                tickFormatter={(v) => `${v}%`}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(valor, nome) =>
                      nome === "acumulado" ? `${valor}% acumulado` : `${valor} ${valor === 1 ? "falha" : "falhas"}`
                    }
                  />
                }
              />
              <Bar
                yAxisId="quantidade"
                dataKey="quantidade"
                fill="var(--color-quantidade)"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
                isAnimationActive={false}
              >
                <LabelList dataKey="quantidade" position="top" offset={6} className="fill-foreground font-medium" />
              </Bar>
              <Line
                yAxisId="acumulado"
                dataKey="acumulado"
                type="linear"
                stroke="var(--color-acumulado)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--color-acumulado)" }}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="acumulado"
                  position="top"
                  offset={8}
                  className="fill-muted-foreground"
                  formatter={(v: unknown) => `${v}%`}
                />
              </Line>
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
