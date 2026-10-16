"use client";

import Link from "next/link";

import NumberFlow from "@number-flow/react";
import { cn } from "cn";
import { ArrowRight, Check, CircleCheck, LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { localRepository } from "@/data/repository";
import { concluida, proximaTarefa } from "@/domain/routine-engine";
import { useMinhasTarefas } from "@/hooks/use-turno";
import { formatarHora } from "@/lib/format";
import { ICONE_MODULO } from "@/lib/modulo-icones";
import { hrefDaTarefa } from "@/lib/rotas";
import { useAgora } from "@/stores/session/session-store";

import { Duracao } from "./duracao";
import { StatusTarefa } from "./status-tarefa";
import { temTela, useConcluirTarefa } from "./use-concluir";

// Feedback de toque no botão principal (design engineering de Emil Kowalski: botões precisam responder à pressão).
const PRESSAO = "transition-transform duration-150 ease-out active:scale-[0.97]";

/** A ação dominante da tela: a próxima tarefa, com prazo vivo e um botão grande (UI Audit, prioridade 1). */
export function FazerAgora() {
  const tarefas = useMinhasTarefas();
  const agora = useAgora();
  const concluir = useConcluirTarefa();
  const proxima = proximaTarefa(tarefas);
  const paraAgora = tarefas.filter((t) => !concluida(t) && !t.futura).length;
  const atrasadas = tarefas.filter((t) => t.estado === "atrasada").length;
  const progresso = tarefas.length ? Math.round((tarefas.filter(concluida).length / tarefas.length) * 100) : 0;
  const depois = tarefas.find((t) => t.futura);

  const contadores = (
    <CardFooter className="flex-wrap gap-x-6 gap-y-1 border-t text-muted-foreground text-sm">
      <span>
        <NumberFlow value={paraAgora} className="font-medium text-foreground" /> para agora
      </span>
      <span>
        <NumberFlow value={progresso} suffix="%" className="font-medium text-foreground" /> do turno feito
      </span>
      {atrasadas > 0 && (
        <span className="text-destructive">
          <NumberFlow value={atrasadas} className="font-medium" /> {atrasadas === 1 ? "atrasada" : "atrasadas"}
        </span>
      )}
    </CardFooter>
  );

  if (!proxima) {
    return (
      <Card className="shadow-xs">
        <CardHeader>
          <CardDescription>Fazer agora</CardDescription>
          <CardTitle className="flex items-center gap-2 text-2xl tracking-tight">
            <CircleCheck className="size-6 text-green-600" aria-hidden />
            Tudo em dia
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          {depois ? `A próxima tarefa abre às ${formatarHora(depois.abre)}.` : "Não há mais tarefas neste turno."}
        </CardContent>
        {contadores}
      </Card>
    );
  }

  const Icone = ICONE_MODULO[proxima.moduloSlug] ?? LayoutGrid;
  const modulo = localRepository.modulo(proxima.moduloSlug);
  const atrasada = proxima.estado === "atrasada";
  const diferenca = Math.abs(proxima.prazo.getTime() - agora.getTime());

  return (
    <Card className={cn("shadow-xs", atrasada ? "border-destructive/40" : "border-primary/40")}>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          Fazer agora
          <StatusTarefa tarefa={proxima} />
        </CardDescription>
        <CardTitle className="text-balance text-2xl leading-tight tracking-tight">{proxima.titulo}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className={cn("text-lg", atrasada && "text-destructive")}>
            {atrasada ? "Venceu há " : "Vence em "}
            <Duracao ms={diferenca} />
          </p>
          <p className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <Icone className="size-4" aria-hidden />
            {modulo && !proxima.titulo.startsWith(modulo.nome) ? `${modulo.nome} · ` : ""}
            {formatarHora(proxima.abre)}–{formatarHora(proxima.prazo)}
          </p>
        </div>
        {temTela(proxima) ? (
          <Button asChild size="lg" className={cn("h-11 px-5 text-base", PRESSAO)}>
            <Link prefetch={false} href={hrefDaTarefa(proxima)}>
              Registrar
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        ) : (
          <Button size="lg" className={cn("h-11 px-5 text-base", PRESSAO)} onClick={() => concluir(proxima)}>
            <Check data-icon="inline-start" />
            Concluir
          </Button>
        )}
      </CardContent>
      {contadores}
    </Card>
  );
}
