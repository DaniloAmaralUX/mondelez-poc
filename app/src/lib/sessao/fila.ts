import type { Conclusao, Registro, SyncStatus } from "@/domain/types";

import type { RascunhoSalvo } from "./rascunho";
import type { Rede } from "./rede";

/** Tempo para desfazer um registro antes de ele entrar na fila de envio (toast "Registrado · Desfazer"). */
export const JANELA_DESFAZER_MS = 10_000;
/** Duração simulada de um envio ao servidor. */
export const ATRASO_ENVIO_MS = 1200;

type Registros = Readonly<Record<string, Registro>>;

/** Troca o estado de envio dos ids indicados. Ids que não existem mais são ignorados. */
export function marcarComo(registros: Registros, ids: readonly string[], para: SyncStatus): Record<string, Registro> {
  const proximo: Record<string, Registro> = { ...registros };
  for (const id of ids) {
    const r = proximo[id];
    if (r && r.syncStatus !== para) proximo[id] = { ...r, syncStatus: para };
  }
  return proximo;
}

/** Fim da janela de desfazer: o registro entra na fila (`pendente` → `local`). */
export function fecharJanela(registros: Registros, registroId: string): Record<string, Registro> {
  const r = registros[registroId];
  if (r?.syncStatus !== "pendente") return { ...registros };
  return marcarComo(registros, [registroId], "local");
}

/**
 * O que a próxima tentativa envia: a fila (`local`), as falhas (`erro`), envios órfãos (`enviando` que esta aba não
 * está enviando, porque a aba que enviava fechou) e `pendente` órfão: sem janela de desfazer aberta nesta aba e criado
 * há mais de `JANELA_DESFAZER_MS` (a aba que o criou fechou dentro dos 10 s; sem isto ele ficava preso em "aguardando"
 * nas outras abas até uma recarga). `pendente` com a janela aberta aqui espera. `agoraMs` no relógio da demo, o mesmo
 * de `criadoEm`.
 */
export function idsParaEnviar(
  registros: Registros,
  emEnvioNestaAba: ReadonlySet<string>,
  janelasNestaAba: { has: (id: string) => boolean },
  agoraMs: number,
): string[] {
  return Object.values(registros)
    .filter(
      (r) =>
        r.syncStatus === "local" ||
        r.syncStatus === "erro" ||
        (r.syncStatus === "enviando" && !emEnvioNestaAba.has(r.id)) ||
        (r.syncStatus === "pendente" &&
          !janelasNestaAba.has(r.id) &&
          agoraMs - Date.parse(r.criadoEm) >= JANELA_DESFAZER_MS),
    )
    .map((r) => r.id);
}

/** Resultado do envio: com rede, `sincronizado`; se a rede caiu no meio, `erro` (reenvia sozinho ao voltar). */
export function concluirEnvio(registros: Registros, ids: readonly string[], rede: Rede): Record<string, Registro> {
  const enviando = ids.filter((id) => registros[id]?.syncStatus === "enviando");
  return marcarComo(registros, enviando, rede === "online" ? "sincronizado" : "erro");
}

/** true quando não há nada a enviar nem em envio: a fila do tablet está vazia. */
export function filaVazia(registros: Registros): boolean {
  return Object.values(registros).every((r) => r.syncStatus === "sincronizado");
}

/**
 * Ao abrir o app: a janela de desfazer e o envio em curso não sobrevivem à recarga. `pendente` e `enviando` voltam
 * para a fila (`local`); nada se perde e nada fica preso.
 */
export function normalizarAoAbrir(registros: Registros): Record<string, Registro> {
  const presos = Object.values(registros)
    .filter((r) => r.syncStatus === "pendente" || r.syncStatus === "enviando")
    .map((r) => r.id);
  return marcarComo(registros, presos, "local");
}

export interface EstadoDoRegistro {
  registros: Registros;
  conclusoes: Readonly<Record<string, Conclusao>>;
  rascunhos: Readonly<Record<string, RascunhoSalvo>>;
}

/**
 * Desfazer um registro na janela: some o registro, some a conclusão que ele criou e o rascunho volta com as respostas
 * (e o autor original). Devolve `null` se o registro não está mais `pendente`.
 */
export function desfazerNoEstado(
  estado: EstadoDoRegistro,
  registroId: string,
  rascunhoOriginal: RascunhoSalvo | undefined,
): {
  registros: Record<string, Registro>;
  conclusoes: Record<string, Conclusao>;
  rascunhos: Record<string, RascunhoSalvo>;
} | null {
  const registro = estado.registros[registroId];
  if (registro?.syncStatus !== "pendente") return null;

  const registros = { ...estado.registros };
  delete registros[registroId];

  const conclusoes = { ...estado.conclusoes };
  // Só remove a conclusão criada por este registro (mesmo instante), nunca uma conclusão posterior.
  if (conclusoes[registro.tarefaId]?.em === registro.criadoEm) delete conclusoes[registro.tarefaId];

  const rascunho: RascunhoSalvo = {
    respostas: registro.respostas,
    equipamentoId: registro.equipamentoId,
    observacao: registro.observacao ?? "",
    iniciadoPor: rascunhoOriginal?.iniciadoPor ?? registro.usuarioId,
    iniciadoEm: rascunhoOriginal?.iniciadoEm ?? registro.criadoEm,
  };

  return { registros, conclusoes, rascunhos: { ...estado.rascunhos, [registro.tarefaId]: rascunho } };
}
