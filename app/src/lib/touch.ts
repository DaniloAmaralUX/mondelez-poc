/**
 * Escala de toque do chão de fábrica (doc 09 §8): alvos de 56 px e texto de 16 a 18 px.
 * Os componentes em `components/ui` não são editados; a escala é aplicada onde são usados.
 */
export const toque = {
  botao: "h-touch gap-2 px-5 text-base",
  botaoIcone: "size-touch",
  campo: "h-touch px-4 text-lg md:text-lg",
  menu: "h-touch gap-3 px-3 text-base [&_svg]:size-5",
} as const;
