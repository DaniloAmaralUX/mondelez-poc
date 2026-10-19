import { localRepository } from "@/data/repository";
import { MOTIVO_AJUDA, situacaoDoPedido } from "@/domain/alertas-indicadores";
import { duracaoMin } from "@/domain/falhas";
import type { AcaoAlerta, Alerta, EventoFalha, PedidoAjuda, TarefaInstancia } from "@/domain/types";
import { formatarHora, primeiroNome } from "@/lib/format";

/**
 * Textos que a passagem já traz preenchidos (job P0 do operador: "a passagem já vem com os meus números"). Uma linha por
 * acontecimento, com a hora na frente, para a pessoa só apagar ou completar.
 */

export function textoDasParadas(falhas: readonly EventoFalha[], corte: Date): string {
  const tipos = localRepository.tiposFalha();
  return falhas
    .map((f) => {
      const tipo = tipos.find((t) => t.id === f.tipoId)?.nome ?? f.tipoId;
      const equipamento = localRepository.equipamento(f.equipamentoId)?.nome;
      const duracao = f.fim ? `${duracaoMin(f, corte)} min` : "em curso";
      return [formatarHora(new Date(f.inicio)), tipo, equipamento, duracao].filter(Boolean).join(" · ");
    })
    .join("\n");
}

const SITUACAO = { enviado: "sem resposta ainda", visto: "visto", atendido: "atendido" } as const;

export function textoDosPedidos(
  pedidos: readonly PedidoAjuda[],
  tratamentos: Readonly<Record<string, AcaoAlerta[]>>,
): string {
  return pedidos
    .map((p) => {
      const { situacao, por } = situacaoDoPedido(p, tratamentos);
      const quem = por ? localRepository.usuario(por)?.nome : undefined;
      const estado = quem ? `${SITUACAO[situacao]} por ${primeiroNome(quem)}` : SITUACAO[situacao];
      return `${formatarHora(new Date(p.em))} · ${MOTIVO_AJUDA[p.motivo]}: ${p.texto} (${estado})`;
    })
    .join("\n");
}

/**
 * Pendências em poucas linhas: uma por tarefa atrasada (as horas repetidas do Hora x Hora viram "× 6") e os alertas
 * abertos que não são de atraso (o atraso já está na tarefa). Mais curto que o limite do campo, sem cortar no meio.
 */
export function textoDasPendencias(tarefas: readonly TarefaInstancia[], alertas: readonly Alerta[]): string {
  const atrasadas = new Map<string, number>();
  for (const t of tarefas) if (t.estado === "atrasada") atrasadas.set(t.titulo, (atrasadas.get(t.titulo) ?? 0) + 1);
  const linhasDeTarefa = [...atrasadas].map(([titulo, n]) => `Atrasada: ${titulo}${n > 1 ? ` (× ${n})` : ""}`);
  const abertos = new Set(
    alertas.filter((a) => a.estado !== "resolvido" && a.regra !== "A-ATRASO").map((a) => `Alerta aberto: ${a.titulo}`),
  );
  return [...linhasDeTarefa, ...abertos].join("\n");
}
