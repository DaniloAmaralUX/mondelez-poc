"use client";

import { useMemo } from "react";

import { turnosAnteriores } from "@/data/historico";
import { localRepository } from "@/data/repository";
import { turmaDoTurno } from "@/domain/escala";
import { corteDoTurno } from "@/domain/falhas";
import { dataLocal } from "@/domain/producao";
import { chaveTurno, turnoAtual } from "@/domain/turno";
import type { KpisTurno, TrocaDeTurno, Turno, Usuario } from "@/domain/types";
import { useFalhasDoTurno, useKpisDoPosto } from "@/hooks/use-producao";
import { useAlertas, useTarefas } from "@/hooks/use-turno";
import { useAgora, useSessionStore } from "@/stores/session/session-store";

import { textoDasParadas, textoDasPendencias, textoDosPedidos } from "./sugestoes";

export interface SugestoesDaPassagem {
  paradas: string;
  pendencias: string;
  pedidosAjuda: string;
}

export interface Passagem {
  turno: Turno;
  turnoChave: string;
  kpis: KpisTurno | undefined;
  /** Troca deste posto no turno atual (entregue ou recebida). */
  troca: TrocaDeTurno | undefined;
  sugestoes: SugestoesDaPassagem;
}

/** Turno que vem depois do atual (para sugerir a turma que recebe). */
export function turnoSeguinte(turno: Turno): Turno {
  return turnoAtual(new Date(turno.fim.getTime() + 60_000));
}

/** Tudo o que a passagem de um posto precisa no turno atual: indicadores, troca gravada e textos pré-preenchidos. */
export function usePassagem(postoId: string | undefined): Passagem {
  const agora = useAgora();
  const turno = turnoAtual(agora);
  const turnoChave = chaveTurno(turno);
  const kpis = useKpisDoPosto(postoId);
  const falhas = useFalhasDoTurno(postoId);
  const tarefas = useTarefas(postoId, "operacao");
  const alertas = useAlertas();
  const pedidosAjuda = useSessionStore((s) => s.pedidosAjuda);
  const tratamentos = useSessionStore((s) => s.tratamentos);
  const troca = useSessionStore((s) => (postoId ? s.trocasDeTurno[`${postoId}|${turnoChave}`] : undefined));

  const sugestoes = useMemo<SugestoesDaPassagem>(() => {
    const corte = corteDoTurno(turnoAtual(agora), agora);
    const doTurno = Object.values(pedidosAjuda)
      .filter((p) => p.postoId === postoId && chaveTurno(turnoAtual(new Date(p.em))) === turnoChave)
      .filter((p) => new Date(p.em) <= agora)
      .sort((a, b) => a.em.localeCompare(b.em));
    const doPosto = alertas.filter((a) => a.postoId === postoId);
    return {
      paradas: textoDasParadas(falhas, corte) || "Nenhuma parada apontada no turno.",
      pendencias: textoDasPendencias(tarefas, doPosto) || "Nenhuma pendência: tarefas em dia e alertas tratados.",
      pedidosAjuda: textoDosPedidos(doTurno, tratamentos) || "Nenhum pedido de ajuda no turno.",
    };
  }, [agora, falhas, tarefas, alertas, pedidosAjuda, tratamentos, postoId, turnoChave]);

  return { turno, turnoChave, kpis, troca, sugestoes };
}

/**
 * Quem pode receber o posto: os operadores do posto (menos quem entrega), com a turma do turno seguinte primeiro, e a
 * supervisão, que recebe na ausência deles (RN-10).
 */
export function candidatosAoAceite(
  troca: TrocaDeTurno,
  turno: Turno,
): { operadores: Usuario[]; supervisao: Usuario[] } {
  const seguinte = turnoSeguinte(turno);
  const turma = turmaDoTurno(seguinte.numero, dataLocal(seguinte.data));
  const todos = localRepository.usuarios();
  const operadores = todos
    .filter((u) => u.perfil === "operacao" && u.postoId === troca.postoId && u.id !== troca.entreguePor)
    .sort((a, b) => Number(b.turma === turma) - Number(a.turma === turma) || a.nome.localeCompare(b.nome));
  const supervisao = todos.filter((u) => u.perfil === "supervisao" && u.id !== troca.entreguePor);
  return { operadores, supervisao };
}

/** Turma que trabalha no turno seguinte. */
export function turmaDoTurnoSeguinte(turno: Turno) {
  const seguinte = turnoSeguinte(turno);
  return turmaDoTurno(seguinte.numero, dataLocal(seguinte.data));
}

/** Chave do turno anterior ao de `agora`. */
export function chaveDoTurnoAnterior(agora: Date): string | undefined {
  const anterior = turnosAnteriores(agora, 1)[0];
  return anterior ? chaveTurno(anterior) : undefined;
}
