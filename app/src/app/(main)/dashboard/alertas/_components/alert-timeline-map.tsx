"use client";

import { turnoAtual } from "@/domain/turno";
import type { Alerta } from "@/domain/types";
import { formatarHora } from "@/lib/format";
import { useAgora } from "@/stores/session/session-store";

import { fimDoAlerta } from "./idade";

// Mesmo quadro do mapa de rota da tela Logistics: aqui o "território" é o turno e a rota é a vida do alerta.
const WIDTH = 1000;
const HEIGHT = 520;
const MARGIN = 80;
const TRACK_TOP = 200;
const TRACK_HEIGHT = 120;
const ROUTE_Y = TRACK_TOP + TRACK_HEIGHT / 2;

const ROTULO_ACAO = {
  envio: "Enviado",
  assumir: "Assumido",
  acao: "Ação",
  resolver: "Resolvido",
  automatica: "Encerrado",
} as const;

type Ponto = { label: string; hora: Date };

export function AlertTimelineMap({ alerta }: { alerta: Alerta | null }) {
  const agora = useAgora();
  const turno = turnoAtual(alerta?.criadoEm ?? agora);
  const inicio = turno.inicio.getTime();
  const duracao = turno.fim.getTime() - inicio;
  const x = (d: Date) => MARGIN + Math.min(1, Math.max(0, (d.getTime() - inicio) / duracao)) * (WIDTH - MARGIN * 2);
  const horas = Array.from({ length: 9 }, (_, i) => new Date(inicio + i * 60 * 60 * 1000));

  const pontos: Ponto[] = alerta
    ? [
        { label: "Alerta", hora: alerta.criadoEm },
        ...alerta.acoes
          .filter((acao) => acao.tipo !== "envio")
          .map((acao) => ({ label: ROTULO_ACAO[acao.tipo], hora: new Date(acao.em) })),
        ...(alerta.estado === "resolvido" ? [] : [{ label: "Agora", hora: agora }]),
      ]
    : [];

  const x1 = alerta ? x(alerta.criadoEm) : 0;
  const x2 = alerta ? x(fimDoAlerta(alerta, agora)) : 0;
  const arco = Math.max(40, Math.min(160, (x2 - x1) * 0.35));
  const routePath = alerta ? `M ${x1} ${ROUTE_Y} Q ${(x1 + x2) / 2} ${ROUTE_Y - arco} ${x2} ${ROUTE_Y}` : null;

  return (
    <div className="size-full min-h-0 overflow-hidden bg-[#d4dadc] dark:bg-[#2C353C]">
      <svg
        aria-label={alerta ? `Linha do tempo do alerta no ${turno.numero}º turno` : "Linha do tempo do turno"}
        className="block size-full bg-[#d4dadc] dark:bg-[#2C353C]"
        role="img"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <rect height={HEIGHT} width={WIDTH} className="fill-[#d4dadc] dark:fill-[#2C353C]" />
        <rect
          x={MARGIN - 24}
          y={TRACK_TOP}
          width={WIDTH - MARGIN * 2 + 48}
          height={TRACK_HEIGHT}
          rx={18}
          className="fill-[#fafaf8] dark:fill-[#0e0e0e]"
          stroke="#f0dddd"
          strokeWidth={0.8}
        />
        {horas.map((hora) => (
          <g key={hora.getTime()}>
            <line
              x1={x(hora)}
              x2={x(hora)}
              y1={TRACK_TOP}
              y2={TRACK_TOP + TRACK_HEIGHT}
              className="stroke-[#ebd6d8] dark:stroke-[#2C353C]"
            />
            <text
              x={x(hora)}
              y={TRACK_TOP + TRACK_HEIGHT + 28}
              className="fill-foreground text-[14px] tabular-nums"
              textAnchor="middle"
            >
              {formatarHora(hora)}
            </text>
          </g>
        ))}
        <text x={MARGIN - 24} y={TRACK_TOP - 18} className="fill-foreground font-medium text-[14px]">
          {turno.numero}º turno
        </text>
        {alerta && (
          <rect
            x={x1}
            y={TRACK_TOP + 1}
            width={Math.max(2, x2 - x1)}
            height={TRACK_HEIGHT - 2}
            className="fill-primary/10"
          />
        )}
        {routePath && (
          <path
            d={routePath}
            className="fill-none stroke-primary"
            strokeDasharray="8 8"
            strokeLinecap="round"
            strokeWidth={3}
          />
        )}
        {pontos.map(({ label, hora }, index) => (
          <g key={`${label}-${hora.getTime()}`} transform={`translate(${x(hora)}, ${ROUTE_Y})`}>
            <circle className="fill-background stroke-primary" r={8} strokeWidth={3} />
            <circle className="fill-primary" r={3} />
            <text
              className="fill-foreground font-medium text-[12px]"
              dy={index % 2 === 0 ? -16 - 16 * Math.floor(index / 2) : 30 + 16 * Math.floor(index / 2)}
              textAnchor="middle"
            >
              {label} {formatarHora(hora)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
