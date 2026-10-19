"use client";

import type { ReactNode } from "react";

import NumberFlow from "@number-flow/react";
import { cn } from "cn";

import { LIMITE_GE } from "@/domain/alertas-indicadores";
import type { resumoDaSerie } from "@/domain/producao";

import { FarolStatus } from "./farol-status";
import { FORMATO_TON, inteiro, pct, tonTurno } from "./formato";

type Resumo = ReturnType<typeof resumoDaSerie>;

function Indicador({
  titulo,
  valor,
  selo,
  children,
}: {
  readonly titulo: string;
  readonly valor: ReactNode;
  readonly selo?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 bg-card p-5">
      <h2 className="text-muted-foreground text-sm toque:text-base">{titulo}</h2>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="font-semibold text-3xl tabular-nums leading-none tracking-tight">{valor}</div>
        {selo}
      </div>
      <p className="text-pretty text-muted-foreground text-sm">{children}</p>
    </div>
  );
}

/**
 * Indicadores do turno no lugar da faixa de KPIs do Analytics (analytics-kpi-strip.tsx): um card só, com as células
 * separadas por linhas finas. Em linha (4 colunas) a partir de 60 rem de área útil (notebook); 2 × 2 abaixo (iPad).
 * A grade com `gap-px` sobre a cor da borda desenha as divisórias nos dois arranjos sem `divide-*` por direção.
 */
export function IndicadoresDoTurno({ resumo, caixasTurno }: { readonly resumo: Resumo; readonly caixasTurno: number }) {
  const geAbaixo = resumo.ge !== null && resumo.ge < LIMITE_GE;

  return (
    <section
      aria-label="Indicadores do turno"
      className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/5"
    >
      <div className="grid @min-[60rem]/content:grid-cols-4 grid-cols-2 gap-px bg-border/70">
        <Indicador
          titulo="Toneladas no turno"
          valor={
            <>
              <NumberFlow value={resumo.toneladas} format={FORMATO_TON} locales="pt-BR" />
              <span className="font-normal text-lg text-muted-foreground"> t</span>
            </>
          }
          selo={resumo.farol ? <FarolStatus farol={resumo.farol} /> : undefined}
        >
          {resumo.metaAcumulada > 0
            ? `Meta até aqui: ${tonTurno(resumo.metaAcumulada)}`
            : "A meta acumulada conta a partir da primeira hora fechada."}
        </Indicador>

        <Indicador
          titulo="GE acumulado"
          valor={
            resumo.ge === null ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              <NumberFlow
                value={resumo.ge}
                format={{ style: "percent", maximumFractionDigits: 0 }}
                locales="pt-BR"
                className={cn(geAbaixo && "text-red-700 dark:text-red-400")}
              />
            )
          }
        >
          Alerta abaixo de {pct(LIMITE_GE)}. Definição de GE a validar com a Mondelez.
        </Indicador>

        <Indicador
          titulo="Meta do turno"
          valor={
            <>
              <NumberFlow value={resumo.metaTurno} format={FORMATO_TON} locales="pt-BR" />
              <span className="font-normal text-lg text-muted-foreground"> t</span>
            </>
          }
        >
          {inteiro(caixasTurno)} caixas em 8 horas, pelo plano do dia.
        </Indicador>

        <Indicador
          titulo="Horas apontadas"
          valor={
            <>
              <NumberFlow value={resumo.horasApontadas} />
              <span className="font-normal text-lg text-muted-foreground"> de 8</span>
            </>
          }
        >
          {resumo.horasPendentes === 0 ? (
            "Nenhuma hora pendente."
          ) : (
            <span className="font-medium text-red-700 dark:text-red-400">
              {resumo.horasPendentes} {resumo.horasPendentes === 1 ? "hora pendente" : "horas pendentes"} de apontar.
            </span>
          )}
        </Indicador>
      </div>
    </section>
  );
}
