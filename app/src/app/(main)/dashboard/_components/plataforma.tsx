"use client";

import { useEffect, useSyncExternalStore } from "react";

import { useOffline } from "next/offline";

import { assinarMinuto, ouvirOutrasAbas, useSessionHydrated, useSessionStore } from "@/stores/session/session-store";

function assinarConexao(aoMudar: () => void) {
  window.addEventListener("online", aoMudar);
  window.addEventListener("offline", aoMudar);
  return () => {
    window.removeEventListener("online", aoMudar);
    window.removeEventListener("offline", aoMudar);
  };
}

const conectadoNoNavegador = () => navigator.onLine;
// No servidor e na hidratação, "online": a rede real só é lida depois de montar.
const conectadoNoServidor = () => true;

/** Mantém a tela acesa enquanto alguém usa o tablet; o navegador solta o lock ao ocultar, então volta a pedir. */
function useTelaAcesa(ativo: boolean) {
  useEffect(() => {
    if (!ativo || !("wakeLock" in navigator)) return;
    let sentinela: WakeLockSentinel | null = null;
    let encerrado = false;

    const pedir = async () => {
      if (document.visibilityState !== "visible" || (sentinela && !sentinela.released)) return;
      try {
        const obtido = await navigator.wakeLock.request("screen");
        if (encerrado) await obtido.release();
        else sentinela = obtido;
      } catch {
        // Sem suporte, sem HTTPS ou economia de bateria: a tela apaga como de costume.
      }
    };
    const aoMudarVisibilidade = () => {
      if (document.visibilityState === "visible") void pedir();
    };

    void pedir();
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    return () => {
      encerrado = true;
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      sentinela?.release().catch(() => undefined);
      sentinela = null;
    };
  }, [ativo]);
}

/**
 * Serviços do tablet, sem interface (montado uma vez no layout do dashboard):
 * - conectividade: `useOffline` do Next (falha real de rede, com nova tentativa automática) + `navigator.onLine` e
 *   eventos online/offline → `definirRedeNavegador`; ao voltar a rede o store envia a fila sozinho;
 * - sincronização ao abrir, ao voltar o foco e a cada minuto (no ticker único do relógio);
 * - aviso entre abas (BroadcastChannel → reler o IndexedDB);
 * - Wake Lock de tela enquanto há pessoa no posto e o tablet não está bloqueado.
 */
export function Plataforma() {
  const hidratado = useSessionHydrated();
  const offlineNoNext = useOffline();
  const conectado = useSyncExternalStore(assinarConexao, conectadoNoNavegador, conectadoNoServidor);
  const emUso = useSessionStore((s) => s.usuarioId !== null && !s.bloqueado);
  const definirRedeNavegador = useSessionStore((s) => s.definirRedeNavegador);
  const tentarEnviarDeNovo = useSessionStore((s) => s.tentarEnviarDeNovo);

  useEffect(() => {
    definirRedeNavegador(offlineNoNext || !conectado ? "offline" : "online");
  }, [offlineNoNext, conectado, definirRedeNavegador]);

  useEffect(() => {
    if (!hidratado) return;
    tentarEnviarDeNovo();
    const aoVoltar = () => {
      if (document.visibilityState === "visible") tentarEnviarDeNovo();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("focus", aoVoltar);
    const soltarMinuto = assinarMinuto(tentarEnviarDeNovo);
    return () => {
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("focus", aoVoltar);
      soltarMinuto();
    };
  }, [hidratado, tentarEnviarDeNovo]);

  useEffect(() => ouvirOutrasAbas(), []);

  useTelaAcesa(hidratado && emUso);

  return null;
}
