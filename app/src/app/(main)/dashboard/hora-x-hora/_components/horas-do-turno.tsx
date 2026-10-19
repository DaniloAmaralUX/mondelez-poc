"use client";

import Link from "next/link";

import { cn } from "cn";
import { Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { localRepository } from "@/data/repository";
import { farol, type HoraDoTurno } from "@/domain/producao";
import { formatarHora, primeiroNome } from "@/lib/format";
import { STATUS_LEGIVEL } from "@/lib/status-legivel";

import { FarolStatus } from "./farol-status";
import { inteiro, pct, tonHora } from "./formato";

export interface LinhaDaHora {
  hora: HoraDoTurno;
  falhas: number;
}

interface Props {
  readonly linhas: LinhaDaHora[];
  readonly podeEscrever: boolean;
  /** Hora no card de apontar agora (destacada na lista). */
  readonly selecionada: string | undefined;
  readonly onEscolher: (hora: HoraDoTurno) => void;
}

const HORA_MS = 60 * 60 * 1000;

function intervalo(h: HoraDoTurno) {
  const inicio = new Date(h.bloco);
  return `${formatarHora(inicio)}–${formatarHora(new Date(inicio.getTime() + HORA_MS))}`;
}

function quemApontou(h: HoraDoTurno) {
  if (!h.apontamento) return undefined;
  const u = localRepository.usuario(h.apontamento.usuarioId);
  return `${u ? primeiroNome(u.nome) : "—"} às ${formatarHora(new Date(h.apontamento.em))}`;
}

/** Situação da hora: o farol quando apontada; senão pendente (vermelho), aberta (azul) ou mais tarde. */
function SituacaoDaHora({ h }: { readonly h: HoraDoTurno }) {
  if (h.estado === "apontada" && h.toneladas !== null)
    return <FarolStatus farol={farol(h.toneladas, h.metaToneladas)} />;
  const mapa = {
    pendente: { rotulo: "Pendente", variante: "error" as const },
    aberta: { rotulo: "Aberta", variante: "info" as const },
    futura: { rotulo: "Mais tarde", variante: "default" as const },
    apontada: { rotulo: "Apontada", variante: "default" as const },
  }[h.estado];
  return (
    <Status variant={mapa.variante} className={cn("toque:text-sm", STATUS_LEGIVEL)}>
      <StatusIndicator className={h.estado === "pendente" ? undefined : "before:hidden"} />
      <StatusLabel>{mapa.rotulo}</StatusLabel>
    </Status>
  );
}

function rotuloDaAcao(h: HoraDoTurno) {
  if (h.estado === "apontada") return "Corrigir";
  if (h.estado === "pendente" || h.estado === "aberta") return "Apontar";
  return undefined;
}

function LinkDasFalhas({ n, className }: { readonly n: number; readonly className?: string }) {
  if (n === 0) return <span className="text-muted-foreground tabular-nums">0</span>;
  return (
    <Button asChild variant="outline" size="sm" className={cn("tabular-nums", className)}>
      <Link prefetch href="/dashboard/mtbf" aria-label={`${n === 1 ? "1 falha" : `${n} falhas`} na hora: abrir o MTBF`}>
        <Wrench data-icon="inline-start" />
        {n === 1 ? "1 falha" : `${n} falhas`}
      </Link>
    </Button>
  );
}

/**
 * As oito horas do turno (RM-10), na tabela do template no notebook e como lista tocável no iPad: as duas estão no
 * HTML e a largura útil escolhe (container query, docs/12 §3.4), como em Tarefas do posto. Horas pendentes com fundo
 * vermelho claro e selo pulsando; a hora que está no card de apontar fica marcada.
 */
export function HorasDoTurno({ linhas, podeEscrever, selecionada, onEscolher }: Props) {
  const pendentes = linhas.filter((l) => l.hora.estado === "pendente").length;

  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="pb-4">
        <CardTitle>Horas do turno</CardTitle>
        <CardDescription>
          {pendentes === 0
            ? "Caixas, toneladas, GE e falhas de cada hora."
            : `${pendentes === 1 ? "1 hora pendente" : `${pendentes} horas pendentes`}: aponte a mais antiga primeiro.`}
        </CardDescription>
        <CardAction>
          <Button asChild variant="outline" size="sm" className="toque:h-12 toque:text-sm">
            <Link prefetch href="/dashboard/mtbf">
              Abrir MTBF
            </Link>
          </Button>
        </CardAction>
      </CardHeader>

      {/* iPad (retrato e paisagem): lista. */}
      <ul aria-label="Horas do turno" className="@min-[60rem]/content:hidden divide-y divide-border/60 border-t">
        {linhas.map(({ hora: h, falhas }) => {
          const acao = podeEscrever ? rotuloDaAcao(h) : undefined;
          const quem = quemApontou(h);
          return (
            <li
              key={h.bloco}
              aria-current={selecionada === h.bloco ? "true" : undefined}
              className={cn(
                "flex flex-col gap-3 px-4 py-4",
                h.estado === "pendente" && "bg-red-500/5",
                h.estado === "futura" && "text-muted-foreground",
                selecionada === h.bloco && "bg-primary/5",
              )}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 shrink-0 font-semibold text-xl tabular-nums leading-tight">{h.rotulo}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-base tabular-nums">
                    {h.caixas === null
                      ? intervalo(h)
                      : `${inteiro(h.caixas)} caixas · ${tonHora(h.toneladas ?? 0)} · GE ${pct(h.ge ?? 0)}`}
                  </p>
                  <p className="wrap-anywhere text-muted-foreground text-sm">
                    {quem ?? `Meta ${tonHora(h.metaToneladas)}`}
                    {h.apontamento?.motivo && ` · ${h.apontamento.motivo}`}
                  </p>
                </div>
                <SituacaoDaHora h={h} />
              </div>
              {(acao ?? falhas > 0) && (
                <div className="flex flex-wrap items-center gap-3 pl-20">
                  {acao && (
                    <Button variant="outline" className="h-10 toque:h-14 px-4" onClick={() => onEscolher(h)}>
                      {acao} {h.rotulo}
                    </Button>
                  )}
                  <LinkDasFalhas n={falhas} className="h-10 toque:h-14" />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Notebook: tabela. */}
      <div className="@min-[60rem]/content:block hidden border-t">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Hora</TableHead>
              <TableHead className="text-right">Caixas</TableHead>
              <TableHead className="text-right">Toneladas</TableHead>
              <TableHead className="text-right">GE</TableHead>
              <TableHead>Farol</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Quem apontou</TableHead>
              <TableHead>Falhas</TableHead>
              <TableHead className="pr-6">
                <span className="sr-only">Ação</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map(({ hora: h, falhas }) => {
              const acao = podeEscrever ? rotuloDaAcao(h) : undefined;
              return (
                <TableRow
                  key={h.bloco}
                  aria-current={selecionada === h.bloco ? "true" : undefined}
                  className={cn(
                    "tabular-nums",
                    h.estado === "pendente" && "bg-red-500/5 hover:bg-red-500/10",
                    h.estado === "futura" && "text-muted-foreground",
                    selecionada === h.bloco && "bg-primary/5 hover:bg-primary/5",
                  )}
                >
                  <TableCell className="pl-6 font-medium">{intervalo(h)}</TableCell>
                  <TableCell className="text-right">{h.caixas === null ? "—" : inteiro(h.caixas)}</TableCell>
                  <TableCell className="text-right">{h.toneladas === null ? "—" : tonHora(h.toneladas)}</TableCell>
                  <TableCell className="text-right">{h.ge === null ? "—" : pct(h.ge)}</TableCell>
                  <TableCell>
                    <SituacaoDaHora h={h} />
                  </TableCell>
                  <TableCell className="max-w-56 truncate" title={h.apontamento?.motivo}>
                    {h.apontamento?.motivo ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>{quemApontou(h) ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    <LinkDasFalhas n={falhas} />
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    {acao && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEscolher(h)}
                        aria-label={`${acao} a hora das ${h.rotulo}`}
                      >
                        {acao}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
