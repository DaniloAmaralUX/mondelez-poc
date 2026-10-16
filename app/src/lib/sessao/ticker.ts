import { agoraSimulado, type ClockAnchor, mesmaAncora, minutoSimulado, msAteViradaDoMinuto } from "@/lib/clock";

/** Margem depois da virada para o timer nunca disparar no minuto anterior. */
const FOLGA_MS = 25;

export interface OpcoesTicker {
  /** Âncora atual do relógio da demo. */
  lerAncora: () => ClockAnchor;
  /** Assina mudanças da âncora (avançar relógio, resetar, reidratar). Devolve o cancelamento. */
  assinarAncora: (aoMudar: () => void) => () => void;
  agoraReal?: () => number;
}

export interface TickerDeMinuto {
  /** Assina a virada de cada minuto simulado e as mudanças do relógio da demo. Devolve o cancelamento. */
  assinar: (ouvinte: () => void) => () => void;
  /** Horário simulado; devolve o mesmo objeto enquanto o minuto simulado e a âncora não mudam. */
  agora: () => Date;
  /** Há um timer agendado (para testes). */
  rodando: () => boolean;
}

/**
 * Relógio único do app: um só `setTimeout` encadeado, alinhado à virada do minuto simulado, e só enquanto há quem
 * escute. Avisa na virada, imediatamente quando a âncora muda e ao voltar de segundo plano (timers congelam no iPad).
 * `agora()` serve de snapshot para `useSyncExternalStore`: a referência só muda quando o minuto ou a âncora mudam.
 */
export function criarTicker({ lerAncora, assinarAncora, agoraReal = Date.now }: OpcoesTicker): TickerDeMinuto {
  const ouvintes = new Set<() => void>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let soltarAncora: (() => void) | undefined;
  let cache: { ancora: ClockAnchor; minuto: number; data: Date } | undefined;

  function agora(): Date {
    const ancora = lerAncora();
    const real = agoraReal();
    const minuto = minutoSimulado(ancora, real);
    if (cache && cache.minuto === minuto && mesmaAncora(cache.ancora, ancora)) return cache.data;
    cache = { ancora, minuto, data: agoraSimulado(ancora, real) };
    return cache.data;
  }

  function avisar() {
    for (const ouvinte of [...ouvintes]) ouvinte();
  }

  function agendar() {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      avisar();
      if (ouvintes.size > 0) agendar();
    }, msAteViradaDoMinuto(lerAncora(), agoraReal()) + FOLGA_MS);
  }

  function aoMudarAncora() {
    avisar();
    if (ouvintes.size > 0) agendar();
  }

  function aoMudarVisibilidade() {
    if (document.visibilityState === "visible") aoMudarAncora();
  }

  function iniciar() {
    soltarAncora = assinarAncora(aoMudarAncora);
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", aoMudarVisibilidade);
    agendar();
  }

  function parar() {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    soltarAncora?.();
    soltarAncora = undefined;
    if (typeof document !== "undefined") document.removeEventListener("visibilitychange", aoMudarVisibilidade);
  }

  function assinar(ouvinte: () => void) {
    ouvintes.add(ouvinte);
    if (ouvintes.size === 1) iniciar();
    return () => {
      if (!ouvintes.delete(ouvinte)) return;
      if (ouvintes.size === 0) parar();
    };
  }

  return { assinar, agora, rodando: () => timer !== undefined };
}
