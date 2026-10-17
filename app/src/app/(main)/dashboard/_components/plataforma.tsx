"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

import { useRouter } from "next/navigation";
import { useOffline } from "next/offline";

import { localRepository } from "@/data/repository";
import type { Perfil } from "@/domain/types";
import { hrefDaTarefa } from "@/lib/rotas";
import {
  assinarMinuto,
  ouvirOutrasAbas,
  useSessionHydrated,
  useSessionStore,
  useUsuarioAtual,
} from "@/stores/session/session-store";

type OpcoesDePrefetch = NonNullable<Parameters<ReturnType<typeof useRouter>["prefetch"]>[1]>;
/**
 * `PrefetchKind.FULL` ("full"): a rota inteira, como `<Link prefetch>`. As telas do dashboard são dinâmicas e não têm
 * `loading.js`; com o prefetch padrão nada seria guardado. O enum não é exportado por "next/navigation".
 */
const PREFETCH_COMPLETO = "full" as OpcoesDePrefetch["kind"];
const ROTAS_FIXAS = ["/dashboard/rotina", "/dashboard/alertas", "/dashboard/tarefas"] as const;

/** Minha Rotina, Alertas, Tarefas e as telas das rotinas do posto para o perfil (checklists e rotas próprias). */
function rotasDoTablet(postoId: string | undefined, perfil: Perfil | undefined): string[] {
  const dasRotinas = localRepository
    .templates()
    .filter((t) => (!postoId || t.postoIds.includes(postoId)) && (!perfil || t.perfis.includes(perfil)))
    .map((t) => hrefDaTarefa(t).split("#")[0] ?? "")
    .filter((href) => href.startsWith("/dashboard/"));
  return [...new Set([...ROTAS_FIXAS, ...dasRotinas])];
}

/**
 * Prefetch completo das rotas do tablet sem depender de um link visível: no retrato a sidebar é um Sheet fechado e o
 * menu da pessoa só existe aberto, então nenhum `<Link prefetch>` de Alertas ou Tarefas chegava a montar e, sem rede,
 * a navegação ficava esperando a conexão. Roda com pessoa no posto e rede; de novo quando a rede volta (`ativo` vira
 * true) e quando o Next avisa que o que guardou venceu (`onInvalidate`). Só em produção: o `next dev` não faz prefetch.
 */
function usePrefetchDoTablet(ativo: boolean) {
  const router = useRouter();
  const postoId = useSessionStore((s) => s.contexto?.postoId);
  const perfil = useUsuarioAtual()?.perfil;
  const rotas = useMemo(() => rotasDoTablet(postoId, perfil), [postoId, perfil]);

  useEffect(() => {
    if (!ativo) return;
    let encerrado = false;
    const buscar = (href: string) => {
      if (encerrado || !navigator.onLine) return;
      router.prefetch(href, { kind: PREFETCH_COMPLETO, onInvalidate: () => buscar(href) });
    };
    for (const href of rotas) buscar(href);
    return () => {
      encerrado = true;
    };
  }, [ativo, rotas, router]);
}

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
 * - prefetch completo das rotas do tablet com rede (`usePrefetchDoTablet`);
 * - Wake Lock de tela enquanto há pessoa no posto e o tablet não está bloqueado.
 */
export function Plataforma() {
  const hidratado = useSessionHydrated();
  const offlineNoNext = useOffline();
  const conectado = useSyncExternalStore(assinarConexao, conectadoNoNavegador, conectadoNoServidor);
  const logado = useSessionStore((s) => s.usuarioId !== null);
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

  usePrefetchDoTablet(hidratado && logado && conectado && !offlineNoNext);
  useTelaAcesa(hidratado && emUso);

  return null;
}
