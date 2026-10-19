"use client";

import { type ReactNode, useRef, useState } from "react";

import NumberFlow from "@number-flow/react";
import { cn } from "cn";

import { LIMITE_REFUGO_KG, LIMITE_SOBREPESO_G } from "@/domain/alertas-indicadores";
import { pode } from "@/domain/permissoes";
import { chaveTurno, turnoAtual } from "@/domain/turno";
import { useMinhasTarefas, useTarefas } from "@/hooks/use-turno";
import { formatarHora } from "@/lib/format";
import { useAgora, useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

import { CabecalhoDaProducao } from "../../hora-x-hora/_components/cabecalho-da-producao";
import { ApontarPerdas, type RascunhoPerdas, rascunhoDe } from "./apontar-perdas";
import { BlocosDoTurno, type LinhaDoBloco } from "./blocos-do-turno";
import { gramas, quilos } from "./formato";

const UMA_CASA = { minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;

/** Tarefas de perdas do posto; a Supervisão conclui a do operador (mesma regra do Hora x Hora). */
function useTarefasDePerdas() {
  const minhas = useMinhasTarefas();
  const postoId = useSessionStore((s) => s.contexto?.postoId);
  const daOperacao = useTarefas(postoId, "operacao");
  const dePerdas = (t: { templateId: string }) => t.templateId === "sobrepeso";
  return (minhas.some(dePerdas) ? minhas : daOperacao)
    .filter(dePerdas)
    .sort((a, b) => a.abre.getTime() - b.abre.getTime());
}

function Celula({
  titulo,
  valor,
  children,
}: {
  readonly titulo: string;
  readonly valor: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 bg-card p-5">
      <h2 className="text-muted-foreground text-sm toque:text-base">{titulo}</h2>
      <div className="font-semibold text-3xl tabular-nums leading-none tracking-tight">{valor}</div>
      <p className="text-pretty text-muted-foreground text-sm">{children}</p>
    </div>
  );
}

export function Sobrepeso() {
  const usuarioId = useSessionStore((s) => s.usuarioId);
  return <Conteudo key={usuarioId ?? "ninguem"} />;
}

/**
 * Sobrepeso, refugo e reprocesso (RM-03) na composição do Analytics: o card de apontar o bloco aberto e, ao lado no
 * notebook (7/5), o acumulado do turno e a lista dos blocos. No iPad, a mesma ordem em coluna única: o card primeiro.
 */
function Conteudo() {
  const usuario = useUsuarioAtual();
  const agora = useAgora();
  const contexto = useSessionStore((s) => s.contexto);
  const apontamentos = useSessionStore((s) => s.apontamentosPerdas);
  const tarefas = useTarefasDePerdas();
  const [escolhida, setEscolhida] = useState<string>();
  const [rascunho, setRascunho] = useState<RascunhoPerdas>();
  const cardRef = useRef<HTMLDivElement>(null);

  const podeEscrever = pode(usuario?.perfil, "apontamentos", "escrever");
  const turno = turnoAtual(agora);
  const chave = chaveTurno(turno);
  const linhas: LinhaDoBloco[] = tarefas.map((tarefa) => ({ tarefa, apontamento: apontamentos[tarefa.id] }));
  const doTurno = Object.values(apontamentos).filter((a) => a.postoId === contexto?.postoId && a.turnoChave === chave);

  // O bloco do card: o escolhido na lista, senão o pendente mais antigo, senão o aberto.
  const semApontamento = linhas.filter((l) => !l.apontamento && !l.tarefa.futura);
  const alvo =
    linhas.find((l) => l.tarefa.id === escolhida && !l.tarefa.futura) ??
    semApontamento.find((l) => l.tarefa.estado === "atrasada") ??
    semApontamento[0];
  const proxima = linhas.find((l) => l.tarefa.futura)?.tarefa;

  const refugo = doTurno.reduce((s, a) => s + a.refugoKg, 0);
  const reprocesso = doTurno.reduce((s, a) => s + a.reprocessoKg, 0);
  const sobrepesoMedio = doTurno.length ? doTurno.reduce((s, a) => s + a.sobrepesoG, 0) / doTurno.length : null;
  const acimaDoLimite = doTurno.filter(
    (a) => a.refugoKg > LIMITE_REFUGO_KG || a.sobrepesoG > LIMITE_SOBREPESO_G,
  ).length;

  function escolher(linha: LinhaDoBloco) {
    setEscolhida(linha.tarefa.id);
    setRascunho(rascunhoDe(linha.tarefa.id, linha.apontamento));
    requestAnimationFrame(() => {
      cardRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      cardRef.current?.querySelector<HTMLInputElement>('input[inputmode="decimal"]')?.focus({ preventScroll: true });
    });
  }

  function limpar() {
    setEscolhida(undefined);
    setRascunho(undefined);
  }

  return (
    <div className="flex flex-col @min-[60rem]/content:gap-8 gap-6">
      <CabecalhoDaProducao titulo="Sobrepeso, refugo e reprocesso">
        A cada 2 horas · limites de {gramas(LIMITE_SOBREPESO_G)} por pacote e {quilos(LIMITE_REFUGO_KG)} de refugo por
        bloco · {turno.numero}º turno, das {formatarHora(turno.inicio)} às {formatarHora(turno.fim)}
      </CabecalhoDaProducao>

      <div className="grid @min-[60rem]/content:grid-cols-12 items-start gap-6">
        <div ref={cardRef} className="@min-[60rem]/content:col-span-7 min-w-0 scroll-mt-(--dashboard-header-height)">
          <ApontarPerdas
            tarefa={alvo?.tarefa}
            apontamento={alvo?.apontamento}
            corrigindo={Boolean(alvo?.apontamento)}
            podeEscrever={podeEscrever}
            proxima={proxima}
            rascunho={rascunho}
            onRascunho={setRascunho}
            onCancelarCorrecao={limpar}
            onGravado={limpar}
          />
        </div>

        <div className="@min-[60rem]/content:col-span-5 flex min-w-0 flex-col gap-6">
          <section
            aria-label="Acumulado do turno"
            className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/5"
          >
            <div className="grid @min-[60rem]/content:grid-cols-1 @xl/content:grid-cols-3 gap-px bg-border/70">
              <Celula
                titulo="Refugo no turno"
                valor={
                  <>
                    <NumberFlow value={refugo} format={UMA_CASA} locales="pt-BR" />
                    <span className="font-normal text-lg text-muted-foreground"> kg</span>
                  </>
                }
              >
                {doTurno.length} de {linhas.length} blocos apontados
              </Celula>
              <Celula
                titulo="Reprocesso no turno"
                valor={
                  <>
                    <NumberFlow value={reprocesso} format={UMA_CASA} locales="pt-BR" />
                    <span className="font-normal text-lg text-muted-foreground"> kg</span>
                  </>
                }
              >
                Volta para a linha; não entra no refugo.
              </Celula>
              <Celula
                titulo="Sobrepeso médio"
                valor={
                  sobrepesoMedio === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <span className={cn(sobrepesoMedio > LIMITE_SOBREPESO_G && "text-red-700 dark:text-red-400")}>
                      <NumberFlow value={sobrepesoMedio} format={UMA_CASA} locales="pt-BR" />
                      <span className="font-normal text-lg text-muted-foreground"> g</span>
                    </span>
                  )
                }
              >
                {acimaDoLimite === 0
                  ? "Nenhum bloco acima do limite."
                  : `${acimaDoLimite === 1 ? "1 bloco" : `${acimaDoLimite} blocos`} acima do limite (alerta A-PERDA).`}
              </Celula>
            </div>
          </section>

          <BlocosDoTurno
            linhas={linhas}
            podeEscrever={podeEscrever}
            selecionada={alvo?.tarefa.id}
            onEscolher={escolher}
          />
        </div>
      </div>
    </div>
  );
}
