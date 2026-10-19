import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Rotinas Operacionais",
  version: packageJson.version,
  /** Protótipo para a Mondelēz International (v0.6, docs/19): o nome da empresa sempre com o mácron e completo. */
  company: "Mondelēz International",
  copyright: `© ${currentYear} · Protótipo para a Mondelēz International`,
  meta: {
    title: "Rotinas Operacionais · Mondelēz International",
    description: "Protótipo funcional de gestão de rotinas operacionais de manufatura.",
  },
  /**
   * App instalável (manifest, `viewport` e ícones). Manifest, `theme-color` e `ImageResponse` não leem variáveis CSS,
   * então as cores são as do tema Mondelēz (`src/styles/presets/mondelez.css`, v0.6), em hex.
   */
  pwa: {
    shortName: "Rotinas",
    /** `--background` do tema claro, o creme do site da Mondelēz. Só o claro: o tema do app vem da classe (padrão claro), não do sistema. */
    backgroundLight: "#faf3e7",
    /** `--primary` do tema claro: o roxo do logo (MDLZ World, #4F2170). */
    primary: "#4f2170",
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
