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
import { PRESSAO } from "@/lib/pressao";
import { hrefDaTarefa } from "@/lib/rotas";
import { useAgora } from "@/stores/session/session-store";

import { Duracao } from "./duracao";
import { StatusTarefa } from "./status-tarefa";
import { rotuloDaRota, temFormulario, useConcluirTarefa } from "./use-concluir";

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
    // Sem nenhuma tarefa no posto e turno: nem "mais" tarefas nem "0% do turno feito", que contradiria "Tudo em dia".
    let descricao = "Não há mais tarefas neste turno.";
    if (tarefas.length === 0) descricao = "Nenhuma tarefa sua neste posto e turno.";
    else if (depois) descricao = `A próxima tarefa abre às ${formatarHora(depois.abre)}.`;
    return (
      <Card className="h-full">
        <CardHeader>
          <CardDescription>Fazer agora</CardDescription>
          <CardTitle className="flex items-center gap-2 text-2xl tracking-tight">
            <CircleCheck className="size-6 text-green-600" aria-hidden />
            Tudo em dia
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">{descricao}</CardContent>
        {tarefas.length > 0 && contadores}
      </Card>
    );
  }

  const Icone = ICONE_MODULO[proxima.moduloSlug] ?? LayoutGrid;
  const modulo = localRepository.modulo(proxima.moduloSlug);
  const atrasada = proxima.estado === "atrasada";
  const diferenca = Math.abs(proxima.prazo.getTime() - agora.getTime());
  const atalho = rotuloDaRota(proxima);

  return (
    <Card className="h-full">
      {/* Ícone do módulo num bloco arredondado, como o ícone de um app (v0.4, docs/14): reconhece a rotina antes de ler. */}
      <CardHeader className="grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <div
          aria-hidden
          className={cn(
            "row-span-2 grid size-12 place-items-center rounded-xl toque:size-14",
            atrasada ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
          )}
        >
          <Icone className="size-6" />
        </div>
        <CardDescription className="flex items-center gap-2">
          Fazer agora
          <StatusTarefa tarefa={proxima} pulsar />
        </CardDescription>
        <CardTitle className="text-balance text-2xl leading-tight">{proxima.titulo}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className={cn("font-medium text-lg tabular-nums", atrasada && "text-destructive")}>
            {atrasada ? "Venceu há " : "Vence em "}
            <Duracao ms={diferenca} />
          </p>
          <p className="text-muted-foreground text-sm tabular-nums">
            {modulo && !proxima.titulo.startsWith(modulo.nome) ? `${modulo.nome} · ` : ""}
            {formatarHora(proxima.abre)}–{formatarHora(proxima.prazo)}
          </p>
        </div>
        {temFormulario(proxima) ? (
          // 44 px no notebook (v0.2); 64 px no toque: ação primária do operador (docs/12 §2 item 1 e §3.1).
          <Button asChild size="lg" className={cn("h-11 toque:h-16 px-5 toque:px-6 text-base", PRESSAO)}>
            {/* prefetch: a tela de registro abre mesmo com a rede caindo (lib/rotas.ts). */}
            <Link prefetch href={hrefDaTarefa(proxima)}>
              Registrar
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {/* Tarefa feita em outra tela, sem formulário (ex.: "Revisar alertas abertos"): o atalho leva até lá e o
                Concluir fecha a tarefa, com Desfazer. */}
            {atalho && proxima.rota && (
              <Button asChild variant="outline" size="lg" className="h-11 px-5 text-base">
                <Link prefetch href={proxima.rota}>
                  {atalho}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            )}
            <Button
              size="lg"
              className={cn("h-11 toque:h-16 px-5 toque:px-6 text-base", PRESSAO)}
              onClick={() => concluir(proxima)}
            >
              <Check data-icon="inline-start" />
              Concluir
            </Button>
          </div>
        )}
      </CardContent>
      {contadores}
    </Card>
  );
}
