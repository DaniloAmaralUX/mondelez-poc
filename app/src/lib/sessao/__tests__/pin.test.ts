import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assinarDesbloqueioDoPin,
  bloqueioVigente,
  type ConferenciaDoPin,
  conferirPin,
  ESPERA_PIN_MS,
  type EstadoDoPin,
  fimDoBloqueioDoPin,
  MAX_TENTATIVAS_PIN,
  mensagemDeEsperaDoPin,
  segundosParaDesbloquear,
} from "../pin";

const AGORA = Date.parse("2026-10-16T13:00:00.000Z");
const VAZIO: EstadoDoPin = { tentativasPin: {}, pinBloqueadoAte: {} };

function aplicar(estado: EstadoDoPin, conferencia: ConferenciaDoPin): EstadoDoPin {
  return conferencia.mudanca ?? estado;
}

function errarVezes(vezes: number, estado: EstadoDoPin = VAZIO, usuarioId = "u-alberto") {
  let atual = estado;
  let ultima: ConferenciaDoPin | undefined;
  for (let i = 0; i < vezes; i++) {
    ultima = conferirPin(atual, usuarioId, false, AGORA);
    atual = aplicar(atual, ultima);
  }
  return { estado: atual, ultima };
}

describe("tentativas de PIN", () => {
  it("5 erros seguidos bloqueiam por 60 s; os 4 primeiros só contam", () => {
    expect(MAX_TENTATIVAS_PIN).toBe(5);
    expect(ESPERA_PIN_MS).toBe(60_000);

    const quatro = errarVezes(4);
    expect(quatro.ultima).toMatchObject({ resultado: "errado", restantes: 1 });
    expect(quatro.estado.tentativasPin).toEqual({ "u-alberto": 4 });

    const quinta = conferirPin(quatro.estado, "u-alberto", false, AGORA);
    expect(quinta).toMatchObject({ resultado: "bloqueou", bloqueadoAte: new Date(AGORA + 60_000).toISOString() });
    // A contagem recomeça: vencido o bloqueio, a pessoa tem 5 tentativas de novo.
    expect(quinta.mudanca?.tentativasPin).toEqual({});
  });

  it("bloqueado, nem o PIN certo entra e a espera não aumenta", () => {
    const { estado } = errarVezes(5);
    const ate = estado.pinBloqueadoAte["u-alberto"];
    for (const acertou of [true, false]) {
      expect(conferirPin(estado, "u-alberto", acertou, AGORA + 30_000)).toEqual({
        resultado: "bloqueado",
        mudanca: null,
        bloqueadoAte: ate,
      });
    }
  });

  it("depois da espera, o PIN certo entra e o bloqueio vencido sai", () => {
    const { estado } = errarVezes(5);
    const depois = conferirPin(estado, "u-alberto", true, AGORA + ESPERA_PIN_MS);
    expect(depois).toEqual({ resultado: "certo", mudanca: { tentativasPin: {}, pinBloqueadoAte: {} } });
  });

  it("depois da espera, um erro conta como o primeiro de novo", () => {
    const { estado } = errarVezes(5);
    const depois = conferirPin(estado, "u-alberto", false, AGORA + ESPERA_PIN_MS + 1);
    expect(depois).toMatchObject({ resultado: "errado", restantes: 4 });
    expect(depois.mudanca).toEqual({ tentativasPin: { "u-alberto": 1 }, pinBloqueadoAte: {} });
  });

  it("o acerto zera a contagem; sem contagem, nada muda", () => {
    const { estado } = errarVezes(3);
    expect(conferirPin(estado, "u-alberto", true, AGORA).mudanca).toEqual({ tentativasPin: {}, pinBloqueadoAte: {} });
    expect(conferirPin(VAZIO, "u-alberto", true, AGORA)).toEqual({ resultado: "certo", mudanca: null });
  });

  it("a contagem é por pessoa", () => {
    const alberto = errarVezes(5);
    const graziela = conferirPin(alberto.estado, "u-graziela", false, AGORA);
    expect(graziela).toMatchObject({ resultado: "errado", restantes: 4 });
    expect(graziela.mudanca?.pinBloqueadoAte).toEqual(alberto.estado.pinBloqueadoAte);
    expect(conferirPin(alberto.estado, "u-graziela", true, AGORA)).toMatchObject({ resultado: "certo" });
  });
});

describe("espera do PIN", () => {
  it("fim do bloqueio só enquanto está no futuro", () => {
    const ate = new Date(AGORA + 10_000).toISOString();
    expect(fimDoBloqueioDoPin(ate, AGORA)).toBe(AGORA + 10_000);
    expect(fimDoBloqueioDoPin(ate, AGORA + 10_000)).toBeNull();
    expect(fimDoBloqueioDoPin(undefined, AGORA)).toBeNull();
    expect(fimDoBloqueioDoPin("não é data", AGORA)).toBeNull();
  });

  it("segundos arredondados para cima, nunca 0 com o PIN bloqueado", () => {
    expect(segundosParaDesbloquear(AGORA + 60_000, AGORA)).toBe(60);
    expect(segundosParaDesbloquear(AGORA + 59_001, AGORA)).toBe(60);
    expect(segundosParaDesbloquear(AGORA + 1, AGORA)).toBe(1);
    expect(mensagemDeEsperaDoPin(AGORA + 42_500, AGORA)).toBe("Muitas tentativas. Tente de novo em 43 s.");
  });
});

describe("aviso de desbloqueio (usePinBloqueadoAte)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function montar(inicial: string | undefined) {
    vi.useFakeTimers();
    vi.setSystemTime(AGORA);
    let ate = inicial;
    const ouvintesDoMapa = new Set<() => void>();
    const avisos = vi.fn();
    const soltar = assinarDesbloqueioDoPin(
      {
        lerAte: () => ate,
        assinarMudancas: (aoMudar) => {
          ouvintesDoMapa.add(aoMudar);
          return () => ouvintesDoMapa.delete(aoMudar);
        },
      },
      avisos,
    );
    const mudar = (novo: string | undefined) => {
      ate = novo;
      for (const ouvinte of ouvintesDoMapa) ouvinte();
    };
    return { avisos, soltar, mudar, ouvintesDoMapa, lerAte: () => ate };
  }

  it("um único timer até o instante do desbloqueio, e o snapshot volta a null nele", () => {
    const fim = new Date(AGORA + ESPERA_PIN_MS).toISOString();
    const { avisos, lerAte } = montar(fim);
    expect(vi.getTimerCount()).toBe(1);
    expect(bloqueioVigente(lerAte(), Date.now())).toBe(fim);

    vi.advanceTimersByTime(ESPERA_PIN_MS - 1);
    expect(avisos).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(avisos).toHaveBeenCalledTimes(1);
    expect(bloqueioVigente(lerAte(), Date.now())).toBeNull();
    // Não é um relógio: depois do desbloqueio não sobra timer.
    expect(vi.getTimerCount()).toBe(0);
  });

  it("sem bloqueio não agenda nada; um bloqueio novo avisa na hora e agenda o fim", () => {
    const { avisos, mudar } = montar(undefined);
    expect(vi.getTimerCount()).toBe(0);
    mudar(new Date(AGORA + 5_000).toISOString());
    expect(avisos).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(5_100);
    expect(avisos).toHaveBeenCalledTimes(2);
  });

  it("bloqueio vencido ao assinar não agenda; cancelar solta o timer e a assinatura", () => {
    expect(montar(new Date(AGORA - 1).toISOString()).avisos).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();

    const { soltar, ouvintesDoMapa, avisos } = montar(new Date(AGORA + 5_000).toISOString());
    soltar();
    expect(vi.getTimerCount()).toBe(0);
    expect(ouvintesDoMapa.size).toBe(0);
    vi.advanceTimersByTime(10_000);
    expect(avisos).not.toHaveBeenCalled();
  });
});
