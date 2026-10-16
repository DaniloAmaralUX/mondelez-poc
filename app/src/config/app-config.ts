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
   * então as cores são o tema Linear (`src/styles/presets/linear.css`) convertido de OKLCH para hex.
   */
  pwa: {
    shortName: "Rotinas",
    /** `--background` do tema claro: oklch(1 0 0). */
    backgroundLight: "#ffffff",
    /** `--background` do tema escuro: oklch(0.145 0.008 326). */
    backgroundDark: "#0c090c",
    /** `--primary` do tema claro: oklch(0.491 0.27 292.581) (violet-700). */
    primary: "#7008e7",
    /** `--primary-foreground`: oklch(0.969 0.016 293.756) (violet-50). */
    primaryForeground: "#f5f3ff",
  },
  /**
   * Demonstração ligada (padrão): dica de login, SSO simulado e painel de demonstração para todos os perfis, e controles
   * de layout para todos. `NEXT_PUBLIC_DEMO=false` tira a dica, o SSO e o painel, e deixa os controles de layout só com
   * a liderança.
   */
  demo: { enabled: process.env.NEXT_PUBLIC_DEMO !== "false" },
};
