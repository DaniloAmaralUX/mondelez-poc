"use client";

import Link from "next/link";
import { useOffline } from "next/offline";

import { WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";

/**
 * Carregamento das telas do dashboard, ciente da rede (node_modules/next/dist/docs/01-app/02-guides/offline-support.md,
 * "Without Cache Components"). Sem rede, uma tela que não está no aparelho fica esperando a conexão (`useOffline` no
 * next.config): em vez de um carregamento sem fim, o aviso diz por quê e oferece a volta para a Minha Rotina, que fica
 * no aparelho (prefetch completo, src/lib/rotas.ts). Quando a rede volta, o Next refaz o pedido e a tela abre sozinha.
 *
 * As rotas do operador continuam com prefetch completo (`<Link prefetch>` e a `<Plataforma />`): abrem direto, sem
 * passar por aqui. Com este arquivo, os links com o prefetch padrão também guardam este carregamento, que então aparece
 * sem rede. No servidor e na hidratação `useOffline` é false: o HTML é sempre o do carregamento com rede.
 */
export default function Loading() {
  const semRede = useOffline();

  if (!semRede) {
    return (
      <div className="grid min-h-48 place-items-center">
        <Spinner aria-label="Carregando a tela" className="size-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Empty role="status" className="min-h-[50dvh] border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <WifiOff />
        </EmptyMedia>
        <EmptyTitle className="text-base toque:text-lg">Sem rede: esta tela abre quando a conexão voltar.</EmptyTitle>
        <EmptyDescription className="toque:text-base">
          O que você já registrou está salvo no tablet e é enviado sozinho quando a rede voltar.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {/* Ação única da tela: 64 px no toque, como as primárias do operador (docs/12 §5 item 1). */}
        <Button asChild className="h-11 toque:h-16 px-5 toque:px-6 toque:text-base">
          <Link prefetch href="/dashboard/rotina">
            Voltar para Minha Rotina
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
