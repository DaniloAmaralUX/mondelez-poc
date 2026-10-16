import { gerarIconeDoApp, ICONES_DO_MANIFEST } from "@/lib/pwa/app-icon";

/** Só as variantes do manifest existem; o resto é 404. Geradas no build. */
export const dynamicParams = false;

export function generateStaticParams() {
  return ICONES_DO_MANIFEST.map(({ variante }) => ({ variante }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ variante: string }> }) {
  const { variante } = await params;
  const icone = ICONES_DO_MANIFEST.find((item) => item.variante === variante);

  if (!icone) {
    return new Response(null, { status: 404 });
  }

  return gerarIconeDoApp(icone.tamanho, icone.formato);
}
