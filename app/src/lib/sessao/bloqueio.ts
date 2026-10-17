/** Por que o tablet está bloqueado ("Quem está no posto?"). */
export type MotivoBloqueio = "inatividade" | "turno" | "oculto" | "troca";

/** Sem toque, tecla ou rolagem por 5 min: bloqueia. */
export const INATIVIDADE_MS = 5 * 60_000;
/** Aviso antes do bloqueio por inatividade, com tempo para continuar usando (WCAG 2.2.1 pede ao menos 20 s). */
export const AVISO_BLOQUEIO_MS = 20_000;
/** App em segundo plano (tela apagada, outro app) por mais de 2 min: bloqueia ao voltar. */
export const OCULTO_MS = 2 * 60_000;
/**
 * Chave do localStorage com o instante em que o app foi para segundo plano; sobrevive à recarga (o iPad descarta
 * páginas ocultas). Gravada e lida por `useBloqueioAutomatico`; apagada ao entrar (login ou PIN), para uma marca antiga
 * não bloquear quem acabou de entrar.
 */
export const CHAVE_OCULTO = "rotinas-oculto-em";

export interface EstadoDeBloqueio {
  usuarioId: string | null;
  bloqueado: boolean;
  motivoBloqueio: MotivoBloqueio | null;
  candidatoId: string | null;
}

export type MudancaDeBloqueio = Partial<{
  bloqueado: boolean;
  motivoBloqueio: MotivoBloqueio | null;
  ultimoUsuarioId: string | null;
  candidatoId: string | null;
}>;

/**
 * Regra de `bloquear(motivo, candidatoId?)`. Devolve a mudança de estado ou `null` quando não há o que fazer.
 * - Sem pessoa logada: não bloqueia.
 * - Desbloqueado: bloqueia e guarda quem estava (`ultimoUsuarioId`), com a pessoa pré-selecionada se for troca.
 * - Já bloqueado por troca: um bloqueio automático (inatividade, turno, oculto) toma o lugar, para que "Cancelar"
 *   não devolva o tablet à pessoa anterior depois de ele ficar parado; outra troca só muda a pessoa pré-selecionada.
 * - Já bloqueado por outro motivo: nada muda.
 */
export function aplicarBloqueio(
  estado: EstadoDeBloqueio,
  motivo: MotivoBloqueio,
  candidatoId?: string,
): MudancaDeBloqueio | null {
  if (!estado.bloqueado) {
    if (!estado.usuarioId) return null;
    return {
      bloqueado: true,
      motivoBloqueio: motivo,
      ultimoUsuarioId: estado.usuarioId,
      candidatoId: candidatoId ?? null,
    };
  }
  if (motivo === "troca") {
    return candidatoId !== undefined && candidatoId !== estado.candidatoId ? { candidatoId } : null;
  }
  if (estado.motivoBloqueio === "troca") return { motivoBloqueio: motivo, candidatoId: null };
  return null;
}

/** Milissegundos que faltam para o bloqueio por inatividade (≤ 0: já passou). */
export function restanteDeInatividade(ultimaAtividadeMs: number, agoraMs: number): number {
  return INATIVIDADE_MS - (agoraMs - ultimaAtividadeMs);
}

/** O app ficou oculto tempo demais (mais de `OCULTO_MS`). */
export function ocultoTempoDemais(ocultoDesdeMs: number, agoraMs: number): boolean {
  return agoraMs - ocultoDesdeMs > OCULTO_MS;
}

/**
 * Virada de turno com alguém logado: o turno simulado atual é posterior ao turno em que a pessoa entrou.
 * Só "posterior" conta (chaves "AAAA-MM-DDTn" ordenam como texto), para um login no limite do minuto não bloquear.
 */
export function viradaDeTurno(logado: boolean, turnoDaSessao: string | null, chaveAtual: string): boolean {
  return logado && turnoDaSessao !== null && chaveAtual > turnoDaSessao;
}
