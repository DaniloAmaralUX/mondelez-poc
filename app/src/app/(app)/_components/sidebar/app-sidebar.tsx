"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Factory } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { toque } from "@/lib/touch";
import { appNav } from "@/navigation/app-nav";
import { useUsuarioAtual } from "@/stores/session/session-store";

import { NavUser } from "./nav-user";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const path = usePathname();
  const usuario = useUsuarioAtual();
  const itens = appNav.filter((i) => !i.perfis || (usuario && i.perfis.includes(usuario.perfil)));

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={toque.menu}>
              <Link href="/rotina">
                <Factory />
                <span className="font-strong">{APP_CONFIG.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {itens.map((item) => (
                <SidebarMenuItem key={item.id}>
                  {item.emBreve ? (
                    <>
                      <SidebarMenuButton disabled className={toque.menu}>
                        <item.icone />
                        <span>{item.titulo}</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge className="top-4.5 right-2">em {item.emBreve}</SidebarMenuBadge>
                    </>
                  ) : (
                    <SidebarMenuButton asChild isActive={path.startsWith(item.url)} className={toque.menu}>
                      <Link href={item.url}>
                        <item.icone />
                        <span>{item.titulo}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>{usuario && <NavUser usuario={usuario} />}</SidebarFooter>
    </Sidebar>
  );
}
