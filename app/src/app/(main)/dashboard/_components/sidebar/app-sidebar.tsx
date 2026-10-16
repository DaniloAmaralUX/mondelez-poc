"use client";

import * as React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Command } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { paraUsuarioDoShell } from "@/data/users";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";
import { useUsuarioAtual } from "@/stores/session/session-store";

import { NavMain, useFecharSidebarMovel } from "./nav-main";
import { NavUser } from "./nav-user";
import { SupportCard } from "./support-card";

const PONTEIRO_GROSSO = "(pointer: coarse)";

function assinarPonteiro(aoMudar: () => void) {
  const mql = window.matchMedia(PONTEIRO_GROSSO);
  mql.addEventListener("change", aoMudar);
  return () => mql.removeEventListener("change", aoMudar);
}

/** Toque como ponteiro principal. No servidor e na hidratação vale `false`, igual ao HTML gerado. */
function usePonteiroGrosso() {
  return React.useSyncExternalStore(
    assinarPonteiro,
    () => window.matchMedia(PONTEIRO_GROSSO).matches,
    () => false,
  );
}

/** Fecha o Sheet da sidebar quando a rota muda por fora dela (busca, aviso de alerta, botões da tela). */
function useFecharSidebarAoNavegar() {
  const path = usePathname();
  const { setOpenMobile } = useSidebar();
  const anterior = React.useRef(path);

  React.useEffect(() => {
    if (anterior.current === path) return;
    anterior.current = path;
    setOpenMobile(false);
  }, [path, setOpenMobile]);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.values.sidebar_variant,
      sidebarCollapsible: s.values.sidebar_collapsible,
      isSynced: s.isSynced,
    })),
  );

  const usuario = useUsuarioAtual();
  const toque = usePonteiroGrosso();
  const fecharSidebar = useFecharSidebarMovel();
  useFecharSidebarAoNavegar();

  const variant = isSynced ? sidebarVariant : props.variant;
  const preferido = isSynced ? sidebarCollapsible : props.collapsible;
  // Recolhida em ícones, os rótulos só aparecem em tooltip, que não abre no toque: no tablet ela some por inteiro.
  const collapsible = toque && preferido === "icon" ? "offcanvas" : preferido;

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link prefetch={false} href="/dashboard/rotina" onClick={fecharSidebar}>
                <Command />
                <span className="font-semibold text-base">{APP_CONFIG.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems} />
      </SidebarContent>
      {/* Com viewport-fit=cover, a sidebar (h-svh) e o Sheet do retrato vão até a borda de baixo: no app instalado do
          iPad o NavUser fica acima do indicador de início, como as barras do checklist e do alerta. */}
      <SidebarFooter className="pb-[max(--spacing(2),env(safe-area-inset-bottom))]">
        <SupportCard />
        {usuario && <NavUser user={paraUsuarioDoShell(usuario)} />}
      </SidebarFooter>
    </Sidebar>
  );
}
