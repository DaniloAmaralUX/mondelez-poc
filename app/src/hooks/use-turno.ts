"use client";

import { useMemo } from "react";

import { localRepository } from "@/data/repository";
import { gerarAlertas } from "@/domain/alert-engine";
import { gerarTarefas } from "@/domain/routine-engine";
import { turnoAtual } from "@/domain/turno";
import type { Alerta, Perfil, TarefaInstancia } from "@/domain/types";
import { useAgora, useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

/** Tarefas do turno atual para um posto e um perfil. */
export function useTarefas(postoId: string | undefined, perfil: Perfil | undefined): TarefaInstancia[] {
  const conclusoes = useSessionStore((s) => s.conclusoes);
  const agora = useAgora();

  return useMemo(
    () =>
      postoId && perfil
        ? gerarTarefas({
            templates: localRepository.templates(),
            postoId,
            perfil,
            turno: turnoAtual(agora),
            agora,
            conclusoes,
          })
        : [],
    [postoId, perfil, agora, conclusoes],
  );
}

/** Minha Rotina: tarefas da pessoa logada no posto do tablet. */
export function useMinhasTarefas() {
  const usuario = useUsuarioAtual();
  const contexto = useSessionStore((s) => s.contexto);
  return useTarefas(contexto?.postoId, usuario?.perfil);
}

/** Alertas dos postos da linha do tablet (RN-01, RN-02). */
export function useAlertas(): Alerta[] {
  const contexto = useSessionStore((s) => s.contexto);
  const conclusoes = useSessionStore((s) => s.conclusoes);
  const registros = useSessionStore((s) => s.registros);
  const tratamentos = useSessionStore((s) => s.tratamentos);
  const agora = useAgora();

  return useMemo(() => {
    if (!contexto) return [];
    const turno = turnoAtual(agora);
    const tarefas = localRepository.postos(contexto.linhaId).flatMap((posto) =>
      gerarTarefas({
        templates: localRepository.templates(),
        postoId: posto.id,
        perfil: "operacao",
        turno,
        agora,
        conclusoes,
      }).map((tarefa) => ({ postoId: posto.id, tarefa })),
    );

    return gerarAlertas({
      tarefas,
      registros: Object.values(registros),
      formularios: localRepository.formulariosPorId(),
      tratamentos,
      agora,
    });
  }, [contexto, conclusoes, registros, tratamentos, agora]);
}
