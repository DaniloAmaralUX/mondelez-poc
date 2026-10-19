"use client";

import { useMemo } from "react";

import { usePathname } from "next/navigation";

import { localRepository } from "@/data/repository";
import { situacaoDoPedido } from "@/domain/alertas-indicadores";
import { chaveTurno, turnoAtual } from "@/domain/turno";
import type { Alerta, PedidoAjuda } from "@/domain/types";
import { useAlertas, useMinhasTarefas } from "@/hooks/use-turno";
import { formatarHora, primeiroNome } from "@/lib/format";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { useAgora, useSessionStore } from "@/stores/session/session-store";

/** Mesmo nome do parâmetro do MTBF (`mtbf/_components/use-equipamento.ts`), sem importar de outra rota. */
const PARAMETRO_EQUIPAMENTO = "equipamento";

export interface ContextoDaAjuda {
  /** Nome da tela, como a liderança lê no alerta ("Pedido feito na tela MTBF."). */
  origem: string;
  equipamentoId?: string;
  tarefaId?: string;
}

function nomeDaTela(pathname: string): string {
  const checklist = pathname.match(/^\/dashboard\/checklist\/([^/]+)/);
  if (checklist?.[1]) return `Checklist ${localRepository.formulario(checklist[1])?.titulo ?? ""}`.trim();
  for (const grupo of sidebarItems) {
    for (const item of grupo.items) {
      if ("url" in item && item.url === pathname) return item.title;
      for (const sub of item.subItems ?? []) if (sub.url === pathname) return sub.title;
    }
  }
  return "Painel";
}

/**
 * Contexto automático do pedido de ajuda (RF-14): a tela atual (`usePathname`) e, quando a rota fala de uma máquina,
 * o equipamento: no checklist, o do rascunho ou o da tarefa (com a tarefa); no MTBF, o escolhido na tela
 * (`?equipamento=`). Lido quando o Sheet abre: é a foto do momento do pedido.
 */
export function useContextoDaAjuda(): ContextoDaAjuda {
  const pathname = usePathname();
  const tarefas = useMinhasTarefas();
  const rascunhos = useSessionStore((s) => s.rascunhos);

  return useMemo(() => {
    const origem = nomeDaTela(pathname);
    const checklist = pathname.match(/^\/dashboard\/checklist\/([^/]+)/)?.[1];
    if (checklist) {
      const doFormulario = tarefas.filter((t) => t.formularioId === checklist);
      const tarefa = doFormulario.find((t) => !t.futura) ?? doFormulario[0];
      const equipamentoId = (tarefa && rascunhos[tarefa.id]?.equipamentoId) ?? tarefa?.equipamentoId;
      return { origem, equipamentoId, tarefaId: tarefa?.id };
    }
    if (pathname === "/dashboard/mtbf") {
      const id = new URLSearchParams(window.location.search).get(PARAMETRO_EQUIPAMENTO);
      return { origem, equipamentoId: id && localRepository.equipamento(id) ? id : undefined };
    }
    return { origem };
  }, [pathname, tarefas, rascunhos]);
}

/** Último pedido de ajuda da pessoa no turno atual (o card mostra a situação dele). */
export function useUltimoPedido(): PedidoAjuda | undefined {
  const usuarioId = useSessionStore((s) => s.usuarioId);
  const pedidos = useSessionStore((s) => s.pedidosAjuda);
  const agora = useAgora();
  return useMemo(() => {
    const turno = chaveTurno(turnoAtual(agora));
    return Object.values(pedidos)
      .filter(
        (p) => p.usuarioId === usuarioId && new Date(p.em) <= agora && chaveTurno(turnoAtual(new Date(p.em))) === turno,
      )
      .sort((a, b) => b.em.localeCompare(a.em))[0];
  }, [pedidos, usuarioId, agora]);
}

export interface SituacaoLegivel {
  situacao: "enviado" | "visto" | "atendido";
  titulo: string;
  resposta?: string;
}

/** "Enviado", "Visto por Renata às 08:05" ou "Atendido por Renata às 08:20", com a resposta quando houver. */
export function useSituacaoDoPedido(pedido: PedidoAjuda | undefined): SituacaoLegivel | undefined {
  const tratamentos = useSessionStore((s) => s.tratamentos);
  return useMemo(() => {
    if (!pedido) return undefined;
    const s = situacaoDoPedido(pedido, tratamentos);
    const quem = s.por ? localRepository.usuario(s.por) : undefined;
    const porQuem = `${quem ? ` por ${primeiroNome(quem.nome)}` : ""}${s.em ? ` às ${formatarHora(new Date(s.em))}` : ""}`;
    if (s.situacao === "atendido") return { situacao: s.situacao, titulo: `Atendido${porQuem}`, resposta: s.resposta };
    if (s.situacao === "visto") return { situacao: s.situacao, titulo: `Visto${porQuem}`, resposta: s.resposta };
    return { situacao: "enviado", titulo: "Enviado, aguardando a liderança" };
  }, [pedido, tratamentos]);
}

/** Pedidos de ajuda ainda não resolvidos na linha do tablet (alertas A-AJUDA), para a liderança. */
export function usePedidosAbertos(): Alerta[] {
  const alertas = useAlertas();
  return useMemo(() => alertas.filter((a) => a.regra === "A-AJUDA" && a.estado !== "resolvido"), [alertas]);
}
