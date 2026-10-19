import type { ReactNode } from "react";

import { LogoMondelezAssinatura } from "@/components/marca/logo-mondelez-assinatura";
import { MarcaDoApp } from "@/components/marca-do-app";
import { APP_CONFIG } from "@/config/app-config";

/**
 * Login v2 do template (formulário + painel), refeito na v0.7 (docs/20b) com menos coisa e mais precisão.
 *
 * - Página branca, sem card em volta do formulário: o formulário é o conteúdo, não um objeto sobre um fundo.
 * - O painel é o campo roxo da sinalização da Mondelēz (logo com "Snacking Made Right" em branco), mais estreito que o
 *   formulário (no máximo 36 rem): em 1.280 px o formulário em duas colunas cabe sem rolagem lateral, o que a grade
 *   meio a meio não deixava. Só a partir de xl; abaixo dele, o logo roxo abre a página (page.tsx).
 * - No painel, só o logo, uma frase na voz da marca e o nome do app: os dois blocos de "fatos do tablet" da v0.6 saíram,
 *   o formulário já explica o que precisa. Uma forma "(im)perfeita" da marca, quase transparente, no canto.
 */
export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="bg-card">
      <div className="grid h-dvh xl:grid-cols-[minmax(0,1fr)_minmax(24rem,36rem)] xl:gap-3 xl:p-3">
        {/* A coluna do formulário rola sozinha (o painel fica parado): no iPad em paisagem o teclado do PIN passa da altura. */}
        <div className="relative flex h-full min-h-0 overflow-y-auto">{children}</div>

        <aside
          aria-label="Mondelēz International"
          className="relative hidden h-full flex-col justify-between overflow-hidden rounded-[1.5rem] bg-primary p-12 text-primary-foreground xl:flex"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -bottom-40 size-[30rem] rounded-[46%_54%_50%_50%/54%_48%_52%_46%] bg-white/[0.05]"
          />

          {/* Área de proteção do logo (brand book): pelo menos a largura do "o" em volta; o p-12 do painel garante. */}
          <LogoMondelezAssinatura cor="branco" className="relative w-[17rem]" />

          <div className="relative flex max-w-sm flex-col gap-3">
            <p className="text-balance font-semibold text-4xl leading-[1.1] tracking-[-0.01em]">
              A rotina do turno, feita do jeito certo.
            </p>
            <p className="text-pretty text-base text-white/70">
              Checklists, apontamentos e alertas da linha num só lugar, com a próxima tarefa sempre na frente.
            </p>
          </div>

          <div className="relative flex items-center justify-between gap-4 border-white/15 border-t pt-6 text-sm">
            <span className="flex items-center gap-2.5 font-semibold text-base">
              <MarcaDoApp tamanho="sm" className="bg-white text-primary" />
              {APP_CONFIG.name}
            </span>
            <span className="text-white/60">Funciona sem rede</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
