import type { ReactNode } from "react";

import { Tablet, WifiOff } from "lucide-react";

import { MarcaDoApp } from "@/components/marca-do-app";
import { APP_CONFIG } from "@/config/app-config";

/**
 * Login v2 do template, com a mesma grade (formulário + painel), que a v0.4 liga a partir de xl: no iPad em paisagem (1.180 px) o painel tirava metade da tela e o formulário ficava estreito; lá o card do formulário fica sozinho e largo. v0.4 (docs/14): o painel deixa de ser
 * um bloco roxo vazio e vira a superfície escura das páginas de produto da Apple: ícone do app, a promessa em título
 * grande e os dois fatos do tablet com ícone. O roxo fica só no ícone e na ação principal (um acento por tela). No tema
 * escuro o painel usa o card (#1c1c1e) para não sumir no fundo preto.
 */
export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="bg-background">
      <div className="grid h-dvh justify-center p-2 xl:grid-cols-2 xl:p-3">
        <div className="relative order-2 hidden h-full flex-col justify-between overflow-hidden rounded-[1.75rem] bg-[oklch(0.2178_0.0034_286.1)] p-12 text-white xl:flex dark:bg-card dark:ring-1 dark:ring-white/10">
          <div className="flex items-center gap-3">
            <MarcaDoApp />
            <span className="font-semibold text-lg tracking-tight">{APP_CONFIG.name}</span>
          </div>

          <div className="flex max-w-lg flex-col gap-4">
            <p className="text-balance font-semibold text-5xl leading-[1.05] tracking-[-0.025em]">
              O que fazer agora, no seu posto, no seu turno.
            </p>
            <p className="text-lg text-white/65">
              Checklists, apontamentos e alertas da linha num só lugar, com a próxima tarefa sempre na frente.
            </p>
          </div>

          <ul className="grid grid-cols-2 gap-8 text-sm">
            <li className="flex flex-col gap-2">
              <Tablet className="size-5 text-white/80" aria-hidden />
              <p className="font-semibold text-base text-white">Tablet do posto</p>
              <p className="text-white/65">
                Cada pessoa entra com a própria matrícula. O posto fica lembrado neste tablet.
              </p>
            </li>
            <li className="flex flex-col gap-2">
              <WifiOff className="size-5 text-white/80" aria-hidden />
              <p className="font-semibold text-base text-white">Sem rede?</p>
              <p className="text-white/65">
                Os registros ficam salvos no tablet e são enviados quando a conexão voltar.
              </p>
            </li>
          </ul>
        </div>
        {/* A coluna do formulário rola sozinha (o painel fica parado): em paisagem, o teclado do PIN passa da altura. */}
        <div className="relative order-1 flex h-full min-h-0 overflow-y-auto">{children}</div>
      </div>
    </main>
  );
}
