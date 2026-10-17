import type { MetadataRoute } from "next";

import { APP_CONFIG } from "@/config/app-config";
import { ICONES_DO_MANIFEST } from "@/lib/pwa/app-icon";

/**
 * App instalável no tablet do posto (`/manifest.webmanifest`). O iPad ignora `orientation`; o Android respeita `any`
 * (retrato e paisagem).
 *
 * `start_url` é a Minha Rotina, e não a raiz: a raiz só redireciona (o `proxy` decide pelo cookie da sessão), e sem
 * rede o service worker não tem como refazer essa decisão, porque não vê o cookie. A Minha Rotina sai do cache de
 * telas do service worker (src/app/sw.ts) e, sem pessoa no posto, o SessionGate leva ao login; com rede, o `proxy`
 * faz o mesmo antes. `id` continua "/": é a identidade do app instalado, e mudar o `start_url` não reinstala nada.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: APP_CONFIG.name,
    short_name: APP_CONFIG.pwa.shortName,
    description: APP_CONFIG.meta.description,
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/dashboard/rotina",
    scope: "/",
    display: "standalone",
    orientation: "any",
    // Tema claro é o padrão no chão de fábrica: abertura e barra de status brancas, como o header.
    background_color: APP_CONFIG.pwa.backgroundLight,
    theme_color: APP_CONFIG.pwa.backgroundLight,
    categories: ["business", "productivity"],
    icons: ICONES_DO_MANIFEST.map(({ variante, tamanho, purpose }) => ({
      src: `/icons/${variante}`,
      sizes: `${tamanho}x${tamanho}`,
      type: "image/png",
      purpose,
    })),
  };
}
