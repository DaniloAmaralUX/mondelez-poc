"use client";

import * as React from "react";

import { cn } from "cn";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { KpisTurno, Linha } from "@/domain/types";

import {
  formatarGe,
  formatarMinutos,
  formatarPercentual,
  formatarToneladas,
  geAbaixoDoLimite,
} from "../../relatorio-turno/_components/indicadores";
import { COR_DA_LINHA, type ColunaDeTurno } from "./dados";

type Indicador = "ge" | "toneladas" | "mtbf" | "alertas";

const INDICADORES: { valor: Indicador; rotulo: string }[] = [
  { valor: "ge", rotulo: "GE" },
  { valor: "toneladas", rotulo: "Toneladas × meta" },
  { valor: "mtbf", rotulo: "MTBF" },
  { valor: "alertas", rotulo: "Alertas" },
];

function celula(indicador: Indicador, k: KpisTurno | undefined): { texto: string; ruim: boolean } {
  if (!k) return { texto: "—", ruim: false };
  switch (indicador) {
    case "ge":
      return { texto: formatarGe(k.ge), ruim: geAbaixoDoLimite(k.ge) };
    case "toneladas": {
      const aderencia = k.metaToneladas > 0 ? k.toneladas / k.metaToneladas : null;
      return {
        texto: aderencia === null ? formatarToneladas(k.toneladas) : formatarPercentual(aderencia),
        ruim: aderencia !== null && aderencia < 0.9,
      };
    }
    case "mtbf":
      return { texto: formatarMinutos(k.mtbfMin), ruim: k.mtbfMin !== null && k.mtbfMin < 60 };
    case "alertas":
      return { texto: String(k.alertasAbertos + k.alertasTratados), ruim: k.alertasAbertos + k.alertasTratados >= 4 };
  }
}

const NOTA: Record<Indicador, string> = {
  ge: "Em vermelho, abaixo de 70 %.",
  toneladas: "Toneladas sobre a meta do turno (até agora, no atual). Em vermelho, abaixo de 90 %.",
  mtbf: "Tempo médio entre falhas. Em vermelho, abaixo de 60 min.",
  alertas: "Alertas no turno, abertos e tratados. Em vermelho, 4 ou mais.",
};

/**
 * Linhas × turnos lado a lado (job da gerência: comparar para priorizar recursos), com a escolha do indicador nas abas
 * da tela Finance. Por largura útil: os turnos mais antigos saem primeiro quando a tabela não cabe (sem rolagem lateral
 * no iPad em retrato); "Agora" sempre fica.
 */
export function TabelaLinhasTurnos({
  linhas,
  colunas,
}: {
  linhas: readonly Linha[];
  colunas: readonly ColunaDeTurno[];
}) {
  const [indicador, setIndicador] = React.useState<Indicador>("ge");
  // As abas trocam o indicador da tabela: aria-controls aponta para ela (o padrão do Radix aponta para um TabsContent
  // que esta tela não usa).
  const tabelaId = React.useId();
  const total = colunas.length;

  return (
    <Card className="@container/tabela min-w-0">
      <CardHeader>
        <CardTitle>Linhas × turnos</CardTitle>
        <CardDescription>{NOTA[indicador]}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Tabs value={indicador} onValueChange={(v) => setIndicador(v as Indicador)}>
          <TabsList className="grid @xl/tabela:w-fit w-full @xl/tabela:grid-cols-4 grid-cols-2 gap-1 toque:gap-3 group-data-horizontal/tabs:h-auto">
            {INDICADORES.map((i) => (
              <TabsTrigger key={i.valor} value={i.valor} className="toque:text-sm" aria-controls={tabelaId}>
                {i.rotulo}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Table id={tabelaId}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Linha</TableHead>
              {colunas.map((c, i) => (
                <TableHead
                  key={c.chave}
                  className={cn(
                    "text-right tabular-nums",
                    // Os dois mais antigos só com a tabela larga; o terceiro a partir de 40 rem.
                    i < total - 5 && "@3xl/tabela:table-cell hidden",
                    i === total - 5 && "@xl/tabela:table-cell hidden",
                    c.atual && "font-semibold text-foreground",
                  )}
                >
                  {c.rotulo}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    <span aria-hidden className={`size-2 rounded-full ${COR_DA_LINHA[l.id]?.amostra ?? "bg-muted"}`} />
                    {l.nome}
                  </span>
                </TableCell>
                {colunas.map((c, i) => {
                  const { texto, ruim } = celula(indicador, c.porLinha[l.id]);
                  return (
                    <TableCell
                      key={c.chave}
                      className={cn(
                        "text-right tabular-nums",
                        i < total - 5 && "@3xl/tabela:table-cell hidden",
                        i === total - 5 && "@xl/tabela:table-cell hidden",
                        c.atual && "bg-muted/50 font-semibold",
                        ruim && "text-red-700 dark:text-red-400",
                      )}
                    >
                      {texto}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
