import {
  Carlito,
  DM_Sans,
  Figtree,
  Geist,
  Geist_Mono,
  Inter,
  JetBrains_Mono,
  Lora,
  Merriweather,
  Noto_Sans,
  Noto_Serif,
  Nunito_Sans,
  Outfit,
  Playfair_Display,
  Public_Sans,
  Raleway,
  Roboto,
  Roboto_Slab,
} from "next/font/google";
import localFont from "next/font/local";

/*
 * Pré-carregadas em toda rota só a fonte do tema Mondelēz (Carlito, abaixo) e a mono do tema (Geist Mono); a Inter do
 * tema Apple saiu da pré-carga na v0.6. As outras famílias do
 * seletor de fontes do template ficam com `preload: false`: continuam declaradas (mesmas variáveis CSS) e só baixam
 * quando alguém as escolhe. Poupa a rede instável do chão de fábrica.
 */

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  preload: false,
});

/*
 * Fonte do tema Mondelēz (padrão, v0.6, docs/19): Carlito, a versão aberta (SIL OFL) com as mesmas métricas da Calibri,
 * a alternativa que o brand book da Mondelēz indica para sites e intranet. Fica fora do seletor de fontes: entra pela
 * pilha do tema (src/styles/tema-mondelez.css), depois das fontes da marca instaladas no aparelho.
 */
const carlito = Carlito({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-carlito",
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  preload: false,
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  preload: false,
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  preload: false,
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  preload: false,
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  preload: false,
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
  preload: false,
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  preload: false,
});

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  preload: false,
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  preload: false,
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  preload: false,
});

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  variable: "--font-noto-serif",
  preload: false,
});

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  variable: "--font-roboto-slab",
  preload: false,
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merriweather",
  preload: false,
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  preload: false,
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  preload: false,
});

/*
 * Mesma declaração de `GeistPixelSquare` em `geist/font/pixel`, só com `preload: false`. Importar daquele módulo
 * pré-carregava as cinco variantes Pixel (Square, Grid, Circle, Triangle, Line) em toda rota, e o pacote não aceita
 * opções.
 */
const geistPixelSquare = localFont({
  src: "../../../node_modules/geist/dist/fonts/geist-pixel/GeistPixel-Square.woff2",
  variable: "--font-geist-pixel-square",
  weight: "500",
  preload: false,
  fallback: [
    "Geist Mono",
    "ui-monospace",
    "SFMono-Regular",
    "Roboto Mono",
    "Menlo",
    "Monaco",
    "Liberation Mono",
    "DejaVu Sans Mono",
    "Courier New",
    "monospace",
  ],
  adjustFontFallback: false,
});

export const fontRegistry = {
  geist: {
    label: "Geist",
    font: geist,
  },
  inter: {
    label: "Inter",
    font: inter,
  },
  notoSans: {
    label: "Noto Sans",
    font: notoSans,
  },
  nunitoSans: {
    label: "Nunito Sans",
    font: nunitoSans,
  },
  figtree: {
    label: "Figtree",
    font: figtree,
  },
  roboto: {
    label: "Roboto",
    font: roboto,
  },
  raleway: {
    label: "Raleway",
    font: raleway,
  },
  dmSans: {
    label: "DM Sans",
    font: dmSans,
  },
  publicSans: {
    label: "Public Sans",
    font: publicSans,
  },
  outfit: {
    label: "Outfit",
    font: outfit,
  },
  geistMono: {
    label: "Geist Mono",
    font: geistMono,
  },
  geistPixelSquare: {
    label: "Geist Pixel Square",
    font: geistPixelSquare,
  },
  jetBrainsMono: {
    label: "JetBrains Mono",
    font: jetBrainsMono,
  },
  notoSerif: {
    label: "Noto Serif",
    font: notoSerif,
  },
  robotoSlab: {
    label: "Roboto Slab",
    font: robotoSlab,
  },
  merriweather: {
    label: "Merriweather",
    font: merriweather,
  },
  lora: {
    label: "Lora",
    font: lora,
  },
  playfairDisplay: {
    label: "Playfair Display",
    font: playfairDisplay,
  },
} as const;

export type FontKey = keyof typeof fontRegistry;

export const fontKeys = Object.keys(fontRegistry) as FontKey[];

export const fontVars = [carlito.variable, ...Object.values(fontRegistry).map(({ font }) => font.variable)].join(" ");

export const fontOptions = fontKeys.map((key) => ({
  key,
  label: fontRegistry[key].label,
}));
