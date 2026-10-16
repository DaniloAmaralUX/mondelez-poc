import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { avancar, type ClockAnchor } from "@/lib/clock";

import { criarTicker } from "../ticker";

describe("relógio único (ticker de minuto)", () => {
  let ancora: ClockAnchor;
  const ouvintesDaAncora = new Set<() => void>();
  const mudarAncora = (nova: ClockAnchor) => {
    ancora = nova;
    for (const o of ouvintesDaAncora) o();
  };
  const novoTicker = () =>
    criarTicker({
      lerAncora: () => ancora,
      assinarAncora: (aoMudar) => {
        ouvintesDaAncora.add(aoMudar);
        return () => ouvintesDaAncora.delete(aoMudar);
      },
    });

  beforeEach(() => {
    vi.useFakeTimers();
    // Real e simulado a 20 s do fim do minuto.
    vi.setSystemTime(new Date("2026-10-16T10:00:40.000Z"));
    ancora = { simulado: "2026-10-16T10:40:40.000Z", real: Date.now() };
    ouvintesDaAncora.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("devolve o mesmo objeto dentro do minuto e outro na virada", () => {
    const ticker = novoTicker();
    const primeiro = ticker.agora();
    vi.advanceTimersByTime(10_000);
    expect(ticker.agora()).toBe(primeiro);
    vi.advanceTimersByTime(10_000);
    const depois = ticker.agora();
    expect(depois).not.toBe(primeiro);
    expect(depois.toISOString()).toBe("2026-10-16T10:41:00.000Z");
  });

  it("um timer só, avisando na virada de cada minuto, para todos os ouvintes", () => {
    const ticker = novoTicker();
    const a = vi.fn();
    const b = vi.fn();
    const soltarA = ticker.assinar(a);
    const soltarB = ticker.assinar(b);
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(19_000);
    expect(a).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1_100);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(60_000);
    expect(a).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(1);

    soltarA();
    soltarB();
    expect(ticker.rodando()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("avisa na hora quando o relógio da demo muda e realinha à nova virada", () => {
    const ticker = novoTicker();
    const ouvinte = vi.fn();
    ticker.assinar(ouvinte);
    const antes = ticker.agora();

    // 10:40:40 + 15 min 30 s = 10:56:10: o novo minuto simulado vira em 50 s reais.
    mudarAncora(avancar(avancar(ancora, 15), 0.5));
    expect(ouvinte).toHaveBeenCalledTimes(1);
    expect(ticker.agora()).not.toBe(antes);
    expect(ticker.agora().toISOString()).toBe("2026-10-16T10:56:10.000Z");

    vi.advanceTimersByTime(49_000);
    expect(ouvinte).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1_100);
    expect(ouvinte).toHaveBeenCalledTimes(2);
    expect(ticker.agora().toISOString().slice(0, 19)).toBe("2026-10-16T10:57:00");
    expect(vi.getTimerCount()).toBe(1);
  });

  it("sem ouvintes não agenda timer nem assina o relógio", () => {
    const ticker = novoTicker();
    ticker.agora();
    expect(vi.getTimerCount()).toBe(0);
    expect(ouvintesDaAncora.size).toBe(0);
    const soltar = ticker.assinar(() => undefined);
    expect(ouvintesDaAncora.size).toBe(1);
    soltar();
    expect(ouvintesDaAncora.size).toBe(0);
  });
});
