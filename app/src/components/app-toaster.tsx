"use client";

import { type ComponentProps, useEffect, useState } from "react";

import { Toaster } from "@/components/ui/sonner";
import { useModoToque } from "@/hooks/use-modo-toque";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

/** O foco está num aviso (Tab até "Desfazer", "Ver" ou "Fechar aviso")? */
function focoNumAviso(alvo: EventTarget | null) {
  return alvo instanceof Element && alvo.closest("[data-sonner-toaster]") !== null;
}

/**
 * Toaster do template com o tema do app e a pilha aberta quando ela depende de hover.
 *
 * - Tema: o wrapper de `ui/sonner.tsx` lê o tema do next-themes, que este app não usa (o tema vem do store de
 *   preferências e da classe no html). Sem provider, o sonner seguia o tema do sistema e, com o tablet em aparência
 *   escura e o app claro, pintava a descrição clara sobre o fundo claro do `--popover` (1,23:1).
 * - Pilha: com dois avisos seguidos, o sonner empilha o mais antigo atrás do mais novo, com opacidade 0, e só abre a
 *   pilha com mouseenter/mousemove ou Alt+T, nunca com o foco nem com o toque. No toque os avisos ficam sempre lado a
 *   lado (`expand`), e o "Desfazer" de cada um fica visível e alcançável com um toque. No notebook a pilha do template
 *   continua (abre com o mouse) e só se abre também quando o Tab entra num aviso, para o botão focado não ficar coberto
 *   pelo da frente.
 *
 * - Posição: abaixo do header do dashboard (`--avisos-topo`, src/styles/tablet.css), para um aviso nunca cobrir o
 *   avatar, o menu ou o chip de envio; sem o header (login), o padrão do sonner. `mobileOffset` vale abaixo de 600 px
 *   (Split View, celular), onde o sonner troca de regra.
 *
 * O `{...props}` do wrapper vem depois do `theme` interno, então os valores daqui vencem.
 */
const ABAIXO_DO_HEADER = { top: "var(--avisos-topo, 24px)" } as const;
const ABAIXO_DO_HEADER_ESTREITO = { top: "var(--avisos-topo, 16px)" } as const;

export function AppToaster(props: ComponentProps<typeof Toaster>) {
  const tema = usePreferencesStore((s) => s.resolvedThemeMode);
  const toque = useModoToque();
  const [focoNosAvisos, setFocoNosAvisos] = useState(false);

  useEffect(() => {
    const aoFocar = (evento: FocusEvent) => setFocoNosAvisos(focoNumAviso(evento.target));
    document.addEventListener("focusin", aoFocar);
    return () => document.removeEventListener("focusin", aoFocar);
  }, []);

  return (
    <Toaster
      offset={ABAIXO_DO_HEADER}
      mobileOffset={ABAIXO_DO_HEADER_ESTREITO}
      {...props}
      theme={tema}
      expand={toque || focoNosAvisos}
    />
  );
}
