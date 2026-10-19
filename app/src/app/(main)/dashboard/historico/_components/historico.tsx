"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { cn } from "cn";
import { Download, FileClock, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { localRepository } from "@/data/repository";
import { paraCsv } from "@/domain/csv";
import { alcanceDoHistorico } from "@/domain/permissoes";
import { chaveTurno, turnoAtual } from "@/domain/turno";
import { formatarHora } from "@/lib/format";
import { useAgora, useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

import {
  DESCRICAO_DO_ALCANCE,
  type EventoHistorico,
  eventosDoTablet,
  NOME_DO_TIPO,
  noAlcance,
  type TipoEvento,
} from "./eventos";

type Periodo = "turno" | "hoje" | "7d" | "tudo";
const PERIODOS: Record<Periodo, string> = { turno: "Turno atual", hoje: "Hoje", "7d": "Últimos 7 dias", tudo: "Tudo" };
const TODOS = "todos";
const PASSO = 25;

const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

function nomeDo(id: string | undefined, tipo: "posto" | "equipamento" | "usuario"): string {
  if (!id) return "—";
  if (tipo === "posto") {
    const posto = localRepository.posto(id);
    const linha = posto ? localRepository.linha(posto.linhaId) : undefined;
    return posto ? `${linha?.nome ?? ""} · ${posto.nome}` : id;
  }
  if (tipo === "equipamento") return localRepository.equipamento(id)?.nome ?? id;
  return localRepository.usuario(id)?.nome ?? id;
}

/** Turno legível a partir da chave (2026-10-16T1 → 16/10 · 1º turno). */
function turnoLegivel(chave: string) {
  const [data, numero] = chave.split("T");
  const [, m, d] = (data ?? "").split("-");
  return `${d}/${m} · ${numero}º turno`;
}

/**
 * Histórico (RF-09, v0.5): tudo o que o tablet registrou, com o carimbo de rastreabilidade (RF-06), no alcance do perfil
 * (doc 05 §4), com filtros e exportação CSV. Jobs: gerente "achar qualquer registro com evidência e autor em minutos" e
 * supervisão "ver o histórico de um alerta que se repete". Template de referência: Tasks (tabela com filtros).
 */
export function Historico() {
  const usuario = useUsuarioAtual();
  const agora = useAgora();
  const linhaId = useSessionStore((s) => s.contexto?.linhaId);
  const registros = useSessionStore((s) => s.registros);
  const apontamentosHora = useSessionStore((s) => s.apontamentosHora);
  const apontamentosPerdas = useSessionStore((s) => s.apontamentosPerdas);
  const falhas = useSessionStore((s) => s.falhas);
  const trocasDeTurno = useSessionStore((s) => s.trocasDeTurno);
  const pedidosAjuda = useSessionStore((s) => s.pedidosAjuda);
  const tratamentos = useSessionStore((s) => s.tratamentos);

  const [periodo, setPeriodo] = useState<Periodo>("hoje");
  const [tipo, setTipo] = useState<TipoEvento | typeof TODOS>(TODOS);
  const [postoId, setPostoId] = useState<string>(TODOS);
  const [autorId, setAutorId] = useState<string>(TODOS);
  const [busca, setBusca] = useState("");
  const [limite, setLimite] = useState(PASSO);

  const alcance = usuario ? alcanceDoHistorico(usuario.perfil) : null;
  const doAlcance = useMemo(
    () =>
      noAlcance(
        eventosDoTablet(
          { registros, apontamentosHora, apontamentosPerdas, falhas, trocasDeTurno, pedidosAjuda, tratamentos },
          agora,
        ),
        usuario,
        linhaId,
      ),
    [
      registros,
      apontamentosHora,
      apontamentosPerdas,
      falhas,
      trocasDeTurno,
      pedidosAjuda,
      tratamentos,
      agora,
      usuario,
      linhaId,
    ],
  );

  const filtrados = useMemo(() => {
    const chaveAgora = chaveTurno(turnoAtual(agora));
    const hoje = agora.toDateString();
    const seteDias = agora.getTime() - 7 * 24 * 60 * 60 * 1000;
    const termo = busca.trim().toLowerCase();
    return doAlcance.filter((e) => {
      const quando = new Date(e.em);
      if (periodo === "turno" && e.turnoChave !== chaveAgora) return false;
      if (periodo === "hoje" && quando.toDateString() !== hoje) return false;
      if (periodo === "7d" && quando.getTime() < seteDias) return false;
      if (tipo !== TODOS && e.tipo !== tipo) return false;
      if (postoId !== TODOS && e.postoId !== postoId) return false;
      if (autorId !== TODOS && e.usuarioId !== autorId) return false;
      if (termo && !`${e.titulo} ${e.detalhe} ${nomeDo(e.usuarioId, "usuario")}`.toLowerCase().includes(termo))
        return false;
      return true;
    });
  }, [doAlcance, agora, periodo, tipo, postoId, autorId, busca]);

  const postos = linhaId ? localRepository.postos(linhaId) : [];
  const autores = [...new Set(doAlcance.map((e) => e.usuarioId))];
  const visiveis = filtrados.slice(0, limite);

  function exportar() {
    const csv = paraCsv(filtrados, [
      { titulo: "Data e hora", valor: (e: EventoHistorico) => new Date(e.em).toLocaleString("pt-BR") },
      { titulo: "Turno", valor: (e) => turnoLegivel(e.turnoChave) },
      { titulo: "Tipo", valor: (e) => NOME_DO_TIPO[e.tipo] },
      { titulo: "Registro", valor: (e) => e.titulo },
      { titulo: "Detalhe", valor: (e) => e.detalhe },
      { titulo: "Situação", valor: (e) => e.situacao },
      { titulo: "Linha e posto", valor: (e) => (e.postoId ? nomeDo(e.postoId, "posto") : "") },
      { titulo: "Equipamento", valor: (e) => (e.equipamentoId ? nomeDo(e.equipamentoId, "equipamento") : "") },
      { titulo: "Autor", valor: (e) => nomeDo(e.usuarioId, "usuario") },
      { titulo: "Versão do formulário", valor: (e) => e.versao },
      { titulo: "Id", valor: (e) => e.id },
    ]);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `historico-${chaveTurno(turnoAtual(agora))}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[2rem] leading-[1.1]">Histórico</h1>
          <p className="text-lg text-muted-foreground">
            {alcance ? DESCRICAO_DO_ALCANCE[alcance] : "Registros"} · {filtrados.length}{" "}
            {filtrados.length === 1 ? "registro" : "registros"}
          </p>
        </div>
        <Button variant="secondary" className="h-10 toque:h-14" onClick={exportar} disabled={filtrados.length === 0}>
          <Download data-icon="inline-start" />
          Exportar CSV
        </Button>
      </header>

      <Card className="gap-0 py-0">
        <div className="grid @2xl/content:grid-cols-2 @min-[60rem]/content:grid-cols-[1.4fr_repeat(4,1fr)] gap-3 border-b p-4">
          <InputGroup className="toque:h-14 bg-card">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              aria-label="Buscar no histórico"
              placeholder="Buscar registro, detalhe ou pessoa"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setLimite(PASSO);
              }}
            />
          </InputGroup>
          <Filtro
            rotulo="Período"
            valor={periodo}
            onChange={(v) => setPeriodo(v as Periodo)}
            opcoes={Object.entries(PERIODOS)}
          />
          <Filtro
            rotulo="Tipo"
            valor={tipo}
            onChange={(v) => setTipo(v as TipoEvento | typeof TODOS)}
            opcoes={[[TODOS, "Todos os tipos"], ...Object.entries(NOME_DO_TIPO)]}
          />
          <Filtro
            rotulo="Posto"
            valor={postoId}
            onChange={setPostoId}
            opcoes={[[TODOS, "Todos os postos"], ...postos.map((p) => [p.id, p.nome] as [string, string])]}
          />
          <Filtro
            rotulo="Autor"
            valor={autorId}
            onChange={setAutorId}
            opcoes={[
              [TODOS, "Todas as pessoas"],
              ...autores.map((id) => [id, nomeDo(id, "usuario")] as [string, string]),
            ]}
          />
        </div>

        {filtrados.length === 0 ? (
          <Empty className="min-h-64">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileClock />
              </EmptyMedia>
              <EmptyTitle>Nenhum registro neste filtro</EmptyTitle>
              <EmptyDescription>Amplie o período para "Últimos 7 dias" ou limpe a busca.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {/* Notebook e iPad em paisagem: tabela com o carimbo completo. */}
            <div className="@3xl/content:block hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Quando</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Posto e equipamento</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead className="pr-4 text-right">Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.map((e) => (
                    <TableRow key={`${e.tipo}:${e.id}`}>
                      <TableCell className="pl-4 align-top tabular-nums">
                        <div className="font-medium">{formatarHora(new Date(e.em))}</div>
                        <div className="text-muted-foreground text-xs toque:text-sm">
                          {dataCurta.format(new Date(e.em))} · {e.turnoChave.split("T")[1]}º turno
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md whitespace-normal align-top">
                        <div className="text-muted-foreground text-xs toque:text-sm">{NOME_DO_TIPO[e.tipo]}</div>
                        {e.href ? (
                          <Link prefetch href={e.href} className="font-medium underline-offset-4 hover:underline">
                            {e.titulo}
                          </Link>
                        ) : (
                          <div className="font-medium">{e.titulo}</div>
                        )}
                        <div className="wrap-anywhere text-muted-foreground text-sm">{e.detalhe}</div>
                      </TableCell>
                      <TableCell className="align-top text-sm">
                        <div>{e.postoId ? nomeDo(e.postoId, "posto") : "—"}</div>
                        {e.equipamentoId && (
                          <div className="text-muted-foreground">{nomeDo(e.equipamentoId, "equipamento")}</div>
                        )}
                      </TableCell>
                      <TableCell className="align-top text-sm">
                        <div>{nomeDo(e.usuarioId, "usuario")}</div>
                        {e.versao !== undefined && <div className="text-muted-foreground">Versão {e.versao}</div>}
                      </TableCell>
                      <TableCell className="pr-4 text-right align-top">
                        {e.situacao && <Situacao evento={e} />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* iPad em retrato: lista. */}
            <ul className="@3xl/content:hidden divide-y">
              {visiveis.map((e) => (
                <li key={`${e.tipo}:${e.id}`} className="flex flex-col gap-1 p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-muted-foreground text-sm">{NOME_DO_TIPO[e.tipo]}</span>
                    <span className="text-muted-foreground text-sm tabular-nums">
                      {dataCurta.format(new Date(e.em))} · {formatarHora(new Date(e.em))}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    {e.href ? (
                      <Link prefetch href={e.href} className="font-medium text-base underline-offset-4 hover:underline">
                        {e.titulo}
                      </Link>
                    ) : (
                      <span className="font-medium text-base">{e.titulo}</span>
                    )}
                    {e.situacao && <Situacao evento={e} />}
                  </div>
                  <p className="wrap-anywhere text-muted-foreground text-sm">{e.detalhe}</p>
                  <p className="text-muted-foreground text-sm">
                    {nomeDo(e.usuarioId, "usuario")}
                    {e.postoId ? ` · ${nomeDo(e.postoId, "posto")}` : ""}
                    {e.versao !== undefined ? ` · versão ${e.versao}` : ""}
                  </p>
                </li>
              ))}
            </ul>

            {filtrados.length > limite && (
              <div className="border-t p-4">
                <Button
                  variant="secondary"
                  className="h-11 toque:h-14 w-full"
                  onClick={() => setLimite((l) => l + PASSO)}
                >
                  Mostrar mais {Math.min(PASSO, filtrados.length - limite)} de {filtrados.length - limite}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function Situacao({ evento }: { evento: EventoHistorico }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "toque:text-sm",
        evento.destaque === "nc" && "bg-destructive/10 text-red-700 dark:text-red-400",
        evento.destaque === "alerta" && "bg-amber-500/12 text-amber-800 dark:text-amber-300",
      )}
    >
      {evento.situacao}
    </Badge>
  );
}

function Filtro({
  rotulo,
  valor,
  onChange,
  opcoes,
}: {
  rotulo: string;
  valor: string;
  onChange: (valor: string) => void;
  opcoes: [string, string][];
}) {
  return (
    <Select value={valor} onValueChange={onChange}>
      <SelectTrigger className="w-full bg-card" aria-label={rotulo}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {opcoes.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
