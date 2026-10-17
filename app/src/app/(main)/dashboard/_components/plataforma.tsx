"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

import { usePathname, useRouter } from "next/navigation";
import { useOffline } from "next/offline";

import { useSerwist } from "@serwist/turbopack/react";
import { toast } from "sonner";

import { localRepository } from "@/data/repository";
import type { Perfil } from "@/domain/types";
import { AVISO_SEM_REDE } from "@/lib/pwa/regras-do-cache";
import { assinarServidor, semRedeNoNavegador, servidorResponde, sondarServidor } from "@/lib/pwa/servidor";
import { hrefDaTarefa } from "@/lib/rotas";
import {
  assinarMinuto,
  definirConfirmacaoDoEnvio,
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
 *
 * Roda também a cada troca de tela. O prefetch completo só busca os segmentos que não estão na tela atual (o Next 16.4
 * compara a rota com a árvore em uso, `diffRouteTreeAgainstCurrent` em segment-cache/scheduler.js): pedido na própria
 * Minha Rotina, ele não guardava nada, e sem rede o "Registrar" do checklist ficava parado esperando a conexão para
 * voltar a ela. Repetido ao sair da Rotina, ela entra no cache; o que já está no cache não gera pedido. A Rotina aberta
 * no início (ou antes da queda) fica no cache de navegação por `staleTimes.dynamic` (next.config.mjs).
 */
function usePrefetchDoTablet(ativo: boolean) {
  const router = useRouter();
  const pathname = usePathname();
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
    // As rotas que não são a tela atual: a atual o prefetch não guarda (ver acima).
    for (const href of rotas) if (href !== pathname) buscar(href);
    return () => {
      encerrado = true;
    };
  }, [ativo, rotas, router, pathname]);

  useTelasNoAparelho(ativo, rotas);
}

/**
 * O HTML das mesmas telas no service worker (src/app/sw.ts), para elas abrirem sem rede depois de recarregar ou de
 * abrir o app instalado, mesmo as que a pessoa ainda não abriu neste build. O service worker só busca o que ainda não
 * guardou (`aquecimento` em lib/pwa/regras-do-cache.ts). Sem service worker (`next dev`), `serwist` é null.
 */
function useTelasNoAparelho(ativo: boolean, rotas: readonly string[]) {
  const { serwist } = useSerwist();

  useEffect(() => {
    if (!ativo || !serwist) return;
    void serwist.messageSW({ type: "CACHE_URLS", payload: { urlsToCache: rotas } }).catch(() => undefined);
  }, [ativo, rotas, serwist]);
}

/**
 * Avisos da pessoa anterior saem quando o tablet troca de pessoa (também por outra aba) ou bloqueia: quem chega não lê
 * nem toca o "Desfazer" de outra pessoa (V03-SEC-03; os desfazer do store também recusam). Na assinatura do store, e
 * não num efeito do React, para os avisos saírem dentro da própria mudança, antes do aviso que a tela mostra logo
 * depois ("Agora com Renata"). Só depois da carga do IndexedDB: a pessoa que volta com a sessão salva não é uma troca.
 */
function useAvisosSoDaPessoaAtual(ativo: boolean) {
  useEffect(() => {
    if (!ativo) return;
    return useSessionStore.subscribe((s, anterior) => {
      if (s.usuarioId !== anterior.usuarioId || (s.bloqueado && !anterior.bloqueado)) toast.dismiss();
    });
  }, [ativo]);
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

/**
 * O servidor responde (src/lib/pwa/servidor.ts)? Com o service worker, a falha de rede não chega à página nem ao
 * `useOffline` do Next, e `navigator.onLine` segue `true` com o Wi-Fi ligado e o servidor fora. Sonda ao abrir, quando
 * o Wi-Fi volta, quando o service worker avisa que um pedido não chegou (`AVISO_SEM_REDE`) e quando o Next detecta a
 * queda; e confirma cada envio da fila (`definirConfirmacaoDoEnvio`), que só vira "sincronizado" com o servidor no ar.
 */
function useServidorNoAr(offlineNoNext: boolean): boolean {
  const responde = useSyncExternalStore(assinarServidor, servidorResponde, conectadoNoServidor);

  useEffect(() => {
    // Fica instalada depois de sair do dashboard: um envio que termina já no login também confere o servidor.
    definirConfirmacaoDoEnvio(sondarServidor);
    void sondarServidor();
    const aoVoltarARede = () => void sondarServidor();
    const aoAvisoDoServiceWorker = (evento: MessageEvent) => {
      if ((evento.data as { type?: unknown } | null)?.type === AVISO_SEM_REDE) void sondarServidor();
    };
    window.addEventListener("online", aoVoltarARede);
    window.addEventListener("offline", semRedeNoNavegador);
    navigator.serviceWorker?.addEventListener("message", aoAvisoDoServiceWorker);
    return () => {
      window.removeEventListener("online", aoVoltarARede);
      window.removeEventListener("offline", semRedeNoNavegador);
      navigator.serviceWorker?.removeEventListener("message", aoAvisoDoServiceWorker);
    };
  }, []);

  useEffect(() => {
    if (offlineNoNext) void sondarServidor();
  }, [offlineNoNext]);

  return responde;
}

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
 *   eventos online/offline + a sondagem do servidor (`useServidorNoAr`) → `definirRedeNavegador`; ao voltar a rede o
 *   store envia a fila sozinho;
 * - sincronização ao abrir, ao voltar o foco e a cada minuto (no ticker único do relógio);
 * - aviso entre abas (BroadcastChannel → reler o IndexedDB);
 * - prefetch completo das rotas do tablet com rede (`usePrefetchDoTablet`) e o HTML delas no service worker
 *   (`useTelasNoAparelho`);
 * - Wake Lock de tela enquanto há pessoa no posto e o tablet não está bloqueado;
 * - avisos (toasts) fechados na troca de pessoa e no bloqueio (`useAvisosSoDaPessoaAtual`).
 */
export function Plataforma() {
  const hidratado = useSessionHydrated();
  const offlineNoNext = useOffline();
  const conectado = useSyncExternalStore(assinarConexao, conectadoNoNavegador, conectadoNoServidor);
  const servidorNoAr = useServidorNoAr(offlineNoNext);
  const comRede = conectado && !offlineNoNext && servidorNoAr;
  const logado = useSessionStore((s) => s.usuarioId !== null);
  const emUso = useSessionStore((s) => s.usuarioId !== null && !s.bloqueado);
  const definirRedeNavegador = useSessionStore((s) => s.definirRedeNavegador);
  const tentarEnviarDeNovo = useSessionStore((s) => s.tentarEnviarDeNovo);

  useEffect(() => {
    definirRedeNavegador(comRede ? "online" : "offline");
  }, [comRede, definirRedeNavegador]);

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

  usePrefetchDoTablet(hidratado && logado && comRede);
  useTelaAcesa(hidratado && emUso);
  useAvisosSoDaPessoaAtual(hidratado);

  return null;
}
