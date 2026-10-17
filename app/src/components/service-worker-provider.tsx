"use client";

import { type ReactNode, useEffect } from "react";

import { SerwistProvider } from "@serwist/turbopack/react";

/** O service worker só existe no build de produção: no `next dev` ele esconderia as mudanças atrás do cache. */
const SEM_SERVICE_WORKER = process.env.NODE_ENV !== "production";

/**
 * Registro do service worker (`/serwist/sw.js`, src/app/sw.ts), montado uma vez no layout raiz para valer também no
 * login, que é a primeira tela de um tablet novo. O `SerwistProvider` registra depois do `load` e não desenha nada
 * (no servidor e na hidratação é só o contexto), então o HTML é o mesmo dos dois lados.
 *
 * - `reloadOnOnline={false}`: o padrão recarrega a página quando a rede volta, o que interromperia um checklist; a
 *   fila e o router do Next já retomam sozinhos (`<Plataforma />`, `useOffline`).
 * - `cacheOnNavigation`: a cada navegação no cliente, pede ao service worker o HTML da tela, para ela abrir sem rede
 *   depois de recarregar (só busca o que ainda não está guardado). O `?alerta=` dos Alertas não vira entrada nova: a
 *   chave do cache ignora os parâmetros só do cliente (`chaveDaTela` em lib/pwa/regras-do-cache.ts).
 * - No `next dev`, além de não registrar, tira um service worker que tenha ficado de um `next start` na mesma porta.
 *   Para testar o service worker, use o build de produção (`npm run build && npm run start`): o Serwist gera o sw.js
 *   também no dev, mas sem precache e só com rede, então não há offline para ver ali.
 */
export function ServiceWorkerProvider({ children }: { readonly children: ReactNode }) {
  useEffect(() => {
    if (!SEM_SERVICE_WORKER || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker
      .getRegistrations()
      .then((registros) => Promise.all(registros.map((registro) => registro.unregister())))
      .catch(() => undefined);
  }, []);

  return (
    <SerwistProvider swUrl="/serwist/sw.js" disable={SEM_SERVICE_WORKER} reloadOnOnline={false} cacheOnNavigation>
      {children}
    </SerwistProvider>
  );
}
