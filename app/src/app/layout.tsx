import type { ReactNode } from "react";

import type { Metadata, Viewport } from "next";

import { MotionProvider } from "@/components/motion-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_CONFIG } from "@/config/app-config";
import { fontVars } from "@/lib/fonts/registry";
import { PREFERENCE_DEFAULTS } from "@/lib/preferences/preferences-config";
import { ThemeBootScript } from "@/scripts/theme-boot";
import { PreferencesStoreProvider } from "@/stores/preferences/preferences-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: APP_CONFIG.meta.title,
  description: APP_CONFIG.meta.description,
  applicationName: APP_CONFIG.name,
  // Na tela de início do tablet: abre sem a barra do navegador, com o nome curto sob o ícone.
  appleWebApp: { capable: true, title: APP_CONFIG.pwa.shortName, statusBarStyle: "default" },
  // Matrícula, lote e ordem de serviço não podem virar link de telefone num toque de luva.
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
};

/**
 * Tablet do posto. Sem `maximumScale`/`userScalable`: o zoom de pinça continua livre.
 * `interactiveWidget` faz o teclado do Android encolher o layout (o iPad ignora; lá vale o `visualViewport`).
 * `themeColor` único, igual ao manifest: o tema do app vem da classe (padrão claro), não de prefers-color-scheme, então
 * um tablet com o sistema escuro não pinta a barra de status de escuro sobre o app claro.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: APP_CONFIG.pwa.backgroundLight,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { theme_mode, theme_preset, content_layout, navbar_style, sidebar_variant, sidebar_collapsible, font } =
    PREFERENCE_DEFAULTS;
  return (
    <html
      lang="pt-BR"
      data-theme-mode={theme_mode}
      data-theme-preset={theme_preset}
      data-content-layout={content_layout}
      data-navbar-style={navbar_style}
      data-sidebar-variant={sidebar_variant}
      data-sidebar-collapsible={sidebar_collapsible}
      data-font={font}
      suppressHydrationWarning
    >
      <head>
        {/* Applies theme and layout preferences on load to avoid flicker and unnecessary server rerenders. */}
        <ThemeBootScript />
      </head>
      <body className={`${fontVars} min-h-dvh antialiased`}>
        <TooltipProvider>
          <PreferencesStoreProvider initialValues={PREFERENCE_DEFAULTS}>
            <MotionProvider>{children}</MotionProvider>
            {/* No topo para não cobrir a barra de ações; 8 s e botão de fechar para quem está de luva.
                `cn-toast` repetido porque o `toastOptions` daqui substitui o do wrapper em `ui/sonner.tsx`.
                Rótulos em pt-BR: o sonner traz "Close toast" no fechar e "Notifications" na região. */}
            <Toaster
              position="top-center"
              duration={8000}
              closeButton
              containerAriaLabel="Notificações"
              toastOptions={{ classNames: { toast: "cn-toast" }, closeButtonAriaLabel: "Fechar aviso" }}
            />
          </PreferencesStoreProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
