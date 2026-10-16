"use client";

import { type ReactNode, useMemo } from "react";

import Link from "next/link";

import { cn } from "cn";
import { ChevronDown, CircleCheck, MapPin } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ItemGroup } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { localRepository } from "@/data/repository";
import { concluida, gerarTarefas, proximaTarefa } from "@/domain/routine-engine";
import { turnoAtual } from "@/domain/turno";
import type { TarefaInstancia } from "@/domain/types";
import { formatarDia, formatarHora, primeiroNome } from "@/lib/format";
import { toque } from "@/lib/touch";
import { useAgora, useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

import { ProximaTarefa } from "./proxima-tarefa";
import { TarefaItem } from "./tarefa-item";

function saudacao(agora: Date) {
  const h = agora.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function MinhaRotina() {
  const usuario = useUsuarioAtual();
  const contexto = useSessionStore((s) => s.contexto);
  const conclusoes = useSessionStore((s) => s.conclusoes);
  const agora = useAgora();
  const turno = turnoAtual(agora);

  const tarefas = useMemo(
    () =>
      usuario && contexto
        ? gerarTarefas({
            templates: localRepository.templates(),
            postoId: contexto.postoId,
            perfil: usuario.perfil,
            turno: turnoAtual(agora),
            agora,
            conclusoes,
          })
        : [],
    [usuario, contexto, agora, conclusoes],
  );

  if (!usuario || !contexto) return null;

  const proxima = proximaTarefa(tarefas);
  const resto = tarefas.filter((t) => t !== proxima);
  const atrasadas = resto.filter((t) => t.estado === "atrasada");
  const agoraAbertas = resto.filter((t) => !concluida(t) && !t.futura && t.estado !== "atrasada");
  const maisTarde = resto.filter((t) => t.futura);
  const feitas = resto.filter(concluida);
  const totalFeitas = tarefas.filter(concluida).length;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-strong text-2xl">
            {saudacao(agora)}, {primeiroNome(usuario.nome)}
          </h1>
          <p className="text-muted-foreground">
            Minha rotina · {turno.numero}º turno, das {formatarHora(turno.inicio)} às {formatarHora(turno.fim)} ·{" "}
            {formatarDia(turno.data)}
          </p>
        </div>
        {tarefas.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-base">
              <span className="font-strong tabular-nums">
                {totalFeitas} de {tarefas.length}
              </span>{" "}
              tarefas do turno feitas
            </p>
            <Progress value={(totalFeitas / tarefas.length) * 100} aria-label="Progresso do turno" className="h-2" />
          </div>
        )}
      </header>

      {tarefas.length === 0 ? (
        <SemRotinas />
      ) : (
        <>
          {proxima ? (
            <ProximaTarefa tarefa={proxima} agora={agora} />
          ) : (
            <Alert>
              <CircleCheck aria-hidden />
              <AlertTitle className="text-base">Tudo em dia por agora</AlertTitle>
              <AlertDescription className="text-base">
                {maisTarde[0]
                  ? `A próxima tarefa abre às ${formatarHora(maisTarde[0].abre)}.`
                  : "Não há mais tarefas neste turno."}
              </AlertDescription>
            </Alert>
          )}

          <Secao titulo="Atrasadas" tarefas={atrasadas} agora={agora} />
          <Secao titulo="Para agora" tarefas={agoraAbertas} agora={agora} />
          <Secao titulo="Mais tarde no turno" tarefas={maisTarde} agora={agora} recolhida />
          <Secao titulo="Feitas" tarefas={feitas} agora={agora} recolhida />
        </>
      )}
    </div>
  );
}

function Secao({
  titulo,
  tarefas,
  agora,
  recolhida = false,
}: {
  titulo: string;
  tarefas: TarefaInstancia[];
  agora: Date;
  recolhida?: boolean;
}) {
  if (tarefas.length === 0) return null;

  const lista = (
    <ItemGroup className="gap-2">
      {tarefas.map((t) => (
        <TarefaItem key={t.id} tarefa={t} agora={agora} />
      ))}
    </ItemGroup>
  );

  const cabecalho: ReactNode = (
    <>
      {titulo} <span className="text-muted-foreground tabular-nums">({tarefas.length})</span>
    </>
  );

  if (!recolhida) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="font-strong text-xl">{cabecalho}</h2>
        {lista}
      </section>
    );
  }

  return (
    <Collapsible asChild>
      <section className="group/secao flex flex-col gap-3">
        <h2>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className={cn(toque.botao, "-mx-3 w-full justify-between font-strong text-xl")}>
              <span>{cabecalho}</span>
              <ChevronDown
                aria-hidden
                data-icon="inline-end"
                className="transition-transform group-data-[state=open]/secao:rotate-180"
              />
            </Button>
          </CollapsibleTrigger>
        </h2>
        <CollapsibleContent>{lista}</CollapsibleContent>
      </section>
    </Collapsible>
  );
}

function SemRotinas() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MapPin />
        </EmptyMedia>
        <EmptyTitle className="text-xl">Nenhuma rotina para você neste posto</EmptyTitle>
        <EmptyDescription className="text-base">
          As rotinas são configuradas por posto e por perfil. Na demonstração, use Bis 2 · Embalagem.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild variant="outline" className={toque.botao}>
          <Link href="/contexto">Trocar posto</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
