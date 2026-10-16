import { ImageResponse } from "next/og";

import { APP_CONFIG } from "@/config/app-config";

/**
 * Traço do ícone `Command` do lucide (viewBox 24, traço 2): a mesma marca que o template usa na sidebar e no painel
 * do login, aqui sobre o `--primary` do tema Linear. Gerado por código para não versionar binários.
 */
const GLIFO_COMMAND = "M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3";

/**
 * - `padrao`: quadrado de cantos arredondados com fundo transparente fora dele (navegador, área de trabalho).
 * - `mascaravel`: fundo até a borda e glifo dentro da zona segura (círculo de 80 % do lado), para o Android recortar.
 * - `apple`: fundo até a borda; o iPadOS aplica a própria máscara e pinta de preto o que for transparente.
 */
export type FormatoDoIcone = "padrao" | "mascaravel" | "apple";

const PROPORCAO_DO_GLIFO: Record<FormatoDoIcone, number> = {
  padrao: 0.6,
  // O desenho ocupa 20/24 da caixa; a 0,5 do lado a diagonal fica em ~0,3 do lado, dentro do raio seguro de 0,4.
  mascaravel: 0.5,
  apple: 0.6,
};

/** Ícones do manifest, servidos por `src/app/icons/[variante]/route.ts` em `/icons/<variante>`. */
export const ICONES_DO_MANIFEST = [
  { variante: "icon-192", tamanho: 192, formato: "padrao", purpose: "any" },
  { variante: "icon-512", tamanho: 512, formato: "padrao", purpose: "any" },
  { variante: "maskable-192", tamanho: 192, formato: "mascaravel", purpose: "maskable" },
  { variante: "maskable-512", tamanho: 512, formato: "mascaravel", purpose: "maskable" },
] as const satisfies ReadonlyArray<{
  variante: string;
  tamanho: number;
  formato: FormatoDoIcone;
  purpose: "any" | "maskable";
}>;

export function gerarIconeDoApp(tamanho: number, formato: FormatoDoIcone) {
  const lado = Math.round(tamanho * PROPORCAO_DO_GLIFO[formato]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: APP_CONFIG.pwa.primary,
        borderRadius: formato === "padrao" ? Math.round(tamanho * 0.225) : 0,
      }}
    >
      <svg
        width={lado}
        height={lado}
        viewBox="0 0 24 24"
        fill="none"
        stroke={APP_CONFIG.pwa.primaryForeground}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        // Sem `<title>`: o Satori desenha o texto dele dentro do PNG. O ícone é decorativo; o nome vem do manifest.
        aria-hidden="true"
      >
        <path d={GLIFO_COMMAND} />
      </svg>
    </div>,
    { width: tamanho, height: tamanho },
  );
}
