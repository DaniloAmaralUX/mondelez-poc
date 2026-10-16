import { gerarIconeDoApp } from "@/lib/pwa/app-icon";

/** Ícone da tela de início do iPad (`<link rel="apple-touch-icon">`, gerado pela convenção do Next). */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return gerarIconeDoApp(size.width, "apple");
}
