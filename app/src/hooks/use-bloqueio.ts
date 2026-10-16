"use client";

import { useEffect } from "react";

import { chaveTurno, turnoAtual } from "@/domain/turno";
import {
  CHAVE_OCULTO,
  INATIVIDADE_MS,
  OCULTO_MS,
  ocultoTempoDemais,
  restanteDeInatividade,
  viradaDeTurno,
} from "@/lib/sessao/bloqueio";
import { useAgora, useSessionHydrated, useSessionStore } from "@/stores/session/session-store";

import { modoToque } from "./use-modo-toque";

export { INATIVIDADE_MS, OCULTO_MS };

/** Toque, tecla ou rolagem contam como atividade (capturados na janela, antes de qualquer componente). */
const EVENTOS_DE_ATIVIDADE = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
const OPCOES_DE_ESCUTA: AddEventListenerOptions = { capture: true, passive: true };

function lerOcultoEm(): number | null {
  try {
    const valor = Number(window.localStorage.getItem(CHAVE_OCULTO));
    return Number.isFinite(valor) && valor > 0 ? valor : null;
  } catch {
    return null;
  }
}

function gravarOcultoEm(instante: number | null) {
  try {
    if (instante === null) window.localStorage.removeItem(CHAVE_OCULTO);
    else window.localStorage.setItem(CHAVE_OCULTO, String(instante));
  } catch {
    // Sem localStorage (modo privado antigo): vale só o bloqueio por visibilidade sem recarga.
  }
}

/**
 * Bloqueio automático do tablet compartilhado ("Quem está no posto?"):
 * - inatividade: `INATIVIDADE_MS` (5 min) sem pointerdown, keydown, wheel ou touchstart;
 * - oculto: ao voltar de segundo plano depois de mais de `OCULTO_MS` (2 min), inclusive se a página foi recarregada;
 * - turno: quando o turno simulado passa do turno em que a pessoa entrou.
 * Inatividade e segundo plano só valem no toque (`modoToque`, lido na hora de bloquear): o notebook da liderança é
 * pessoal e fica como na v0.2 (docs/12 §3.1 e §3.2), sem PIN ao trocar de aba do navegador. A virada de turno vale em
 * qualquer aparelho. O override `html[data-density=touch]` da demonstração liga os dois no notebook.
 * Sem pessoa logada ou já bloqueado, nada acontece (regra em `aplicarBloqueio`). Tempos de inatividade e de segundo
 * plano são reais (a pessoa está parada de verdade), não do relógio da demo. Montado uma vez, no layout do dashboard.
 */
export function useBloqueioAutomatico(): void {
  const hidratado = useSessionHydrated();
  const logado = useSessionStore((s) => s.usuarioId !== null);
  const turnoDaSessao = useSessionStore((s) => s.turnoDaSessao);
  const bloquear = useSessionStore((s) => s.bloquear);
  const chaveAtual = chaveTurno(turnoAtual(useAgora()));

  // Inatividade: um timeout reagendado só quando vence (registrar atividade é só guardar o instante).
  useEffect(() => {
    if (!hidratado || !logado) return;
    let ultimaAtividade = Date.now();
    let timer: ReturnType<typeof setTimeout>;

    const registrarAtividade = () => {
      ultimaAtividade = Date.now();
    };
    const verificar = () => {
      const restante = restanteDeInatividade(ultimaAtividade, Date.now());
      if (restante > 0) {
        timer = setTimeout(verificar, restante);
        return;
      }
      if (modoToque()) bloquear("inatividade");
      ultimaAtividade = Date.now();
      timer = setTimeout(verificar, INATIVIDADE_MS);
    };

    timer = setTimeout(verificar, INATIVIDADE_MS);
    for (const evento of EVENTOS_DE_ATIVIDADE) window.addEventListener(evento, registrarAtividade, OPCOES_DE_ESCUTA);
    return () => {
      clearTimeout(timer);
      for (const evento of EVENTOS_DE_ATIVIDADE) {
        window.removeEventListener(evento, registrarAtividade, OPCOES_DE_ESCUTA);
      }
    };
  }, [hidratado, logado, bloquear]);

  // Segundo plano: tela apagada, outro app, aba oculta, ou a página descartada e recarregada.
  useEffect(() => {
    if (!hidratado) return;
    const salvo = lerOcultoEm();
    if (salvo !== null && ocultoTempoDemais(salvo, Date.now()) && modoToque()) bloquear("oculto");
    gravarOcultoEm(null);

    const aoMudarVisibilidade = () => {
      if (document.visibilityState === "hidden") {
        gravarOcultoEm(Date.now());
        return;
      }
      const desde = lerOcultoEm();
      gravarOcultoEm(null);
      if (desde !== null && ocultoTempoDemais(desde, Date.now()) && modoToque()) bloquear("oculto");
    };
    const aoSair = () => {
      if (lerOcultoEm() === null) gravarOcultoEm(Date.now());
    };

    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    window.addEventListener("pagehide", aoSair);
    return () => {
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      window.removeEventListener("pagehide", aoSair);
    };
  }, [hidratado, bloquear]);

  // Virada de turno no relógio da demo (o ticker único avisa na virada do minuto e quando o relógio muda).
  useEffect(() => {
    if (hidratado && viradaDeTurno(logado, turnoDaSessao, chaveAtual)) bloquear("turno");
  }, [hidratado, logado, turnoDaSessao, chaveAtual, bloquear]);
}
