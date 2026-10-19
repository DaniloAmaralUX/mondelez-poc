"use client";

import { cn } from "cn";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { LinhaNoRelatorio } from "@/hooks/use-producao";

import {
  aderenciaAMeta,
  type Comparacao,
  compararGe,
  compararMtbf,
  compararQuantidade,
  formatarGe,
  formatarMinutos,
  formatarPercentual,
  formatarToneladas,
  geAbaixoDoLimite,
} from "./indicadores";

const TOM = {
  melhor: "text-green-700 dark:text-green-400",
  pior: "text-red-700 dark:text-red-400",
  igual: "text-muted-foreground",
} as const;

/** Seta pelo sentido do número (sobe, desce, igual), independente de ser bom ou ruim. */
function setaDe(texto: string) {
  if (texto.startsWith("+")) return TrendingUp;
  if (texto.startsWith("−")) return TrendingDown;
  return Minus;
}

/** Seta e diferença contra o turno anterior. A seta acompanha o sentido do número; a cor diz se melhorou. */
export function Variacao({ comparacao, className }: { comparacao: Comparacao | null; className?: string }) {
  if (!comparacao) return null;
  const Seta = setaDe(comparacao.texto);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium text-sm tabular-nums",
        TOM[comparacao.tendencia],
        className,
      )}
    >
      <Seta className="size-4" aria-hidden />
      {comparacao.texto}
    </span>
  );
}

/**
 * Card de uma linha no relatório (mockup da Mondelez: BIS 1–4 lado a lado). GE em destaque com a variação contra o turno
 * anterior; toneladas sobre a meta com barra; MTBF, maior parada, alertas e pedidos de ajuda embaixo. As linhas que vêm
 * do gerador levam o selo "simulado": só a Bis 2 é registrada de verdade no protótipo.
 */
export function CardDaLinha({ item, destaque = false }: { item: LinhaNoRelatorio; destaque?: boolean }) {
  const { linha, kpis, anterior, simulado } = item;
  if (!kpis) return null;
  const aderencia = aderenciaAMeta(kpis);
  const geRuim = geAbaixoDoLimite(kpis.ge);

  return (
    <Card className={cn("min-w-0", destaque && "ring-2 ring-primary/40")}>
      <CardHeader>
        <CardTitle className="text-lg">{linha.nome}</CardTitle>
        <CardDescription>{simulado ? "Dados do gerador" : "Registrado no tablet"}</CardDescription>
        <CardAction>
          {simulado ? (
            <Badge variant="outline" className="toque:text-sm">
              Simulado
            </Badge>
          ) : (
            <Badge variant="secondary" className="toque:text-sm">
              Ao vivo
            </Badge>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-sm">GE</span>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className={cn(
                "font-semibold text-4xl tabular-nums leading-none tracking-tight",
                geRuim && "text-red-700 dark:text-red-400",
              )}
            >
              {formatarGe(kpis.ge)}
            </span>
            <Variacao comparacao={compararGe(kpis.ge, anterior.ge)} />
          </div>
          <span className="text-muted-foreground text-sm">
            Turno anterior {formatarGe(anterior.ge)}
            {geRuim ? " · abaixo de 70 %" : ""}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Toneladas</span>
            <span className="tabular-nums">
              <span className="font-semibold text-base">{formatarToneladas(kpis.toneladas)}</span> de{" "}
              {formatarToneladas(kpis.metaToneladas)}
            </span>
          </div>
          {aderencia !== null && (
            <Progress
              value={Math.min(100, aderencia * 100)}
              aria-label={`${formatarPercentual(aderencia)} da meta até agora`}
              className="h-1.5 bg-secondary"
            />
          )}
        </div>

        <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 text-sm">
          <div className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-muted-foreground">MTBF</dt>
            <dd className="font-medium text-base tabular-nums">{formatarMinutos(kpis.mtbfMin)}</dd>
            <dd>
              <Variacao comparacao={compararMtbf(kpis.mtbfMin, anterior.mtbfMin)} />
            </dd>
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-muted-foreground">Maior parada</dt>
            <dd className="truncate font-medium text-base" title={kpis.maiorParada?.nome}>
              {kpis.maiorParada?.nome ?? "Nenhuma"}
            </dd>
            {kpis.maiorParada && <dd className="text-muted-foreground tabular-nums">{kpis.maiorParada.minutos} min</dd>}
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-muted-foreground">Alertas</dt>
            <dd className="font-medium text-base tabular-nums">{kpis.alertasAbertos + kpis.alertasTratados}</dd>
            <dd className="text-muted-foreground tabular-nums">{kpis.alertasAbertos} abertos</dd>
            <dd>
              <Variacao
                comparacao={compararQuantidade(
                  kpis.alertasAbertos + kpis.alertasTratados,
                  anterior.alertasAbertos + anterior.alertasTratados,
                )}
              />
            </dd>
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-muted-foreground">Pedidos de ajuda</dt>
            <dd className="font-medium text-base tabular-nums">{kpis.pedidosAjuda}</dd>
            <dd>
              <Variacao comparacao={compararQuantidade(kpis.pedidosAjuda, anterior.pedidosAjuda)} />
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
