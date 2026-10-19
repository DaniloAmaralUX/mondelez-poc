"use client";

import type { ReactNode } from "react";

import { cn } from "cn";
import { TrendingDown, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { localRepository } from "@/data/repository";
import { chaveTurno, turnoAtual } from "@/domain/turno";
import type { LinhaNoRelatorio } from "@/hooks/use-producao";
import { useHistoricoDasLinhas, useRelatorioDasLinhas } from "@/hooks/use-producao";
import { formatarDuracao, formatarHora } from "@/lib/format";
import { useAgora } from "@/stores/session/session-store";

import { Variacao } from "../../relatorio-turno/_components/card-da-linha";
import {
  aderenciaAMeta,
  compararGe,
  formatarGe,
  formatarMinutos,
  formatarPercentual,
  formatarToneladas,
  geAbaixoDoLimite,
} from "../../relatorio-turno/_components/indicadores";
import { TituloGrande } from "../../relatorio-turno/_components/titulo-grande";
import { COR_DA_LINHA, colunasDeTurno, falhaQueMaisParou } from "./dados";
import { GraficoGe } from "./grafico-ge";
import { TabelaLinhasTurnos } from "./tabela-linhas-turnos";

/** Turnos anteriores mostrados no painel (mais o atual). */
const TURNOS = 6;

/**
 * Painel das linhas (RF-15), na composição da tela Finance: destaques no topo, gráfico e lista lado a lado, tabela
 * embaixo. Job da gerência: comparar linhas e turnos para priorizar recursos. Notebook (≥ 66 rem): destaques em três
 * colunas e gráfico 8/4 com o turno atual por linha; iPad em paisagem e retrato: destaques ainda em três colunas
 * e o resto em coluna (gráfico, turno atual por linha, tabela).
 */
export function PainelDasLinhas() {
  const agora = useAgora();
  const turnoChave = chaveTurno(turnoAtual(agora));
  const historico = useHistoricoDasLinhas(TURNOS);
  const relatorio = useRelatorioDasLinhas();
  const linhas = localRepository.linhas("chocolate");
  const colunas = colunasDeTurno(historico, relatorio, turnoChave);
  const comGe = relatorio.filter((r) => r.kpis?.ge !== null && r.kpis?.ge !== undefined);
  const pior = [...comGe].sort((a, b) => (a.kpis?.ge ?? 0) - (b.kpis?.ge ?? 0))[0];
  const falha = falhaQueMaisParou(historico);
  const abaixoDaMeta = relatorio.filter((r) => {
    const a = r.kpis ? aderenciaAMeta(r.kpis) : null;
    return a !== null && a < 0.9;
  });

  return (
    <div className="flex flex-col @min-[60rem]/content:gap-8 gap-6">
      <TituloGrande
        titulo="Painel das linhas"
        subtitulo={`Bis 1 a 4 nos últimos ${TURNOS} turnos e no atual, até ${formatarHora(agora)}`}
      />

      <section
        aria-label="Destaques"
        className="grid @2xl/content:grid-cols-3 grid-cols-1 overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10"
      >
        <Destaque
          rotulo="Pior GE agora"
          icone={<TrendingDown className="size-4" />}
          valor={pior?.kpis ? `${pior.linha.nome} · ${formatarGe(pior.kpis.ge)}` : "—"}
          detalhe={pior ? <DetalheDoPior item={pior} /> : "Sem apontamentos ainda."}
          alerta={geAbaixoDoLimite(pior?.kpis?.ge ?? null)}
        />
        <Destaque
          rotulo="Falha que mais parou"
          icone={<Wrench className="size-4" />}
          valor={falha?.nome ?? "—"}
          detalhe={
            falha
              ? `${formatarDuracao(falha.minutos * 60_000)} em ${falha.quantidade} paradas, ${falha.linhas} linhas, nos últimos ${TURNOS} turnos.`
              : "Nenhuma falha no período."
          }
        />
        <Destaque
          rotulo="Abaixo da meta agora"
          valor={`${abaixoDaMeta.length} de ${relatorio.length} linhas`}
          detalhe={
            abaixoDaMeta.length > 0
              ? `${abaixoDaMeta.map((r) => r.linha.nome).join(", ")} abaixo de 90 % das toneladas previstas até agora.`
              : "Todas acima de 90 % das toneladas previstas até agora."
          }
        />
      </section>

      <div className="grid @min-[66rem]/content:grid-cols-12 items-start gap-6">
        <div className="@min-[66rem]/content:col-span-8 min-w-0">
          <GraficoGe linhas={linhas} colunas={colunas} />
        </div>
        <div className="@min-[66rem]/content:col-span-4 min-w-0">
          <TurnoAtualPorLinha relatorio={relatorio} />
        </div>
      </div>

      <TabelaLinhasTurnos linhas={linhas} colunas={colunas} />
    </div>
  );
}

function DetalheDoPior({ item }: { item: LinhaNoRelatorio }) {
  return (
    <span className="flex flex-wrap items-center gap-x-2">
      <Variacao comparacao={compararGe(item.kpis?.ge ?? null, item.anterior.ge)} />
      <span>vs turno anterior · {item.simulado ? "simulado" : "registrado no tablet"}</span>
    </span>
  );
}

function Destaque({
  rotulo,
  valor,
  detalhe,
  icone,
  alerta = false,
}: {
  rotulo: string;
  valor: string;
  detalhe: ReactNode;
  icone?: ReactNode;
  alerta?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border-foreground/10 @2xl/content:border-r border-b @2xl/content:border-b-0 p-4 @2xl/content:last:border-r-0 last:border-b-0">
      <p className="flex items-center gap-2 text-muted-foreground text-sm">
        {icone && <span aria-hidden>{icone}</span>}
        {rotulo}
      </p>
      <p
        className={cn(
          "text-balance font-semibold text-2xl tabular-nums leading-tight tracking-tight",
          alerta && "text-red-700 dark:text-red-400",
        )}
      >
        {valor}
      </p>
      <div className="text-pretty text-muted-foreground text-sm">{detalhe}</div>
    </div>
  );
}

/** Turno atual por linha: toneladas sobre a meta até agora (barra), MTBF e alertas, em linhas de recurso. */
function TurnoAtualPorLinha({ relatorio }: { relatorio: readonly LinhaNoRelatorio[] }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Turno atual por linha</CardTitle>
        <CardDescription>Toneladas sobre a meta até agora, MTBF e alertas.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {relatorio.map((r) => {
          const k = r.kpis;
          const aderencia = k ? aderenciaAMeta(k) : null;
          return (
            <div key={r.linha.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-medium">
                  <span aria-hidden className={`size-2 rounded-full ${COR_DA_LINHA[r.linha.id]?.amostra ?? ""}`} />
                  {r.linha.nome}
                  {r.simulado && (
                    <Badge variant="outline" className="toque:text-sm">
                      Simulado
                    </Badge>
                  )}
                </span>
                <span className="text-sm tabular-nums">
                  {k ? formatarToneladas(k.toneladas) : "—"}
                  <span className="text-muted-foreground"> de {k ? formatarToneladas(k.metaToneladas) : "—"}</span>
                </span>
              </div>
              {aderencia !== null && (
                <Progress
                  value={Math.min(100, aderencia * 100)}
                  aria-label={`${r.linha.nome}: ${formatarPercentual(aderencia)} da meta até agora`}
                  className="h-1.5 bg-secondary"
                />
              )}
              <p className="flex flex-wrap justify-between gap-x-3 text-muted-foreground text-sm tabular-nums">
                <span>{aderencia !== null ? `${formatarPercentual(aderencia)} da meta` : "Sem meta"}</span>
                <span>
                  MTBF {formatarMinutos(k?.mtbfMin ?? null)} · {k ? k.alertasAbertos + k.alertasTratados : 0} alertas
                </span>
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
