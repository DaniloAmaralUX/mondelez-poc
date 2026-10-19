"use client";

import * as React from "react";

import { cn } from "cn";
import { ChevronLeft, ChevronRight, PencilLine, UserRoundX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { localRepository } from "@/data/repository";
import { type DiaDeEscala, diasDoMes, escalaDoDia } from "@/domain/escala";
import { dataLocal, semanaDe } from "@/domain/producao";
import { turnoAtual } from "@/domain/turno";
import type { AjusteEscala, Usuario } from "@/domain/types";
import { primeiroNome } from "@/lib/format";

import type { AlvoDoAjuste } from "./ajustar-escala";
import { deChave, rotuloDoDia } from "./recados";
import {
  DIAS_DE_ESCALA,
  faixaDoTurno,
  horarioDoTurno,
  nomeCurto,
  nomeDoDia,
  pessoasDoPosto,
  TINTA_DA_ESCALA,
} from "./turnos";

const MES = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const DIA_CURTO = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const DIA_MES = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
const SEMANA = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

function diaCurto(data: string) {
  return DIA_CURTO.format(deChave(data)).replace(".", "");
}

function diasDaSemana(agora: Date): string[] {
  const inicio = deChave(semanaDe(agora));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(d.getDate() + i);
    return dataLocal(d);
  });
}

/**
 * Escala (RM-06). Quem trabalha por turma vê primeiro a própria escala do mês; a liderança administrativa (sem turma)
 * vê primeiro a escala do posto, e uma linha dizendo por que não tem escala própria.
 */
export function Escala({
  usuario,
  agora,
  ajustes,
  postoId,
  podeAjustar,
  onAjustar,
}: {
  readonly usuario?: Usuario;
  readonly agora: Date;
  readonly ajustes: Readonly<Record<string, AjusteEscala>>;
  readonly postoId?: string;
  readonly podeAjustar: boolean;
  readonly onAjustar: (alvo: AlvoDoAjuste) => void;
}) {
  const temEscala = Boolean(usuario?.turma) || Object.values(ajustes).some((a) => a.usuarioId === usuario?.id);
  const minha = usuario && temEscala ? <MinhaEscala usuario={usuario} agora={agora} ajustes={ajustes} /> : null;
  const posto = (
    <EscalaDoPosto agora={agora} ajustes={ajustes} postoId={postoId} podeAjustar={podeAjustar} onAjustar={onAjustar} />
  );
  return (
    <div className="flex flex-col gap-6">
      {minha}
      {posto}
      {!minha && (
        <p className="text-muted-foreground text-sm toque:text-base">
          Sua jornada é administrativa, sem turma: a escala por turno vale para a operação e a supervisão.
        </p>
      )}
    </div>
  );
}

function Legenda() {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Legenda">
      {DIAS_DE_ESCALA.map((d) => (
        <li
          key={String(d)}
          className={cn("rounded-md px-2 py-1 font-medium text-sm tabular-nums", TINTA_DA_ESCALA[String(d)])}
        >
          {nomeDoDia(d)}
          {d !== "folga" && ` · ${faixaDoTurno(d)}`}
        </li>
      ))}
      <li className="flex items-center gap-1.5 rounded-md px-2 py-1 text-muted-foreground text-sm ring-1 ring-foreground/25">
        <PencilLine className="size-3.5" aria-hidden />
        Ajustado
      </li>
    </ul>
  );
}

/** "Minha escala": o mês da pessoa logada, um dia por célula, com o turno escrito e a tinta do turno. */
function MinhaEscala({
  usuario,
  agora,
  ajustes,
}: {
  readonly usuario: Usuario;
  readonly agora: Date;
  readonly ajustes: Readonly<Record<string, AjusteEscala>>;
}) {
  const [mes, setMes] = React.useState({ ano: agora.getFullYear(), mes0: agora.getMonth() });
  const hoje = dataLocal(agora);
  const dias = diasDoMes(mes.ano, mes.mes0);
  const vazios = (deChave(dias[0] ?? hoje).getDay() + 6) % 7;
  const deHoje = escalaDoDia(usuario, hoje, ajustes);
  const proximaFolga = (() => {
    for (let i = 1; i <= 31; i++) {
      const d = new Date(deChave(hoje));
      d.setDate(d.getDate() + i);
      if (escalaDoDia(usuario, dataLocal(d), ajustes)?.dia === "folga") return dataLocal(d);
    }
    return undefined;
  })();
  const prefixo = `${mes.ano}-${String(mes.mes0 + 1).padStart(2, "0")}`;
  const ajustesDoMes = Object.values(ajustes)
    .filter((a) => a.usuarioId === usuario.id && a.data.startsWith(prefixo))
    .sort((a, b) => a.data.localeCompare(b.data));

  function mudarMes(delta: number) {
    setMes((m) => {
      const d = new Date(m.ano, m.mes0 + delta, 1);
      return { ano: d.getFullYear(), mes0: d.getMonth() };
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Minha escala</CardTitle>
        <CardDescription className="toque:text-base">
          {usuario.nome}
          {usuario.turma && ` · turma ${usuario.turma}`}
        </CardDescription>
        <CardAction>
          <ButtonGroup>
            <Button size="icon" variant="outline" aria-label="Mês anterior" onClick={() => mudarMes(-1)}>
              <ChevronLeft />
            </Button>
            <Button size="icon" variant="outline" aria-label="Próximo mês" onClick={() => mudarMes(1)}>
              <ChevronRight />
            </Button>
          </ButtonGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="grid @min-[60rem]/content:grid-cols-12 gap-6">
        <div className="@min-[60rem]/content:col-span-8 flex min-w-0 flex-col gap-3">
          <h3 className="font-semibold text-base first-letter:uppercase" aria-live="polite">
            {MES.format(new Date(mes.ano, mes.mes0, 1))}
          </h3>
          <div className="grid grid-cols-7 gap-1.5" aria-hidden>
            {SEMANA.map((s) => (
              <span key={s} className="text-center font-medium text-muted-foreground text-sm">
                {s}
              </span>
            ))}
          </div>
          <ol className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: vazios }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: casas vazias antes do dia 1
              <li key={`vazio-${i}`} aria-hidden />
            ))}
            {dias.map((data) => {
              const e = escalaDoDia(usuario, data, ajustes);
              const ehHoje = data === hoje;
              return (
                <li
                  key={data}
                  className={cn(
                    "flex min-h-16 flex-col justify-between gap-1 rounded-lg p-1.5 tabular-nums",
                    e ? TINTA_DA_ESCALA[String(e.dia)] : "bg-muted/40 text-muted-foreground",
                    e?.ajustado && "ring-2 ring-foreground/30 ring-inset",
                    ehHoje && "outline-2 outline-foreground outline-offset-1",
                  )}
                >
                  <span className="flex items-center justify-between text-sm">
                    <span className={cn("font-semibold", ehHoje && "underline underline-offset-2")}>
                      {deChave(data).getDate()}
                    </span>
                    {e?.ajustado && <PencilLine className="size-3.5" aria-hidden />}
                  </span>
                  <span className="font-medium text-sm leading-tight">
                    <span className="sr-only">{rotuloDoDia(data, hoje)}: </span>
                    {e ? nomeCurto(e.dia) : "–"}
                    {e && e.dia !== "folga" && (
                      <span className="block font-normal @md/content:inline">
                        <span className="@md/content:inline hidden"> </span>
                        {faixaDoTurno(e.dia)}
                      </span>
                    )}
                    {e?.ajustado && <span className="sr-only">, ajustado</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="@min-[60rem]/content:col-span-4 flex flex-col gap-4">
          <dl className="grid grid-cols-2 @min-[60rem]/content:grid-cols-1 gap-3">
            <div className="flex flex-col gap-1 rounded-xl bg-muted/50 p-4">
              <dt className="text-muted-foreground text-sm toque:text-base">Hoje</dt>
              <dd className="font-semibold text-xl">
                {deHoje ? nomeDoDia(deHoje.dia) : "Sem escala"}
                {deHoje && deHoje.dia !== "folga" && (
                  <span className="block font-normal text-base text-muted-foreground tabular-nums">
                    {horarioDoTurno(deHoje.dia)}
                  </span>
                )}
              </dd>
            </div>
            <div className="flex flex-col gap-1 rounded-xl bg-muted/50 p-4">
              <dt className="text-muted-foreground text-sm toque:text-base">Próxima folga</dt>
              <dd className="font-semibold text-xl first-letter:uppercase">
                {proximaFolga ? rotuloDoDia(proximaFolga, hoje).split(",")[0] : "Nos próximos 31 dias, nenhuma"}
                {proximaFolga && (
                  <span className="block font-normal text-base text-muted-foreground tabular-nums">
                    {DIA_MES.format(deChave(proximaFolga))}
                  </span>
                )}
              </dd>
            </div>
          </dl>
          {ajustesDoMes.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold text-sm toque:text-base">Ajustes neste mês</h3>
              <ul className="flex flex-col gap-1.5 text-sm toque:text-base">
                {ajustesDoMes.map((a) => (
                  <li key={a.id} className="flex items-start gap-2">
                    <PencilLine className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span>
                      <span className="font-medium tabular-nums">{DIA_MES.format(deChave(a.data))}</span>:{" "}
                      {nomeDoDia(a.turno)}
                      {a.motivo && <span className="text-muted-foreground"> · {a.motivo}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Legenda />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * "Escala do posto": quem trabalha em cada turno, hoje e na semana, pelas turmas e pelos ajustes. Tabela turnos × dias
 * a partir de 50 rem de card (notebook e iPad deitado); no retrato, os sete dias viram uma escolha e o dia escolhido
 * mostra os turnos em lista. Para a Assistência, cada nome é um botão que abre o ajuste daquele dia.
 */
function EscalaDoPosto({
  agora,
  ajustes,
  postoId,
  podeAjustar,
  onAjustar,
}: {
  readonly agora: Date;
  readonly ajustes: Readonly<Record<string, AjusteEscala>>;
  readonly postoId?: string;
  readonly podeAjustar: boolean;
  readonly onAjustar: (alvo: AlvoDoAjuste) => void;
}) {
  const hoje = dataLocal(agora);
  const dias = diasDaSemana(agora);
  const [diaEscolhido, setDiaEscolhido] = React.useState(hoje);
  const pessoas = pessoasDoPosto(postoId);
  const posto = postoId ? localRepository.posto(postoId) : undefined;
  const linha = posto ? localRepository.linha(posto.linhaId) : undefined;
  const turno = turnoAtual(agora);

  const quem = (data: string, dia: DiaDeEscala) =>
    pessoas.map((p) => ({ pessoa: p, escala: escalaDoDia(p, data, ajustes) })).filter((x) => x.escala?.dia === dia);
  const agoraNoTurno = quem(dataLocal(turno.data), turno.numero);

  const chip = (data: string, x: { pessoa: Usuario; escala: { ajustado: boolean } | null }) => (
    <ChipDaPessoa
      key={x.pessoa.id}
      pessoa={x.pessoa}
      ajustado={Boolean(x.escala?.ajustado)}
      rotulo={`Ajustar ${x.pessoa.nome} em ${rotuloDoDia(data, hoje).toLowerCase()}`}
      onClick={podeAjustar ? () => onAjustar({ usuarioId: x.pessoa.id, data }) : undefined}
    />
  );

  if (pessoas.length === 0) {
    return (
      <Card>
        <Empty className="min-h-48">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserRoundX />
            </EmptyMedia>
            <EmptyTitle>Ninguém na escala deste posto</EmptyTitle>
            <EmptyDescription>Cadastre as pessoas do posto em Usuários, com a turma.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    );
  }

  return (
    <Card className="@container/escala">
      <CardHeader>
        <CardTitle className="text-lg">
          Escala do posto{linha && posto ? ` · ${linha.nome} · ${posto.nome}` : ""}
        </CardTitle>
        <CardDescription className="toque:text-base">
          Agora, no {turno.numero}º turno:{" "}
          {agoraNoTurno.length ? agoraNoTurno.map((x) => x.pessoa.nome).join(", ") : "ninguém escalado"}.
          {podeAjustar && " Toque num nome para ajustar o dia."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="@min-[50rem]/escala:block hidden">
          <table className="w-full table-fixed border-separate border-spacing-1.5 text-sm">
            <thead>
              <tr>
                <th className="w-24 text-left font-medium text-muted-foreground" scope="col">
                  <span className="sr-only">Turno</span>
                </th>
                {dias.map((d) => (
                  <th
                    key={d}
                    scope="col"
                    className={cn(
                      "rounded-lg py-1.5 text-center font-medium text-muted-foreground",
                      d === hoje && "bg-muted font-semibold text-foreground",
                    )}
                  >
                    <span className="block">{d === hoje ? "Hoje" : diaCurto(d)}</span>
                    <span className="block font-normal text-muted-foreground tabular-nums">
                      {DIA_MES.format(deChave(d))}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DIAS_DE_ESCALA.map((dia) => (
                <tr key={String(dia)}>
                  <th scope="row" className="text-left align-top">
                    <span
                      className={cn(
                        "inline-flex flex-col rounded-md px-2 py-1 font-medium",
                        TINTA_DA_ESCALA[String(dia)],
                      )}
                    >
                      {nomeDoDia(dia)}
                      {dia !== "folga" && <span className="font-normal tabular-nums">{faixaDoTurno(dia)}</span>}
                    </span>
                  </th>
                  {dias.map((d) => {
                    return (
                      <td key={d} className={cn("rounded-lg p-1.5 align-top", d === hoje ? "bg-muted" : "bg-muted/40")}>
                        <div className="flex flex-col items-start gap-1.5">{quem(d, dia).map((x) => chip(d, x))}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="@min-[50rem]/escala:hidden flex flex-col gap-4">
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={diaEscolhido}
            onValueChange={(v) => v && setDiaEscolhido(v)}
            aria-label="Dia da semana"
            className="grid w-full grid-cols-7"
          >
            {dias.map((d) => (
              <ToggleGroupItem
                key={d}
                value={d}
                className="h-auto toque:h-auto min-h-12 toque:min-h-16 flex-col gap-0 px-0"
              >
                <span className={cn("text-sm", d === hoje && "font-semibold")}>
                  {d === hoje ? "Hoje" : diaCurto(d)}
                </span>
                <span className="text-muted-foreground text-sm tabular-nums">{deChave(d).getDate()}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ul className="flex flex-col divide-y divide-border/60" aria-live="polite">
            {DIAS_DE_ESCALA.map((dia) => {
              const lista = quem(diaEscolhido, dia);
              return (
                <li key={String(dia)} className="flex items-start gap-3 py-3">
                  <span
                    className={cn(
                      "flex w-24 shrink-0 flex-col rounded-md px-2 py-1 font-medium text-sm",
                      TINTA_DA_ESCALA[String(dia)],
                    )}
                  >
                    {nomeDoDia(dia)}
                    {dia !== "folga" && <span className="font-normal tabular-nums">{faixaDoTurno(dia)}</span>}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                    {lista.length === 0 ? (
                      <span className="py-1 text-muted-foreground text-sm">Ninguém</span>
                    ) : (
                      lista.map((x) => chip(diaEscolhido, x))
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <Legenda />
      </CardContent>
    </Card>
  );
}

/** Nome na escala do posto: texto para quem consulta, botão de ajuste para a Assistência (56 px no toque). */
function ChipDaPessoa({
  pessoa,
  ajustado,
  rotulo,
  onClick,
}: {
  readonly pessoa: Usuario;
  readonly ajustado: boolean;
  readonly rotulo: string;
  readonly onClick?: () => void;
}) {
  const conteudo = (
    <>
      <span>{primeiroNome(pessoa.nome)}</span>
      <span className="text-muted-foreground">{pessoa.perfil === "supervisao" ? "sup." : pessoa.turma}</span>
      {ajustado && <PencilLine className="size-3.5 shrink-0" aria-label="ajustado" />}
    </>
  );
  const base = cn(
    "inline-flex max-w-full flex-wrap items-center gap-x-1.5 rounded-md bg-background px-2 py-1 text-left text-sm ring-1 ring-foreground/10",
    ajustado && "ring-foreground/35",
  );
  if (!onClick) return <span className={base}>{conteudo}</span>;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      className={cn(
        base,
        "toque:h-11 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted",
      )}
    >
      {conteudo}
    </button>
  );
}
