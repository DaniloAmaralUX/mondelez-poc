"use client";

import { useMemo } from "react";

import { historicoDasLinhas, type TurnoHistorico, turnoSimulado, turnosAnteriores } from "@/data/historico";
import { localRepository } from "@/data/repository";
import { falhasDoTurno } from "@/domain/falhas";
import { kpisDoTurno } from "@/domain/kpis";
import type { HoraDoTurno } from "@/domain/producao";
import { chaveTurno, turnoAtual } from "@/domain/turno";
import type { Alerta, EventoFalha, KpisTurno, Linha, Notificacao, PlanoProducao, Recado } from "@/domain/types";
import { MINUTO_MS } from "@/lib/clock";
import { metaDaLinha, planoVigente, serieDoPosto } from "@/lib/sessao/indicadores";
import { useAgora, useSessionStore } from "@/stores/session/session-store";

import { useAlertas, useTarefas } from "./use-turno";

/**
 * Hooks de leitura da v0.5 (docs/16). Todos derivam do store da sessão e do relógio único (`useAgora`); nenhum guarda
 * estado próprio. As telas chamam as ações do store para escrever.
 */

/** Posto do tablet (ou o informado). */
function usePostoId(postoId?: string): string | undefined {
  const doTablet = useSessionStore((s) => s.contexto?.postoId);
  return postoId ?? doTablet;
}

/** Série do Hora x Hora do posto no turno atual (8 horas, com meta, GE e farol). */
export function useSerieDoTurno(postoId?: string): HoraDoTurno[] {
  const id = usePostoId(postoId);
  const apontamentosHora = useSessionStore((s) => s.apontamentosHora);
  const planos = useSessionStore((s) => s.planos);
  const agora = useAgora();
  return useMemo(
    () => (id ? serieDoPosto(id, agora, { apontamentosHora, planos }) : []),
    [id, agora, apontamentosHora, planos],
  );
}

/** Meta da hora e SKU do dia da linha do tablet, pelo plano vigente. */
export function useMetaDaLinha(linhaId?: string) {
  const doTablet = useSessionStore((s) => s.contexto?.linhaId);
  const planos = useSessionStore((s) => s.planos);
  const agora = useAgora();
  const id = linhaId ?? doTablet;
  return useMemo(() => (id ? metaDaLinha(planos, id, turnoAtual(agora)) : undefined), [id, planos, agora]);
}

/** Falhas do posto no turno atual (da mais antiga para a mais recente), até o instante simulado. */
export function useFalhasDoTurno(postoId?: string): EventoFalha[] {
  const id = usePostoId(postoId);
  const falhas = useSessionStore((s) => s.falhas);
  const agora = useAgora();
  return useMemo(() => {
    const turno = turnoAtual(agora);
    return falhasDoTurno(Object.values(falhas), chaveTurno(turno), id, turno).filter(
      (f) => new Date(f.inicio) <= agora,
    );
  }, [falhas, agora, id]);
}

/** Indicadores do posto no turno atual (troca de turno, relatório). */
export function useKpisDoPosto(postoId?: string): KpisTurno | undefined {
  const id = usePostoId(postoId);
  const serie = useSerieDoTurno(id);
  const falhas = useFalhasDoTurno(id);
  const tarefas = useTarefas(id, "operacao");
  const alertas = useAlertas();
  const registros = useSessionStore((s) => s.registros);
  const pedidosAjuda = useSessionStore((s) => s.pedidosAjuda);
  const apontamentosPerdas = useSessionStore((s) => s.apontamentosPerdas);
  const agora = useAgora();

  return useMemo(() => {
    if (!id) return undefined;
    const turno = turnoAtual(agora);
    const chave = chaveTurno(turno);
    const doTurno = (iso: string) => chaveTurno(turnoAtual(new Date(iso))) === chave;
    return kpisDoTurno({
      turno,
      agora,
      serie,
      falhas,
      tipos: localRepository.tiposFalha(),
      registros: Object.values(registros).filter((r) => r.postoId === id && r.turnoChave === chave),
      alertas: alertas.filter((a) => a.postoId === id),
      pedidos: Object.values(pedidosAjuda).filter((p) => p.postoId === id && doTurno(p.em)),
      tarefas,
      perdas: Object.values(apontamentosPerdas).filter((p) => p.postoId === id && p.turnoChave === chave),
    });
  }, [id, agora, serie, falhas, tarefas, alertas, registros, pedidosAjuda, apontamentosPerdas]);
}

/** Soma os indicadores de vários postos da mesma linha (toneladas e GE vêm do posto que aponta caixas). */
function somarKpis(lista: KpisTurno[]): KpisTurno | undefined {
  if (lista.length === 0) return undefined;
  const producao = lista.find((k) => k.metaTurno > 0) ?? lista[0];
  if (!producao) return undefined;
  const soma = (f: (k: KpisTurno) => number) => lista.reduce((s, k) => s + f(k), 0);
  const falhas = soma((k) => k.falhas);
  const maiores = lista.map((k) => k.maiorParada).filter((m) => m !== undefined);
  return {
    ...producao,
    falhas,
    minutosParados: soma((k) => k.minutosParados),
    mtbfMin: falhas > 0 ? (producao.mtbfMin !== null ? (producao.mtbfMin * producao.falhas) / falhas : null) : null,
    maiorParada: maiores.sort((a, b) => b.minutos - a.minutos)[0],
    naoConformes: soma((k) => k.naoConformes),
    alertasAbertos: soma((k) => k.alertasAbertos),
    alertasTratados: soma((k) => k.alertasTratados),
    pedidosAjuda: soma((k) => k.pedidosAjuda),
    tarefasFeitas: soma((k) => k.tarefasFeitas),
    tarefasTotal: soma((k) => k.tarefasTotal),
    tarefasAtrasadas: soma((k) => k.tarefasAtrasadas),
    refugoKg: soma((k) => k.refugoKg),
  };
}

/** Indicadores da linha do tablet no turno atual: os postos dela somados (dados reais do protótipo). */
export function useKpisDaLinhaDoTablet(): KpisTurno | undefined {
  const embalagem = useKpisDoPosto("bis-2-embalagem");
  const processo = useKpisDoPosto("bis-2-processo");
  return useMemo(() => somarKpis([embalagem, processo].filter((k) => k !== undefined)), [embalagem, processo]);
}

export interface LinhaNoRelatorio {
  linha: Linha;
  kpis: KpisTurno | undefined;
  /** Turno anterior da mesma linha (simulado), para comparação. */
  anterior: KpisTurno;
  /** Os números da linha vêm do gerador (só a Bis 2 é registrada de verdade no protótipo). */
  simulado: boolean;
}

/**
 * Relatório do turno atual das quatro linhas (RM-12): a Bis 2 com os dados do tablet, as outras com o gerador
 * determinístico até o instante simulado, e o turno anterior de cada uma para comparar.
 */
export function useRelatorioDasLinhas(): LinhaNoRelatorio[] {
  const agora = useAgora();
  const bis2 = useKpisDaLinhaDoTablet();
  return useMemo(() => {
    const turno = turnoAtual(agora);
    const fracao = Math.min(
      1,
      Math.max(0, (agora.getTime() - turno.inicio.getTime()) / (turno.fim.getTime() - turno.inicio.getTime())),
    );
    const anterior = turnosAnteriores(agora, 1)[0] ?? turno;
    return localRepository.linhas("chocolate").map((linha) => ({
      linha,
      kpis: linha.id === "bis-2" ? bis2 : turnoSimulado(linha.id, turno, fracao).kpis,
      anterior: turnoSimulado(linha.id, anterior).kpis,
      simulado: linha.id !== "bis-2",
    }));
  }, [agora, bis2]);
}

/** Histórico simulado dos turnos anteriores das quatro linhas (painel da gerência e tendências). */
export function useHistoricoDasLinhas(turnos = 21): TurnoHistorico[] {
  const agora = useAgora();
  const chave = chaveTurno(turnoAtual(agora));
  // Recalcula só na virada do turno: o histórico não muda a cada minuto.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a chave do turno é a dependência real
  return useMemo(() => historicoDasLinhas(agora, turnos), [chave, turnos]);
}

/** Plano de produção vigente da semana atual (importado ou o de exemplo). */
export function usePlanoVigente(): PlanoProducao {
  const planos = useSessionStore((s) => s.planos);
  const agora = useAgora();
  return useMemo(() => planoVigente(planos, agora), [planos, agora]);
}

/** Recados e agenda, os mais recentes primeiro; com `linhaId`, os da linha e os da fábrica. */
export function useRecados(linhaId?: string): Recado[] {
  const recados = useSessionStore((s) => s.recados);
  const agora = useAgora();
  return useMemo(
    () =>
      Object.values(recados)
        // Até o fim do minuto corrente: o relógio único vira no minuto e a publicação grava com segundos; com "<= agora"
        // o recado recém-publicado só aparecia no minuto seguinte (relatório da frente D, docs/17).
        .filter(
          (r) =>
            new Date(r.em).getTime() < agora.getTime() + MINUTO_MS && (!linhaId || !r.linhaId || r.linhaId === linhaId),
        )
        .sort((a, b) => b.em.localeCompare(a.em)),
    [recados, agora, linhaId],
  );
}

/**
 * Caixa de saída das notificações simuladas: as guardadas (relatório, ajuda, recado) e as que o piloto mandaria para
 * cada alerta (Teams para Supervisão e Especialista; crítico também por e-mail para a Gerência). Mais recente primeiro.
 */
export function useNotificacoes(): Notificacao[] {
  const guardadas = useSessionStore((s) => s.notificacoes);
  const alertas = useAlertas();
  const agora = useAgora();
  return useMemo(() => {
    const deAlertas = alertas.flatMap((a: Alerta) => {
      const base = {
        assunto: `${a.criticidade === "critico" ? "Crítico" : "Atenção"} · ${a.titulo}`,
        corpo: a.descricao,
        origem: { tipo: "alerta" as const, id: a.id },
        em: a.criadoEm.toISOString(),
      };
      const teams: Notificacao = { ...base, id: `teams:${a.id}`, canal: "teams", para: ["supervisao", "especialista"] };
      return a.criticidade === "critico"
        ? [teams, { ...base, id: `email:${a.id}`, canal: "email" as const, para: ["gerencia" as const] }]
        : [teams];
    });
    return [...Object.values(guardadas), ...deAlertas]
      .filter((n) => new Date(n.em) <= agora)
      .sort((a, b) => b.em.localeCompare(a.em));
  }, [guardadas, alertas, agora]);
}
