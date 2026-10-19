"use client";

import { useMemo } from "react";

import type { Alerta, Perfil, TarefaInstancia } from "@/domain/types";
import { alertasDaLinha, tarefasDoTurno } from "@/lib/sessao/derivacao";
import type { DadosIndicadores } from "@/lib/sessao/indicadores";
import { useAgora, useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

const SEM_TAREFAS: TarefaInstancia[] = [];
const SEM_ALERTAS: Alerta[] = [];

/**
 * Tarefas do turno atual para um posto e um perfil. Derivação única: todos os componentes que pedem o mesmo posto e
 * perfil no mesmo minuto recebem o mesmo array (cache em `lib/sessao/derivacao`).
 */
export function useTarefas(postoId: string | undefined, perfil: Perfil | undefined): TarefaInstancia[] {
  const conclusoes = useSessionStore((s) => s.conclusoes);
  const agora = useAgora();
  return postoId && perfil ? tarefasDoTurno(postoId, perfil, agora, conclusoes) : SEM_TAREFAS;
}

/** Minha Rotina: tarefas da pessoa logada no posto do tablet. */
export function useMinhasTarefas(): TarefaInstancia[] {
  const usuario = useUsuarioAtual();
  const contexto = useSessionStore((s) => s.contexto);
  return useTarefas(contexto?.postoId, usuario?.perfil);
}

/**
 * Alertas dos postos da linha do tablet, calculados uma vez por minuto e por mudança de estado: atraso e NC (RN-01,
 * RN-02), indicadores, falha repetida, perdas e pedidos de ajuda (v0.5).
 */
export function useAlertas(): Alerta[] {
  const linhaId = useSessionStore((s) => s.contexto?.linhaId);
  const conclusoes = useSessionStore((s) => s.conclusoes);
  const registros = useSessionStore((s) => s.registros);
  const tratamentos = useSessionStore((s) => s.tratamentos);
  const dados = useDadosIndicadores();
  const agora = useAgora();
  return linhaId ? alertasDaLinha(linhaId, agora, conclusoes, registros, tratamentos, dados) : SEM_ALERTAS;
}

/** Mapas da v0.5 que entram nos indicadores (mesmo objeto enquanto nenhum deles muda). */
export function useDadosIndicadores(): DadosIndicadores {
  const apontamentosHora = useSessionStore((s) => s.apontamentosHora);
  const apontamentosPerdas = useSessionStore((s) => s.apontamentosPerdas);
  const falhas = useSessionStore((s) => s.falhas);
  const pedidosAjuda = useSessionStore((s) => s.pedidosAjuda);
  const planos = useSessionStore((s) => s.planos);
  return useMemo(
    () => ({ apontamentosHora, apontamentosPerdas, falhas, pedidosAjuda, planos }),
    [apontamentosHora, apontamentosPerdas, falhas, pedidosAjuda, planos],
  );
}
