"use client";

import * as React from "react";

import { useSidebar } from "@/components/ui/sidebar";
import { setClientCookie } from "@/lib/cookie.client";

/** Cookie em que o template guarda a sidebar fixa aberta/fechada (lido pelo layout do dashboard no servidor). */
const COOKIE_DA_SIDEBAR = "sidebar_state";

/**
 * Modo foco do checklist (docs/12 §3.2): enquanto o operador preenche, a sidebar fica recolhida para o formulário ter
 * a largura toda (no tablet em paisagem, 272 px a mais). Ao sair do preenchimento (registrou, voltou, trocou de
 * tarefa), a sidebar volta como estava.
 *
 * - Fixa (notebook, tablet em paisagem): `setOpen(false)` e, na saída, `setOpen(true)` só se ela estava aberta.
 * - Sheet (abaixo de 1024 px): `setOpenMobile(false)` garante o Sheet fechado. Não é reaberto na saída: um menu abrindo
 *   sozinho por cima da Minha Rotina seria uma surpresa.
 * - O operador pode abrir o menu pelo botão do header a qualquer momento; o modo foco não trava nada.
 *
 * O `setOpen` do template grava o cookie `sidebar_state`. Para a página fechada ou descartada no meio do preenchimento
 * (comum no iPad em segundo plano) não deixar a sidebar recolhida em todas as telas da próxima vez, o cookie volta a
 * "aberta" ao ocultar a página, sem mexer na sidebar da tela. Se a página continuar, o modo foco segue igual.
 */
export function useModoFoco(ativo: boolean) {
  const { open, setOpen, setOpenMobile } = useSidebar();
  // Lidos no efeito sem virar dependência: o setOpen do template muda de identidade a cada abrir/fechar e reexecutar o
  // efeito restauraria e recolheria a sidebar em sequência.
  const atual = React.useRef({ open, setOpen, setOpenMobile });
  React.useEffect(() => {
    atual.current = { open, setOpen, setOpenMobile };
  });

  React.useEffect(() => {
    if (!ativo) return;
    const estavaAberta = atual.current.open;
    if (estavaAberta) atual.current.setOpen(false);
    atual.current.setOpenMobile(false);
    if (!estavaAberta) return;

    // 7 dias, como o cookie do template.
    const lembrarAberta = () => setClientCookie(COOKIE_DA_SIDEBAR, "true", 7);
    const aoMudarVisibilidade = () => {
      if (document.visibilityState === "hidden") lembrarAberta();
    };
    window.addEventListener("pagehide", lembrarAberta);
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    return () => {
      window.removeEventListener("pagehide", lembrarAberta);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      atual.current.setOpen(true);
    };
  }, [ativo]);
}
