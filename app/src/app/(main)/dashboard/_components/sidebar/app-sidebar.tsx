"use client";

import * as React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useShallow } from "zustand/react/shallow";

import { LogoMondelez } from "@/components/marca/logo-mondelez";
import { MarcaDoApp } from "@/components/marca-do-app";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { usePonteiroGrossoReal } from "@/hooks/use-modo-toque";
import { itensDoPerfil, sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";
import { useUsuarioAtual } from "@/stores/session/session-store";

import { NavMain, useFecharSidebarMovel } from "./nav-main";
import { NavUser } from "./nav-user";
import { SupportCard } from "./support-card";

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

/** Largura do Sheet do retrato: a mesma do ramo móvel de `ui/sidebar.tsx` (SIDEBAR_WIDTH_MOBILE). */
const LARGURA_SHEET = { "--sidebar-width": "18rem" } as React.CSSProperties;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.values.sidebar_variant,
      sidebarCollapsible: s.values.sidebar_collapsible,
      isSynced: s.isSynced,
    })),
  );

  const usuario = useUsuarioAtual();
  const toque = usePonteiroGrossoReal();
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  const fecharSidebar = useFecharSidebarMovel();
  useFecharSidebarAoNavegar();

  // Girar o retrato para paisagem deixa a sidebar fixa com o `openMobile` ainda `true`: sem fechar aqui, o Sheet
  // reaparecia sozinho sobre a tela ao voltar para o retrato.
  React.useEffect(() => {
    if (!isMobile) setOpenMobile(false);
  }, [isMobile, setOpenMobile]);

  const variant = isSynced ? sidebarVariant : props.variant;
  const preferido = isSynced ? sidebarCollapsible : props.collapsible;
  // Recolhida em ícones, os rótulos só aparecem em tooltip, que não abre no toque: no tablet ela some por inteiro.
  const collapsible = toque && preferido === "icon" ? "offcanvas" : preferido;

  const conteudo = (
    <>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* v0.6 (docs/19): logo Mondelēz na cor do texto da sidebar (branco no roxo do tema Mondelēz), com o nome
                do app embaixo. Recolhida em ícones, fica só o ícone do app. O botão do
                template força size-4 em todo svg dentro dele; daí o ! na largura do logo. */}
            <SidebarMenuButton
              asChild
              className="h-auto flex-col items-start gap-1.5 px-3 py-3 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!"
            >
              {/* prefetch: Minha Rotina em cache para voltar a ela sem rede (lib/rotas.ts). */}
              <Link
                prefetch
                href="/dashboard/rotina"
                onClick={fecharSidebar}
                aria-label={`${APP_CONFIG.name}, Minha Rotina`}
              >
                <MarcaDoApp tamanho="sm" className="hidden group-data-[collapsible=icon]:grid" />
                <span className="py-1 group-data-[collapsible=icon]:hidden">
                  <LogoMondelez cor="texto" decorativo className="h-auto! w-32!" />
                </span>
                <span className="font-semibold text-sidebar-foreground/85 text-sm tracking-wide group-data-[collapsible=icon]:hidden">
                  {APP_CONFIG.name}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Menu do perfil (RF-08). Antes de carregar a sessão (servidor e hidratação), o menu inteiro: sem salto. */}
        <NavMain items={usuario ? itensDoPerfil(usuario.perfil) : sidebarItems} />
      </SidebarContent>
      {/* Com viewport-fit=cover, a sidebar (h-svh) e o Sheet do retrato vão até a borda de baixo: no app instalado do
          iPad o NavUser fica acima do indicador de início, como as barras do checklist e do alerta. */}
      <SidebarFooter className="pb-[max(--spacing(2),env(safe-area-inset-bottom))]">
        <SupportCard />
        {usuario && <NavUser user={paraUsuarioDoShell(usuario)} />}
      </SidebarFooter>
    </>
  );

  // Retrato e Split View: o mesmo Sheet do ramo móvel de `ui/sidebar.tsx` (mesmos atributos e classes), montado aqui só
  // para o leitor de tela anunciar o menu em pt-BR; o do template tem título e descrição fixos em inglês ("Sidebar").
  if (isMobile && collapsible !== "none") {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side="left"
          showCloseButton={false}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground"
          style={LARGURA_SHEET}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Telas do app</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{conteudo}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      {conteudo}
    </Sidebar>
  );
}
