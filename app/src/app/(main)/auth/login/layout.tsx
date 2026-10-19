import type { ReactNode } from "react";

import { Tablet, WifiOff } from "lucide-react";

import { LogoMondelezAssinatura } from "@/components/marca/logo-mondelez-assinatura";
import { MarcaDoApp } from "@/components/marca-do-app";
import { APP_CONFIG } from "@/config/app-config";

/**
 * Login v2 do template, com a mesma grade (formulário + painel), que a v0.4 liga a partir de xl: no iPad em paisagem
 * (1.180 px) o painel tirava metade da tela e o formulário ficava estreito; lá o card do formulário fica sozinho e largo.
 *
 * v0.6 (docs/19): o painel é o campo roxo da sinalização da Mondelēz, com o logo e a assinatura "Snacking Made Right"
 * em branco (versão "over purple" dos arquivos oficiais, de uso interno). As duas formas arredondadas no canto são as
 * "(im)perfect shapes" das iniciativas internas do brand book, num roxo um tom acima do fundo: ornamento, sem texto
 * por cima. O título conversa com a assinatura na voz da marca (simples, autêntica, calorosa).
 */
export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="bg-background">
      <div className="grid h-dvh justify-center p-2 xl:grid-cols-2 xl:p-3">
        <div className="relative order-2 hidden h-full flex-col justify-between overflow-hidden rounded-[1.75rem] bg-primary p-12 text-primary-foreground xl:flex">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -bottom-28 size-[26rem] rounded-[46%_54%_50%_50%/54%_48%_52%_46%] bg-white/[0.06]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-40 -bottom-10 size-40 rounded-[54%_46%_42%_58%/48%_56%_44%_52%] bg-white/[0.08]"
          />

          {/* Área de proteção do logo (brand book): pelo menos a largura do "o" em volta; o p-12 do painel garante. */}
          <LogoMondelezAssinatura cor="branco" className="w-72" />

          <div className="relative flex max-w-lg flex-col gap-4">
            <p className="text-balance font-semibold text-5xl leading-[1.05] tracking-[-0.01em]">
              A rotina do turno, feita do jeito certo.
            </p>
            <p className="text-lg text-white/75">
              Checklists, apontamentos e alertas da linha num só lugar, com a próxima tarefa sempre na frente.
            </p>
          </div>

          <div className="relative flex flex-col gap-8">
            <ul className="grid grid-cols-2 gap-8 text-sm">
              <li className="flex flex-col gap-2">
                <Tablet className="size-5 text-white/80" aria-hidden />
                <p className="font-semibold text-base text-white">Tablet do posto</p>
                <p className="text-white/75">
                  Cada pessoa entra com a própria matrícula. O posto fica lembrado neste tablet.
                </p>
              </li>
              <li className="flex flex-col gap-2">
                <WifiOff className="size-5 text-white/80" aria-hidden />
                <p className="font-semibold text-base text-white">Sem rede?</p>
                <p className="text-white/75">
                  Os registros ficam salvos no tablet e são enviados quando a conexão voltar.
                </p>
              </li>
            </ul>
            <div className="flex items-center gap-3 border-white/15 border-t pt-6">
              <MarcaDoApp tamanho="sm" className="bg-white text-primary" />
              <span className="font-semibold text-base">{APP_CONFIG.name}</span>
            </div>
          </div>
        </div>
        {/* A coluna do formulário rola sozinha (o painel fica parado): em paisagem, o teclado do PIN passa da altura. */}
        <div className="relative order-1 flex h-full min-h-0 overflow-y-auto">{children}</div>
      </div>
    </main>
  );
}
