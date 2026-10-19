"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { HoraDoTurno } from "@/domain/producao";

import { tonHora, tonTurno } from "./formato";

const configHora = {
  toneladas: { label: "Na hora", color: "var(--chart-2)" },
} satisfies ChartConfig;

const configAcumulado = {
  acumulado: { label: "Realizado", color: "var(--primary)" },
  metaAcumulada: { label: "Meta acumulada", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

/** Amostra da legenda direta: barra, linha cheia ou tracejada, na cor da série. O texto fica na cor do texto. */
function Amostra({ tipo, cor }: { readonly tipo: "barra" | "linha" | "tracejado"; readonly cor: string }) {
  if (tipo === "barra")
    return <span aria-hidden className="size-3 shrink-0 rounded-[3px]" style={{ background: cor }} />;
  return (
    <span
      aria-hidden
      className="w-4 shrink-0 border-t-2"
      style={{ borderColor: cor, borderTopStyle: tipo === "tracejado" ? "dashed" : "solid" }}
    />
  );
}

function Legenda({
  itens,
}: {
  readonly itens: { tipo: "barra" | "linha" | "tracejado"; cor: string; rotulo: string }[];
}) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-sm">
      {itens.map((i) => (
        <li key={i.rotulo} className="flex items-center gap-1.5">
          <Amostra tipo={i.tipo} cor={i.cor} />
          {i.rotulo}
        </li>
      ))}
    </ul>
  );
}

/**
 * Gráfico do Hora x Hora no lugar do "Traffic Quality" do Analytics (mesmo ComposedChart, grade horizontal e eixos sem
 * linha). Toneladas por hora e acumulado têm escalas diferentes (3 t × 23 t): em vez de dois eixos Y no mesmo gráfico,
 * dois painéis com o mesmo eixo de horas, um sobre o outro. Altura fixa, legenda direta acima de cada painel e a meta
 * em tracejado cinza, para o realizado ser a única cor forte.
 */
export function GraficoHoraAHora({
  serie,
  metaHoraTon,
}: {
  readonly serie: HoraDoTurno[];
  readonly metaHoraTon: number;
}) {
  const dados = serie.map((h, i) => {
    const contada = h.estado === "apontada" || h.estado === "pendente";
    return {
      hora: h.rotulo,
      toneladas: h.toneladas === null ? null : Math.round(h.toneladas * 100) / 100,
      acumulado: contada ? Math.round(h.toneladasAcumuladas * 100) / 100 : null,
      // A trajetória da meta vai até o fim do turno, para mostrar quanto falta.
      metaAcumulada: Math.round(metaHoraTon * (i + 1) * 100) / 100,
    };
  });
  const maiorHora = Math.max(metaHoraTon, ...dados.map((d) => d.toneladas ?? 0));
  const metaTurno = metaHoraTon * serie.length;
  const ultimo = dados.findLast((d) => d.acumulado !== null);

  const eixoX = <XAxis dataKey="hora" axisLine={false} tickLine={false} tickMargin={10} interval={0} minTickGap={0} />;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Hora a hora</CardTitle>
        <CardDescription>
          {ultimo
            ? `Até as ${ultimo.hora}: ${tonTurno(ultimo.acumulado ?? 0)} de ${tonTurno(ultimo.metaAcumulada)} da meta.`
            : "Nenhuma hora fechada ainda."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <figure className="flex flex-col gap-3">
          <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="font-medium text-sm toque:text-base">Toneladas por hora</span>
            <Legenda
              itens={[
                { tipo: "barra", cor: "var(--chart-2)", rotulo: "Na hora" },
                { tipo: "tracejado", cor: "var(--muted-foreground)", rotulo: `Meta ${tonHora(metaHoraTon)}` },
              ]}
            />
          </figcaption>
          <ChartContainer config={configHora} className="aspect-auto h-40 w-full">
            <ComposedChart data={dados} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} />
              {eixoX}
              <YAxis
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                width={36}
                domain={[0, Math.ceil(maiorHora * 1.15)]}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.6 }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => `Hora das ${payload?.[0]?.payload?.hora ?? ""}`}
                    formatter={(valor) => (
                      <span className="flex w-full justify-between gap-4">
                        <span className="text-muted-foreground">Na hora</span>
                        <span className="font-medium tabular-nums">{tonHora(Number(valor))}</span>
                      </span>
                    )}
                  />
                }
              />
              <ReferenceLine
                y={metaHoraTon}
                stroke="var(--muted-foreground)"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                ifOverflow="extendDomain"
              />
              <Bar dataKey="toneladas" fill="var(--color-toneladas)" radius={[4, 4, 0, 0]} maxBarSize={44} />
            </ComposedChart>
          </ChartContainer>
        </figure>

        <figure className="flex flex-col gap-3">
          <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="font-medium text-sm toque:text-base">Acumulado no turno</span>
            <Legenda
              itens={[
                { tipo: "linha", cor: "var(--primary)", rotulo: "Realizado" },
                { tipo: "tracejado", cor: "var(--muted-foreground)", rotulo: `Meta ${tonTurno(metaTurno)} no turno` },
              ]}
            />
          </figcaption>
          <ChartContainer config={configAcumulado} className="aspect-auto h-40 w-full">
            <ComposedChart data={dados} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} />
              {eixoX}
              <YAxis
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                width={36}
                domain={[0, Math.ceil(metaTurno * 1.05)]}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={{ stroke: "var(--border)" }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(_, payload) => `Até as ${payload?.[0]?.payload?.hora ?? ""}`}
                    formatter={(valor, nome) => (
                      <span className="flex w-full justify-between gap-4">
                        <span className="text-muted-foreground">
                          {configAcumulado[nome as keyof typeof configAcumulado]?.label ?? nome}
                        </span>
                        <span className="font-medium tabular-nums">{tonTurno(Number(valor))}</span>
                      </span>
                    )}
                  />
                }
              />
              <Line
                dataKey="metaAcumulada"
                stroke="var(--color-metaAcumulada)"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                type="linear"
              />
              <Line
                dataKey="acumulado"
                stroke="var(--color-acumulado)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--color-acumulado)", stroke: "var(--card)", strokeWidth: 2 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
                type="linear"
              />
            </ComposedChart>
          </ChartContainer>
        </figure>
      </CardContent>
    </Card>
  );
}
