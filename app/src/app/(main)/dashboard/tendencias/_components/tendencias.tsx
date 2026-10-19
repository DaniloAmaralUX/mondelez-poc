"use client";

import { useMemo, useState } from "react";

import { Lightbulb } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { TurnoHistorico } from "@/data/historico";
import { localRepository } from "@/data/repository";
import { useHistoricoDasLinhas } from "@/hooks/use-producao";

const TURNOS_ANALISADOS = 21;
const TODAS = "todas";
const EQUIPAMENTOS = ["loeschpack-2", "loeschpack-4", "loeschpack-5"];

const configNc = { quantidade: { label: "Não conformidades", color: "var(--chart-1)" } } satisfies ChartConfig;
const configFalhas = { quantidade: { label: "Falhas", color: "var(--chart-2)" } } satisfies ChartConfig;
const configGe = { ge: { label: "GE médio", color: "var(--chart-1)" } } satisfies ChartConfig;

function nomeDoItem(chave: string): string {
  const [formId, itemId] = chave.split(":");
  const form = localRepository.formulario(formId ?? "");
  const item = form?.itens.find((i) => i.id === itemId);
  return item ? item.texto : chave;
}

function somar<T extends string>(lista: TurnoHistorico[], campo: (t: TurnoHistorico) => Partial<Record<T, number>>) {
  const total = new Map<T, number>();
  for (const t of lista) {
    for (const [chave, n] of Object.entries(campo(t)) as [T, number][]) total.set(chave, (total.get(chave) ?? 0) + n);
  }
  return [...total.entries()].sort((a, b) => b[1] - a[1]);
}

/**
 * Tendências (RF-16, v0.5): onde as não conformidades e as falhas se repetem, por item, equipamento, tipo e turno do
 * dia, nos últimos 21 turnos das linhas (histórico simulado de `data/historico`). Jobs: gerente "o sistema me mostra o
 * padrão de falhas que se repetem" e especialista "NCs e falhas por equipamento e turno". Template: Analytics.
 */
export function Tendencias() {
  const historico = useHistoricoDasLinhas(TURNOS_ANALISADOS);
  const [linhaId, setLinhaId] = useState<string>(TODAS);
  const linhas = localRepository.linhas("chocolate");

  const dados = useMemo(() => {
    const lista = historico.filter((t) => linhaId === TODAS || t.linhaId === linhaId);
    const nc = somar(lista, (t) => t.ncPorItem).slice(0, 8);
    const falhasPorTipo = somar(lista, (t) =>
      Object.fromEntries(Object.entries(t.falhasPorTipo).map(([k, v]) => [k, v.quantidade])),
    );
    const mapa = EQUIPAMENTOS.map((eq) => ({
      equipamentoId: eq,
      porTurno: ([1, 2, 3] as const).map((n) =>
        lista.filter((t) => t.numero === n).reduce((s, t) => s + (t.falhasPorEquipamento[eq] ?? 0), 0),
      ),
    }));
    const maxMapa = Math.max(1, ...mapa.flatMap((m) => m.porTurno));
    const gePorTurno = ([1, 2, 3] as const).map((n) => {
      const doTurno = lista.filter((t) => t.numero === n && t.kpis.ge !== null);
      const media = doTurno.reduce((s, t) => s + (t.kpis.ge ?? 0), 0) / Math.max(1, doTurno.length);
      return { turno: `${n}º turno`, ge: Math.round(media * 100) };
    });
    const totalNc = lista.reduce((s, t) => s + t.kpis.naoConformes, 0);
    const totalFalhas = lista.reduce((s, t) => s + t.kpis.falhas, 0);
    const minutosParados = lista.reduce((s, t) => s + t.kpis.minutosParados, 0);
    const geMedio = lista.reduce((s, t) => s + (t.kpis.ge ?? 0), 0) / Math.max(1, lista.length);

    // Achado principal: a célula mais quente do mapa e o tipo de falha que mais aparece.
    const quente = mapa
      .flatMap((m) => m.porTurno.map((n, i) => ({ equipamentoId: m.equipamentoId, turno: i + 1, n })))
      .sort((a, b) => b.n - a.n)[0];
    const tipoTop = falhasPorTipo[0];
    return {
      nc: nc.map(([chave, quantidade]) => ({ item: nomeDoItem(chave), quantidade })),
      falhas: falhasPorTipo.map(([tipoId, quantidade]) => ({
        tipo: localRepository.tiposFalha().find((t) => t.id === tipoId)?.nome ?? tipoId,
        quantidade,
      })),
      mapa,
      maxMapa,
      gePorTurno,
      totalNc,
      totalFalhas,
      minutosParados,
      geMedio,
      quente,
      tipoTop,
      turnos: new Set(lista.map((t) => t.turnoChave)).size,
    };
  }, [historico, linhaId]);

  const nomeEq = (id: string) => localRepository.equipamento(id)?.nome ?? id;
  const tipoTopNome = dados.tipoTop
    ? (localRepository.tiposFalha().find((t) => t.id === dados.tipoTop?.[0])?.nome ?? dados.tipoTop[0])
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[2rem] leading-[1.1]">Tendências</h1>
          <p className="text-lg text-muted-foreground">
            Últimos {dados.turnos} turnos ·{" "}
            {linhaId === TODAS ? "todas as linhas" : localRepository.linha(linhaId)?.nome}
          </p>
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={2}
          value={linhaId}
          onValueChange={(v) => v && setLinhaId(v)}
          aria-label="Linha"
          className="flex-wrap"
        >
          <ToggleGroupItem value={TODAS} className="h-10 px-3">
            Todas
          </ToggleGroupItem>
          {linhas.map((l) => (
            <ToggleGroupItem key={l.id} value={l.id} className="h-10 px-3">
              {l.nome}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </header>

      <div className="grid @2xl/content:grid-cols-4 grid-cols-2 gap-4">
        {[
          { rotulo: "Não conformidades", valor: dados.totalNc.toLocaleString("pt-BR") },
          { rotulo: "Falhas", valor: dados.totalFalhas.toLocaleString("pt-BR") },
          {
            rotulo: "Horas paradas",
            valor: (dados.minutosParados / 60).toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
          },
          { rotulo: "GE médio", valor: `${Math.round(dados.geMedio * 100)} %` },
        ].map((k) => (
          <Card key={k.rotulo} size="sm">
            <CardHeader>
              <CardDescription>{k.rotulo}</CardDescription>
              <CardTitle className="font-semibold text-3xl tabular-nums">{k.valor}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {dados.quente && dados.quente.n > 0 && tipoTopNome && (
        <Card className="flex-row items-start gap-3 px-4">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-500/12 text-amber-700 dark:text-amber-400"
          >
            <Lightbulb className="size-5" />
          </span>
          <p className="text-base">
            <span className="font-semibold">{tipoTopNome}</span> é a falha que mais se repete, e a{" "}
            <span className="font-semibold">{nomeEq(dados.quente.equipamentoId)}</span> no{" "}
            <span className="font-semibold">{dados.quente.turno}º turno</span> concentra mais falhas ({dados.quente.n}).
            Vale começar por aí.
          </p>
        </Card>
      )}

      <div className="grid @min-[60rem]/content:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Não conformidades por item</CardTitle>
            <CardDescription>Os itens de checklist que mais saem do padrão</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={configNc} className="h-72 w-full">
              <BarChart accessibilityLayer data={dados.nc} layout="vertical" margin={{ left: 0, right: 32 }}>
                <CartesianGrid horizontal={false} vertical={false} />
                <YAxis
                  dataKey="item"
                  type="category"
                  width={200}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 13 }}
                />
                <XAxis dataKey="quantidade" type="number" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Bar dataKey="quantidade" fill="var(--color-quantidade)" radius={6}>
                  <LabelList dataKey="quantidade" position="right" className="fill-foreground" fontSize={13} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Falhas por equipamento e turno</CardTitle>
            <CardDescription>Quanto mais escuro, mais falhas no período</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full border-separate border-spacing-1 text-sm">
              <thead>
                <tr>
                  <th className="text-left font-medium text-muted-foreground" scope="col">
                    Equipamento
                  </th>
                  {[1, 2, 3].map((n) => (
                    <th key={n} className="font-medium text-muted-foreground" scope="col">
                      {n}º turno
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dados.mapa.map((linha) => (
                  <tr key={linha.equipamentoId}>
                    <th scope="row" className="py-2 pr-2 text-left font-medium">
                      {nomeEq(linha.equipamentoId)}
                    </th>
                    {linha.porTurno.map((n, i) => {
                      const intensidade = n / dados.maxMapa;
                      return (
                        <td
                          // biome-ignore lint/suspicious/noArrayIndexKey: as colunas são os três turnos, fixas
                          key={i}
                          className="h-14 rounded-lg text-center font-semibold tabular-nums"
                          style={{
                            background: `color-mix(in oklch, var(--primary) ${Math.round(8 + intensidade * 72)}%, var(--card))`,
                            color: intensidade > 0.5 ? "var(--primary-foreground)" : "var(--foreground)",
                          }}
                        >
                          {n}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Falhas por tipo</CardTitle>
            <CardDescription>Pareto do período</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={configFalhas} className="h-72 w-full">
              <BarChart accessibilityLayer data={dados.falhas} margin={{ top: 20 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="tipo"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  tick={{ fontSize: 12 }}
                  angle={-20}
                  textAnchor="end"
                  height={56}
                />
                <YAxis hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Bar dataKey="quantidade" fill="var(--color-quantidade)" radius={6}>
                  <LabelList dataKey="quantidade" position="top" className="fill-foreground" fontSize={13} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>GE por turno do dia</CardTitle>
            <CardDescription>Média do período, em %</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={configGe} className="h-72 w-full">
              <BarChart accessibilityLayer data={dados.gePorTurno} margin={{ top: 20 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="turno" tickLine={false} axisLine={false} />
                <YAxis hide domain={[0, 100]} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Bar dataKey="ge" fill="var(--color-ge)" radius={6}>
                  <LabelList
                    dataKey="ge"
                    position="top"
                    className="fill-foreground"
                    fontSize={13}
                    formatter={(v) => `${v} %`}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <p className="text-muted-foreground text-sm">
        Turnos anteriores simulados no protótipo (gerador determinístico); no piloto, vêm dos registros das linhas.
      </p>
    </div>
  );
}
