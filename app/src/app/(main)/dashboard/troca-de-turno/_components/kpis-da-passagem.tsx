"use client";

import type { ReactNode } from "react";

import { cn } from "cn";
import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { KpisTurno } from "@/domain/types";

import {
  aderenciaAMeta,
  formatarGe,
  formatarMinutos,
  formatarPercentual,
  formatarToneladas,
  geAbaixoDoLimite,
} from "../../relatorio-turno/_components/indicadores";

/** Campos de indicador que o app preenche sozinho (11), usados na conta "N de M campos prontos". */
export const CAMPOS_DE_INDICADOR = 11;

/**
 * Os números do turno, já preenchidos (RM-13): quatro em destaque (GE, toneladas × meta, MTBF e maior parada, os do
 * mockup da Mondelez) e as contagens embaixo. Container próprio (@container/kpis): no notebook o card tem a largura da
 * coluna do formulário; no iPad, a tela inteira.
 */
export function KpisDaPassagem({
  kpis,
  descricao,
  prontos,
  total,
}: {
  kpis: KpisTurno;
  descricao: string;
  /** Campos da passagem já preenchidos pelo app, de `total`. */
  prontos?: number;
  total?: number;
}) {
  const aderencia = aderenciaAMeta(kpis);
  const semCaixas = kpis.metaTurno === 0;

  return (
    <Card className="@container/kpis">
      <CardHeader>
        <CardTitle>Números do turno</CardTitle>
        <CardDescription>{descricao}</CardDescription>
        {prontos !== undefined && total !== undefined && (
          <CardAction>
            <Badge variant="secondary" className="h-auto gap-1 py-1 text-sm tabular-nums">
              <Sparkles aria-hidden />
              {prontos} de {total} campos prontos
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid @2xl/kpis:grid-cols-4 grid-cols-2 gap-3">
          <Destaque
            rotulo="GE"
            valor={formatarGe(kpis.ge)}
            detalhe={semCaixas ? "Posto sem apontamento de caixas" : "Eficiência global"}
            alerta={geAbaixoDoLimite(kpis.ge)}
          />
          <Destaque
            rotulo="Toneladas"
            valor={semCaixas ? "—" : formatarToneladas(kpis.toneladas)}
            detalhe={semCaixas ? "Sem meta neste posto" : `Meta até agora ${formatarToneladas(kpis.metaToneladas)}`}
          >
            {aderencia !== null && (
              <Progress
                value={Math.min(100, aderencia * 100)}
                aria-label={`${formatarPercentual(aderencia)} da meta até agora`}
                className="mt-2 h-1.5 bg-background"
              />
            )}
          </Destaque>
          <Destaque
            rotulo="MTBF"
            valor={formatarMinutos(kpis.mtbfMin)}
            detalhe={kpis.falhas === 0 ? "Sem falhas no turno" : "Entre falhas"}
          />
          <Destaque
            rotulo="Maior parada"
            valor={kpis.maiorParada ? formatarMinutos(kpis.maiorParada.minutos) : "—"}
            detalhe={kpis.maiorParada?.nome ?? "Nenhuma parada"}
          />
        </dl>
        <dl className="grid @3xl/kpis:grid-cols-5 @xl/kpis:grid-cols-3 grid-cols-2 gap-x-4 gap-y-3 border-t pt-4">
          <Contagem rotulo="Falhas" valor={String(kpis.falhas)} detalhe={`${kpis.minutosParados} min parados`} />
          <Contagem rotulo="Não conformidades" valor={String(kpis.naoConformes)} />
          <Contagem
            rotulo="Alertas"
            valor={`${kpis.alertasAbertos} abertos`}
            detalhe={`${kpis.alertasTratados} tratados`}
          />
          <Contagem rotulo="Pedidos de ajuda" valor={String(kpis.pedidosAjuda)} />
          <Contagem
            rotulo="Tarefas"
            valor={`${kpis.tarefasFeitas} de ${kpis.tarefasTotal}`}
            detalhe={kpis.tarefasAtrasadas > 0 ? `${kpis.tarefasAtrasadas} atrasadas` : "Nenhuma atrasada"}
            alerta={kpis.tarefasAtrasadas > 0}
          />
        </dl>
      </CardContent>
    </Card>
  );
}

function Destaque({
  rotulo,
  valor,
  detalhe,
  alerta = false,
  children,
}: {
  rotulo: string;
  valor: string;
  detalhe: string;
  alerta?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg bg-muted/60 p-3">
      <dt className="text-muted-foreground text-sm">{rotulo}</dt>
      <dd
        className={cn(
          "font-semibold text-2xl tabular-nums leading-tight tracking-tight",
          alerta && "text-red-700 dark:text-red-400",
        )}
      >
        {valor}
      </dd>
      <dd className="truncate text-muted-foreground text-sm" title={detalhe}>
        {detalhe}
      </dd>
      {children && <dd>{children}</dd>}
    </div>
  );
}

function Contagem({
  rotulo,
  valor,
  detalhe,
  alerta = false,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  alerta?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-muted-foreground text-sm">{rotulo}</dt>
      <dd className="font-medium text-base tabular-nums">{valor}</dd>
      {detalhe && (
        <dd className={cn("text-muted-foreground text-sm", alerta && "text-orange-700 dark:text-orange-400")}>
          {detalhe}
        </dd>
      )}
    </div>
  );
}
