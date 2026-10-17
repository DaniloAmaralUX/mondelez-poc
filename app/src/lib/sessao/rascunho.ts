import type { Rascunho } from "@/domain/types";

/** Rascunho como fica salvo no tablet: sempre com quem começou e quando. */
export type RascunhoSalvo = Rascunho & { iniciadoPor: string; iniciadoEm: string };

/**
 * Gravação de rascunho: os valores vêm do formulário; autor e início vêm do rascunho que já existia (o primeiro a
 * gravar é quem começou) e só na primeira gravação são preenchidos com a pessoa atual e o horário simulado.
 * `iniciadoPor`/`iniciadoEm` que venham nos valores são ignorados: só o store decide a autoria.
 */
export function gravarRascunho(
  existente: RascunhoSalvo | undefined,
  valores: Rascunho,
  autor: string,
  agoraIso: string,
): RascunhoSalvo {
  return {
    respostas: valores.respostas,
    equipamentoId: valores.equipamentoId,
    observacao: valores.observacao,
    iniciadoPor: existente?.iniciadoPor ?? autor,
    iniciadoEm: existente?.iniciadoEm ?? agoraIso,
  };
}

/**
 * "Continuar" um rascunho de outra pessoa: a autoria passa para quem está no posto, a partir de agora (horário
 * simulado). Guardar o início antigo com o autor novo fazia o aviso dizer que ela começou antes de chegar ("iniciado
 * por Graziela às 07:40", quando ela assumiu às 07:55).
 */
export function assumirRascunho(rascunho: RascunhoSalvo, usuarioId: string, agoraIso: string): RascunhoSalvo {
  return rascunho.iniciadoPor === usuarioId ? rascunho : { ...rascunho, iniciadoPor: usuarioId, iniciadoEm: agoraIso };
}
