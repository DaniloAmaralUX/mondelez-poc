import type { MetadataRoute } from "next";

import { APP_CONFIG } from "@/config/app-config";
import { ICONES_DO_MANIFEST } from "@/lib/pwa/app-icon";

/**
 * App instalável no tablet do posto (`/manifest.webmanifest`). `start_url` é a raiz: o `proxy` manda para a Minha Rotina
 * ou para o login. O iPad ignora `orientation`; o Android respeita `any` (retrato e paisagem).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: APP_CONFIG.name,
    short_name: APP_CONFIG.pwa.shortName,
    description: APP_CONFIG.meta.description,
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/",
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
