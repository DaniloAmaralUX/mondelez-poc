import { createSerwistRoute, type InjectManifestOptions } from "@serwist/turbopack";

import { ICONES_DO_MANIFEST } from "@/lib/pwa/app-icon";
import { PAGINA_OFFLINE } from "@/lib/pwa/regras-do-cache";

import { createHash } from "node:crypto";

type TransformacaoDoManifesto = NonNullable<InjectManifestOptions["manifestTransforms"]>[number];

/**
 * Endereços gerados por rotas do Next (não são arquivos do `.next/static`) que entram no precache: a página offline,
 * o manifest, os ícones do manifest, o apple-icon e o favicon. O navegador pede o favicon e o apple-icon com um hash na
 * query, que o service worker ignora (`PARAMETROS_IGNORADOS_NO_PRECACHE`).
 */
const ENDERECOS_DO_APP = [
  PAGINA_OFFLINE,
  "/manifest.webmanifest",
  ...ICONES_DO_MANIFEST.map(({ variante }) => `/icons/${variante}`),
  "/apple-icon",
  "/favicon.ico",
];

/**
 * A revisão dessas entradas é um hash do resto do manifesto, que muda a cada build (os nomes dos chunks e a pasta
 * `.next/static/<buildId>`): a página offline guardada sempre aponta para os chunks do precache. Calculada na hora de
 * gerar o sw.js, e não ao carregar o módulo, porque o `BUILD_ID` só existe depois da coleta das rotas.
 */
const comAsEntradasDoApp: TransformacaoDoManifesto = (entradas) => {
  const revisao = createHash("sha256")
    .update(
      entradas
        .map(({ url, revision }) => `${url} ${revision ?? ""}`)
        .sort()
        .join("\n"),
    )
    .digest("hex")
    .slice(0, 16);
  return {
    manifest: [...entradas, ...ENDERECOS_DO_APP.map((url) => ({ url, revision: revisao, size: 0 }))],
    warnings: [],
  };
};

/**
 * `/serwist/sw.js` (e o `.map`), gerados no build pelo `@serwist/turbopack` a partir de `src/app/sw.ts`. O Turbopack
 * ainda não aceita plugins, então o Serwist usa um Route Handler estático. Fica fora do matcher do `proxy`.
 */
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: "src/app/sw.ts",
  // esbuild nativo em qualquer sistema (o padrão fora do Windows é o esbuild-wasm, que não está instalado).
  useNativeEsbuild: true,
  // Os padrões do Serwist para o Next e, das fontes, só as pré-carregadas (Inter e Geist Mono, `.p.` no nome): as
  // outras famílias do seletor do template ficam com o cache de fontes do `defaultCache`.
  globPatterns: [
    ".next/static/**/*.{js,css,html,ico,apng,png,avif,jpg,jpeg,jfif,pjpeg,pjp,gif,svg,webp,json,webmanifest}",
    ".next/static/media/*.p.*.woff2",
  ],
  manifestTransforms: [comAsEntradasDoApp],
});
