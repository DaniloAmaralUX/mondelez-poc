import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Rotinas Operacionais",
  version: packageJson.version,
  copyright: `© ${currentYear}, Rotinas Operacionais.`,
  meta: {
    title: "Rotinas Operacionais · Protótipo",
    description: "Protótipo funcional de gestão de rotinas operacionais de manufatura.",
  },
  /**
   * App instalável (manifest, `viewport` e ícones). Manifest, `theme-color` e `ImageResponse` não leem variáveis CSS,
   * então as cores são o tema Apple (`src/styles/presets/apple.css`) convertido de OKLCH para hex.
   */
  pwa: {
    shortName: "Rotinas",
    /** `--background` do tema claro: oklch(0.9702 0.0015 286.4). Só o claro: o tema do app vem da classe (padrão claro), não do sistema. */
    backgroundLight: "#f5f5f6",
    /** `--primary` do tema claro: oklch(0.5 0.19 294). */
    primary: "#6d42c2",
    /** `--primary-foreground`: oklch(1 0 0). */
    primaryForeground: "#ffffff",
  },
  /**
   * Demonstração ligada (padrão): dica de login, SSO simulado e painel de demonstração para todos os perfis, e controles
   * de layout para todos. `NEXT_PUBLIC_DEMO=false` tira a dica, o SSO e o painel, e deixa os controles de layout só com
   * a liderança.
   */
  demo: { enabled: process.env.NEXT_PUBLIC_DEMO !== "false" },
};
