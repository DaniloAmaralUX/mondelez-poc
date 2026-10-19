import type { ReactNode } from "react";

import { PainelDaMarca } from "./_components/painel-da-marca";

/**
 * Login v2 do template (formulário + painel), refeito na v0.7 (docs/20b) com menos coisa e mais precisão.
 *
 * - Página branca, sem card em volta do formulário: o formulário é o conteúdo, não um objeto sobre um fundo.
 * - O painel é o campo roxo da sinalização da Mondelēz, vivo (painel-da-marca.tsx: luz que segue o ponteiro, título que
 *   entra uma vez, fim da frase que gira). Mais estreito que o formulário (no máximo 36 rem): em 1.280 px o formulário em
 *   duas colunas cabe sem rolagem lateral, o que a grade meio a meio não deixava. Só a partir de xl; abaixo dele, o logo
 *   roxo abre a página (page.tsx).
 * - A coluna do formulário rola com a barra discreta do tema (rolagem-discreta, tema-mondelez.css), e não com a barra
 *   cinza do sistema.
 */
export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="bg-card">
      <div className="grid h-dvh xl:grid-cols-[minmax(0,1fr)_minmax(24rem,36rem)] xl:gap-3 xl:p-3">
        {/* A coluna do formulário rola sozinha (o painel fica parado): no iPad em paisagem o teclado do PIN passa da altura. */}
        <div className="rolagem-discreta relative flex h-full min-h-0 overflow-y-auto">{children}</div>

        <PainelDaMarca />
      </div>
    </main>
  );
}
