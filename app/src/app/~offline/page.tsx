import { WifiOff } from "lucide-react";
import type { Metadata } from "next";

import { LogoMondelez } from "@/components/marca/logo-mondelez";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { APP_CONFIG } from "@/config/app-config";

import { RecarregarComRede } from "./_components/recarregar-com-rede";

export const metadata: Metadata = {
  title: `Sem rede · ${APP_CONFIG.name}`,
};

/**
 * Página offline, estática e no precache do service worker (src/app/sw.ts): é a resposta de uma navegação sem rede a
 * uma tela que ainda não está guardada no tablet. Fica na URL pedida. O cartão é o mesmo do `dashboard/loading.tsx`
 * sem rede, com o recuo da área de conteúdo do dashboard, centralizado na altura como a `not-found.tsx`.
 */
export default function Page() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4 md:p-6">
      <RecarregarComRede />
      <Empty role="status" className="min-h-[50dvh] border">
        <EmptyHeader>
          {/* v0.6 (docs/19): a marca também na tela sem rede, que é a primeira coisa vista quando a rede cai. */}
          <LogoMondelez cor="roxo" className="mb-4 w-28 dark:hidden" />
          <LogoMondelez cor="branco" className="mb-4 hidden w-28 dark:block" />
          <EmptyMedia variant="icon">
            <WifiOff />
          </EmptyMedia>
          <EmptyTitle className="text-base toque:text-lg">Sem rede: esta tela abre quando a conexão voltar.</EmptyTitle>
          <EmptyDescription className="toque:text-base">
            O que você já registrou está salvo no tablet e é enviado sozinho quando a rede voltar.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          {/* Navegação do documento (<a>, e não <Link>): sem rede, o router do Next esperaria a conexão; a navegação do
              navegador passa pelo service worker, que abre a Minha Rotina guardada. 64 px no toque (docs/12 §5). */}
          <Button asChild className="h-11 toque:h-16 px-5 toque:px-6 toque:text-base">
            <a href="/dashboard/rotina">Voltar para Minha Rotina</a>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
