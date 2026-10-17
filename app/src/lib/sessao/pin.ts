/** PINs errados seguidos que bloqueiam o PIN da pessoa. */
export const MAX_TENTATIVAS_PIN = 5;
/** Espera depois do limite. Tempo real do aparelho, não o relógio da demo: avançar o relógio não encurta a espera. */
export const ESPERA_PIN_MS = 60_000;

/** Contagem de PINs errados e bloqueios por pessoa (`usuarioId`), como ficam salvos no tablet. */
export interface EstadoDoPin {
  tentativasPin: Readonly<Record<string, number>>;
  /** Até quando o PIN da pessoa fica bloqueado (ISO, horário real). */
  pinBloqueadoAte: Readonly<Record<string, string>>;
}

export type MudancaDoPin = { tentativasPin: Record<string, number>; pinBloqueadoAte: Record<string, string> };

export type ConferenciaDoPin =
  /** PIN certo e sem bloqueio: contagem e bloqueio da pessoa saem. */
  | { resultado: "certo"; mudanca: MudancaDoPin | null }
  /** PIN errado abaixo do limite. */
  | { resultado: "errado"; mudanca: MudancaDoPin; restantes: number }
  /** Este erro atingiu o limite: o PIN fica bloqueado até `bloqueadoAte`. */
  | { resultado: "bloqueou"; mudanca: MudancaDoPin; bloqueadoAte: string }
  /** Já estava bloqueado: o PIN nem é conferido e a espera não aumenta. */
  | { resultado: "bloqueado"; mudanca: MudancaDoPin | null; bloqueadoAte: string };

function sem<T>(mapa: Readonly<Record<string, T>>, chave: string): Record<string, T> {
  const { [chave]: _removido, ...resto } = mapa;
  return resto;
}

/** Instante (ms) até quando o PIN da pessoa está bloqueado; `null` sem bloqueio ou com o bloqueio já vencido. */
export function fimDoBloqueioDoPin(ate: string | undefined, agoraMs: number): number | null {
  if (!ate) return null;
  const fim = Date.parse(ate);
  return Number.isFinite(fim) && fim > agoraMs ? fim : null;
}

/** Segundos inteiros que faltam para desbloquear (arredondados para cima: nunca "0 s" com o PIN ainda bloqueado). */
export function segundosParaDesbloquear(fimMs: number, agoraMs: number): number {
  return Math.max(1, Math.ceil((fimMs - agoraMs) / 1000));
}

/** Texto do erro no login e na tela de bloqueio. */
export function mensagemDeEsperaDoPin(fimMs: number, agoraMs: number): string {
  return `Muitas tentativas. Tente de novo em ${segundosParaDesbloquear(fimMs, agoraMs)} s.`;
}

/**
 * Regra das tentativas de PIN (V03-SEC-02), por pessoa: depois de `MAX_TENTATIVAS_PIN` PINs errados seguidos, o PIN dela
 * fica bloqueado por `ESPERA_PIN_MS`. Durante o bloqueio nenhum PIN é conferido, nem o certo. O acerto zera a contagem.
 * Vencido o bloqueio, a contagem recomeça do zero. `mudanca: null` quando nada muda no estado salvo.
 */
export function conferirPin(
  estado: EstadoDoPin,
  usuarioId: string,
  acertou: boolean,
  agoraMs: number,
): ConferenciaDoPin {
  const ate = estado.pinBloqueadoAte[usuarioId];
  const fim = fimDoBloqueioDoPin(ate, agoraMs);
  if (fim !== null && ate) return { resultado: "bloqueado", mudanca: null, bloqueadoAte: ate };

  // Bloqueio vencido sai junto com a próxima tentativa.
  const pinBloqueadoAte = ate === undefined ? { ...estado.pinBloqueadoAte } : sem(estado.pinBloqueadoAte, usuarioId);

  if (acertou) {
    const nadaMuda = ate === undefined && !(usuarioId in estado.tentativasPin);
    return {
      resultado: "certo",
      mudanca: nadaMuda ? null : { tentativasPin: sem(estado.tentativasPin, usuarioId), pinBloqueadoAte },
    };
  }

  const tentativas = (estado.tentativasPin[usuarioId] ?? 0) + 1;
  if (tentativas >= MAX_TENTATIVAS_PIN) {
    const bloqueadoAte = new Date(agoraMs + ESPERA_PIN_MS).toISOString();
    return {
      resultado: "bloqueou",
      bloqueadoAte,
      mudanca: {
        tentativasPin: sem(estado.tentativasPin, usuarioId),
        pinBloqueadoAte: { ...pinBloqueadoAte, [usuarioId]: bloqueadoAte },
      },
    };
  }
  return {
    resultado: "errado",
    restantes: MAX_TENTATIVAS_PIN - tentativas,
    mudanca: { tentativasPin: { ...estado.tentativasPin, [usuarioId]: tentativas }, pinBloqueadoAte },
  };
}

/** ISO do bloqueio enquanto ele vale; `null` sem bloqueio ou já vencido. */
export function bloqueioVigente(ate: string | undefined, agoraMs: number): string | null {
  return ate !== undefined && fimDoBloqueioDoPin(ate, agoraMs) !== null ? ate : null;
}

/** Margem depois do instante do desbloqueio, para o timer nunca disparar antes dele. */
const FOLGA_DESBLOQUEIO_MS = 25;

export interface OpcoesDoDesbloqueio {
  /** Bloqueio salvo da pessoa (ISO), se houver. */
  lerAte: () => string | undefined;
  /** Assina as mudanças do mapa de bloqueios. Devolve o cancelamento. */
  assinarMudancas: (aoMudar: () => void) => () => void;
  agoraReal?: () => number;
}

/**
 * Assinatura para `useSyncExternalStore` do bloqueio do PIN de uma pessoa: avisa quando o bloqueio muda e uma vez no
 * instante do desbloqueio, com um único `setTimeout` até esse instante (não um relógio de 1 s). Devolve o cancelamento.
 */
export function assinarDesbloqueioDoPin(
  { lerAte, assinarMudancas, agoraReal = Date.now }: OpcoesDoDesbloqueio,
  aoMudar: () => void,
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const agendar = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    const fim = fimDoBloqueioDoPin(lerAte(), agoraReal());
    if (fim === null) return;
    timer = setTimeout(
      () => {
        timer = undefined;
        aoMudar();
      },
      fim - agoraReal() + FOLGA_DESBLOQUEIO_MS,
    );
  };
  const soltar = assinarMudancas(() => {
    agendar();
    aoMudar();
  });
  agendar();
  return () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    soltar();
  };
}
