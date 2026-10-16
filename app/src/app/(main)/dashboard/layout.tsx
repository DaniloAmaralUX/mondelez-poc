import type { ReactNode } from "react";

import { cookies } from "next/headers";

import { cn } from "cn";

import { AppSidebar } from "@/app/(main)/dashboard/_components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { users } from "@/data/users";
import { getPreference } from "@/server/server-actions";

import { AlertWatcher } from "./_components/alert-watcher";
import { AccountSwitcher } from "./_components/header/account-switcher";
import { DemoMenu } from "./_components/header/demo-menu";
import { LayoutControls } from "./_components/header/layout-controls";
import { LeadershipOnly } from "./_components/header/leadership-only";
import { SearchDialog } from "./_components/header/search-dialog";
import { SyncStatus } from "./_components/header/sync-status";
import { ThemeSwitcher } from "./_components/header/theme-switcher";
import { BloqueioAutomatico, LockScreen } from "./_components/lock-screen";
import { Plataforma } from "./_components/plataforma";
import { SessionGate } from "./_components/session-gate";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const [variant, collapsible] = await Promise.all([
    getPreference("sidebar_variant"),
    getPreference("sidebar_collapsible"),
  ]);

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
        } as React.CSSProperties
      }
      // Abaixo de 1024 px a sidebar é um Sheet (useIsMobile), mas o HTML do servidor sai com a versão fixa: escondê-la
      // por CSS evita que o retrato mostre 272 px de sidebar até a hidratação.
      className="max-lg:[&>[data-slot=sidebar]]:hidden"
    >
      <AppSidebar variant={variant} collapsible={collapsible} />
      <SidebarInset
        className={cn(
          "[html[data-content-layout=centered]_&>*]:mx-auto",
          "[html[data-content-layout=centered]_&>*]:w-full",
          "[html[data-content-layout=centered]_&>*]:max-w-screen-2xl",
          "peer-data-[variant=inset]:border",
          // No toque os controles do header têm 56 px (camada de densidade): a barra passa a 64 px. A variante toque:
          // (src/styles/tablet.css) segue a camada também com o override html[data-density], nos dois sentidos.
          "[--dashboard-header-height:--spacing(12)] toque:[--dashboard-header-height:--spacing(16)]",
          "min-w-0 overflow-x-clip",
        )}
      >
        <header
          className={cn(
            "flex h-(--dashboard-header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--dashboard-header-height)",
            // Handle sticky navbar style with conditional classes so blur, background, z-index, and rounded corners remain consistent across all SidebarVariant layouts.
            "[html[data-navbar-style=sticky]_&]:sticky [html[data-navbar-style=sticky]_&]:top-0 [html[data-navbar-style=sticky]_&]:z-50 [html[data-navbar-style=sticky]_&]:overflow-hidden [html[data-navbar-style=sticky]_&]:rounded-t-[inherit] [html[data-navbar-style=sticky]_&]:bg-background/50 [html[data-navbar-style=sticky]_&]:backdrop-blur-md",
            // No tablet a barra fixa é opaca e sem blur (legibilidade sob luz forte e GPU modesta). Aqui fica
            // pointer-coarse: e não toque:, porque toque: com [html[…]_&] exigiria um html dentro do outro.
            "pointer-coarse:[html[data-navbar-style=sticky]_&]:bg-background pointer-coarse:[html[data-navbar-style=sticky]_&]:backdrop-blur-none",
          )}
        >
          <div className="flex w-full items-center justify-between gap-3 px-4 lg:px-6">
            <div className="flex min-w-0 items-center gap-1 toque:gap-3 lg:gap-2">
              <SidebarTrigger className="-ml-1 shrink-0" aria-label="Mostrar ou ocultar menu" />
              <Separator
                orientation="vertical"
                className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
              />
              <SearchDialog />
            </div>
            <div className="flex shrink-0 items-center gap-2 toque:gap-3">
              <SyncStatus />
              <LeadershipOnly>
                <LayoutControls />
              </LeadershipOnly>
              <ThemeSwitcher />
              {/* Só com APP_CONFIG.demo.enabled (o próprio menu confere). */}
              <DemoMenu />
              <AccountSwitcher users={users} />
            </div>
          </div>
        </header>
        {/* Pages can set data-content-padding="false" to render full-bleed app layouts. */}
        {/* @container/content: as telas se adaptam à largura útil (descontada a sidebar), não ao viewport. overflow-x-clip
            (e não hidden) para o wrapper não virar contêiner de rolagem e o sticky das barras seguir a janela. */}
        <div className="@container/content min-h-0 min-w-0 flex-1 overflow-x-clip p-4 has-data-[content-padding=false]:p-0 md:p-6 md:has-data-[content-padding=false]:p-0">
          <SessionGate>
            <AlertWatcher />
            {children}
          </SessionGate>
        </div>
      </SidebarInset>
      {/* Serviços do tablet, sem interface: rede, sincronização, Wake Lock, abas (Plataforma) e bloqueio automático.
          A tela "Quem está no posto?" fica fora do SessionGate: o conteúdo dele fica inerte enquanto ela está aberta. */}
      <Plataforma />
      <BloqueioAutomatico />
      <LockScreen />
    </SidebarProvider>
  );
}
