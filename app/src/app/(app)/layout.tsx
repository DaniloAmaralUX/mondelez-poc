import type { ReactNode } from "react";

import { cookies } from "next/headers";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { AppHeader } from "./_components/header/app-header";
import { SessionGate } from "./_components/session-gate";
import { AppSidebar } from "./_components/sidebar/app-sidebar";

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen} style={{ "--sidebar-width": "16rem" } as React.CSSProperties}>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <AppHeader />
        <main className="@container/main mx-auto flex w-full max-w-5xl min-w-0 flex-1 flex-col p-4 md:p-6">
          <SessionGate>{children}</SessionGate>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
