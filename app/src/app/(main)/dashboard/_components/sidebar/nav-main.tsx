"use client";

import * as React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "cn";
import { Bell, ChevronRight, PlusCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { proximaTarefa } from "@/domain/routine-engine";
import { useAlertas, useMinhasTarefas } from "@/hooks/use-turno";
import { hrefDaTarefa, prefetchDaRota } from "@/lib/rotas";
import type {
  NavBadge,
  NavGroup,
  NavMainItem,
  NavMainLinkItem,
  NavMainParentItem,
} from "@/navigation/sidebar/sidebar-items";

interface NavMainProps {
  readonly items: readonly NavGroup[];
}
interface NavItemProps {
  readonly item: NavMainItem;
  readonly contagem?: number;
  readonly isItemActive: (item: NavMainItem) => boolean;
  readonly isSubItemActive: (url: string) => boolean;
  readonly isSubmenuOpen: (item: NavMainParentItem) => boolean;
}

interface NavLinkItemProps {
  readonly item: NavMainLinkItem;
  readonly contagem?: number;
  readonly isActive: boolean;
  readonly showIconFallback: boolean;
}

interface NavLinkIconProps {
  readonly item: NavMainLinkItem;
  readonly showFallback: boolean;
}

interface NavDropdownItemProps {
  readonly item: NavMainParentItem;
  readonly isActive: boolean;
  readonly isSubItemActive: (url: string) => boolean;
}

interface NavCollapsibleItemProps {
  readonly item: NavMainParentItem;
  readonly isActive: boolean;
  readonly defaultOpen: boolean;
  readonly isSubItemActive: (url: string) => boolean;
}

function CollapsedIconFallback({ title }: { title: string }) {
  return (
    <span className="flex size-4 shrink-0 items-center justify-center rounded-xs font-medium text-[10px] outline">
      {title.slice(0, 1)}
    </span>
  );
}

function hasSubItems(item: NavMainItem): item is NavMainParentItem {
  return Boolean(item.subItems?.length);
}

/**
 * Abaixo de 1024 px a sidebar é um Sheet sobre a tela: tocar num link fecha o Sheet na hora, mesmo quando a rota
 * não muda (o `AppSidebar` também fecha quando a rota muda por outro caminho, como a busca ou um aviso).
 */
export function useFecharSidebarMovel() {
  const { isMobile, setOpenMobile } = useSidebar();
  return React.useCallback(() => {
    if (isMobile) setOpenMobile(false);
  }, [isMobile, setOpenMobile]);
}

/** Contagens e selos ficam centrados na linha quando a camada de toque aumenta o item para 56 px. */
const BADGE_NO_TOQUE = "toque:peer-data-[size=default]/menu-button:top-1/2 toque:-translate-y-1/2";

export function NavMain({ items }: NavMainProps) {
  const path = usePathname();
  const fecharSidebar = useFecharSidebarMovel();
  const proxima = proximaTarefa(useMinhasTarefas());
  // Contagem de alertas sem resolução no menu e no sino (UI Audit: alertas novos passavam despercebidos).
  const alertasAbertos = useAlertas().filter((a) => a.estado !== "resolvido").length;
  const contagens: Record<string, number> = { alertas: alertasAbertos };

  const isItemActive = (item: NavMainItem) => {
    if (hasSubItems(item)) {
      return item.subItems.some((sub) => path.startsWith(sub.url));
    }

    return path === item.url;
  };

  const isSubItemActive = (url: string) => {
    return path === url;
  };

  const isSubmenuOpen = (item: NavMainParentItem) => {
    return item.subItems.some((sub) => path.startsWith(sub.url));
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            {/* No toque: 56 px de altura (camada de densidade), 12 px entre "Registrar agora" e o sino. */}
            <SidebarMenuItem className="flex items-center gap-2 toque:gap-3">
              <SidebarMenuButton
                asChild
                tooltip="Registrar agora"
                className="min-w-8 toque:gap-3 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              >
                {/* prefetch: rota do operador em cache para abrir sem rede (lib/rotas.ts). */}
                <Link prefetch href={proxima ? hrefDaTarefa(proxima) : "/dashboard/rotina"} onClick={fecharSidebar}>
                  <PlusCircleIcon />
                  <span>Registrar agora</span>
                </Link>
              </SidebarMenuButton>
              {/* Recolhida em ícones, o sino some de vez (opacity-0 deixava um alvo invisível e focável).
                  No toque a camada de densidade (src/styles/tablet.css) leva o botão a 56 × 56 px. */}
              <Button
                asChild
                size="icon"
                className="h-9 w-9 shrink-0 group-data-[collapsible=icon]:hidden"
                variant="outline"
              >
                <Link prefetch href="/dashboard/alertas" className="relative" onClick={fecharSidebar}>
                  <Bell />
                  <span className="sr-only">
                    Alertas{alertasAbertos > 0 ? `: ${alertasAbertos} sem resolução` : ""}
                  </span>
                  {alertasAbertos > 0 && (
                    <span
                      aria-hidden
                      className="absolute -top-1 -right-1 grid h-4 toque:h-5 min-w-4 toque:min-w-5 place-items-center rounded-full bg-destructive px-1 font-medium text-[10px] text-white toque:text-xs tabular-nums"
                    >
                      {alertasAbertos}
                    </span>
                  )}
                </Link>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {items.map((group) => (
        <SidebarGroup key={group.id}>
          {group.label && (
            <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none">
              {group.label}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  contagem={contagens[item.id]}
                  isItemActive={isItemActive}
                  isSubItemActive={isSubItemActive}
                  isSubmenuOpen={isSubmenuOpen}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

function NavItem({ item, contagem, isItemActive, isSubItemActive, isSubmenuOpen }: NavItemProps) {
  const { state, isMobile } = useSidebar();
  const isCollapsedDesktop = state === "collapsed" && !isMobile;

  if (!hasSubItems(item)) {
    return (
      <NavLinkItem
        item={item}
        contagem={contagem}
        isActive={isItemActive(item)}
        showIconFallback={isCollapsedDesktop}
      />
    );
  }

  if (isCollapsedDesktop) {
    return <NavDropdownItem item={item} isActive={isItemActive(item)} isSubItemActive={isSubItemActive} />;
  }

  return (
    <NavCollapsibleItem
      item={item}
      isActive={isItemActive(item)}
      defaultOpen={isSubmenuOpen(item)}
      isSubItemActive={isSubItemActive}
    />
  );
}

function NavLinkItem({ item, contagem, isActive, showIconFallback }: NavLinkItemProps) {
  const fecharSidebar = useFecharSidebarMovel();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild aria-disabled={item.disabled} tooltip={item.title} isActive={isActive}>
        <Link
          prefetch={prefetchDaRota(item)}
          href={item.url}
          target={item.newTab ? "_blank" : undefined}
          rel={item.newTab ? "noreferrer" : undefined}
          onClick={fecharSidebar}
        >
          <NavLinkIcon item={item} showFallback={showIconFallback} />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
      <NavItemBadge badge={item.badge} />
      {contagem ? <SidebarMenuBadge className={cn("tabular-nums", BADGE_NO_TOQUE)}>{contagem}</SidebarMenuBadge> : null}
    </SidebarMenuItem>
  );
}

function NavLinkIcon({ item, showFallback }: NavLinkIconProps) {
  const Icon = item.icon;

  if (Icon) {
    return <Icon />;
  }

  if (showFallback) {
    return <CollapsedIconFallback title={item.title} />;
  }

  return null;
}

function NavDropdownItem({ item, isActive, isSubItemActive }: NavDropdownItemProps) {
  const Icon = item.icon;
  const fecharSidebar = useFecharSidebarMovel();

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={isActive} disabled={item.disabled}>
            {Icon ? <Icon /> : <CollapsedIconFallback title={item.title} />}
            <span>{item.title}</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="right" align="start" sideOffset={12} className="w-48">
          <DropdownMenuGroup>
            {item.subItems.map((subItem) => {
              const SubIcon = subItem.icon;

              return (
                <DropdownMenuItem key={subItem.id} asChild disabled={subItem.disabled}>
                  <Link
                    prefetch={prefetchDaRota(subItem)}
                    href={subItem.url}
                    target={subItem.newTab ? "_blank" : undefined}
                    rel={subItem.newTab ? "noreferrer" : undefined}
                    aria-current={isSubItemActive(subItem.url) ? "page" : undefined}
                    className="flex items-center gap-2"
                    onClick={fecharSidebar}
                  >
                    {SubIcon && <SubIcon />}
                    <span>{subItem.title}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function NavCollapsibleItem({ item, isActive, defaultOpen, isSubItemActive }: NavCollapsibleItemProps) {
  const Icon = item.icon;
  const fecharSidebar = useFecharSidebarMovel();

  return (
    <Collapsible asChild defaultOpen={defaultOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={isActive} disabled={item.disabled}>
            {Icon && <Icon />}
            <span>{item.title}</span>
            <ChevronRight className="ml-auto group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <NavItemBadge badge={item.badge} />

        <CollapsibleContent>
          <SidebarMenuSub>
            {item.subItems.map((subItem) => {
              const SubIcon = subItem.icon;

              return (
                <SidebarMenuSubItem key={subItem.id}>
                  <SidebarMenuSubButton
                    asChild
                    aria-disabled={subItem.disabled}
                    isActive={isSubItemActive(subItem.url)}
                  >
                    <Link
                      prefetch={prefetchDaRota(subItem)}
                      href={subItem.url}
                      target={subItem.newTab ? "_blank" : undefined}
                      rel={subItem.newTab ? "noreferrer" : undefined}
                      onClick={fecharSidebar}
                    >
                      {SubIcon && <SubIcon />}
                      <span>{subItem.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

const NAV_BADGE_LABEL: Record<NavBadge, string> = { new: "novo", soon: "em breve" };

function NavItemBadge({ badge }: { badge?: NavBadge }) {
  if (!badge) {
    return null;
  }

  return (
    <SidebarMenuBadge
      className={cn(
        "rounded-sm border capitalize",
        BADGE_NO_TOQUE,
        badge === "new" &&
          "border-green-600 text-green-600 peer-hover/menu-button:text-green-600 peer-data-active/menu-button:text-green-600",
        badge === "soon" && "border-muted-foreground text-muted-foreground",
      )}
    >
      {NAV_BADGE_LABEL[badge]}
    </SidebarMenuBadge>
  );
}
