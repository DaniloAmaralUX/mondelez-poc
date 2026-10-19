import { Globe } from "lucide-react";
import type { Metadata } from "next";

import { LogoMondelez } from "@/components/marca/logo-mondelez";
import { APP_CONFIG } from "@/config/app-config";
import { PIN_DEMO } from "@/data/seed";

import { LoginForm } from "./_components/login-form";
import { SsoButton } from "./_components/sso-button";

export const metadata: Metadata = {
  title: `Entrar · ${APP_CONFIG.name}`,
};

/**
 * Login v2 do template. As faixas de cima e de baixo saíram do `absolute` para o fluxo: com o teclado numérico de
 * 64 px o formulário passa da altura do tablet em paisagem (820 px) e a coluna rola (layout.tsx); com `absolute` elas
 * ficariam por cima dos campos. Quando cabe, a aparência é a do template (faixas nas bordas, formulário centralizado
 * por `my-auto`, que vira 0 quando falta espaço e não corta o topo).
 */
export default function LoginPage() {
  const demo = APP_CONFIG.demo.enabled;

  return (
    <div className="flex min-h-full w-full flex-col gap-6">
      <div className="flex w-full justify-end px-10 pt-5">
        {demo && (
          <div className="text-muted-foreground text-sm">
            Demonstração: matrícula <span className="text-foreground tabular-nums">104233</span>, PIN{" "}
            <span className="text-foreground tabular-nums">{PIN_DEMO}</span>
          </div>
        )}
      </div>

      {/* v0.4 (docs/14): o formulário fica num card branco sobre o fundo cinza (tela de entrada do Apple ID); no celular,
          sem card, ocupando a largura. A marca aparece aqui quando o painel da direita some (abaixo de xl). */}
      <div className="@container/login mx-auto my-auto flex w-full flex-col justify-center space-y-8 px-6 py-8 sm:w-[420px] sm:rounded-[1.75rem] sm:bg-card sm:p-10 sm:shadow-[0_0_0_0.5px_var(--hairline),var(--shadow-md)] lg:w-[680px] lg:space-y-6 lg:p-8 xl:w-[640px]">
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Sem o painel roxo (abaixo de xl) o logo Mondelēz abre o card: roxo no claro, branco no escuro (o roxo só vai
              sobre fundo claro). Em tela baixa (iPad em paisagem) ele sai para o card caber sem rolar. */}
          <div className="mb-2 xl:hidden [@media(max-height:56rem)]:hidden">
            <LogoMondelez cor="roxo" className="w-40 dark:hidden" />
            <LogoMondelez cor="branco" className="hidden w-40 dark:block" />
          </div>
          <h1 className="text-3xl">Entrar no posto</h1>
          <p className="text-muted-foreground text-sm toque:text-base">Use a matrícula do crachá e o seu PIN.</p>
        </div>
        <div className="space-y-4">
          {/* SSO corporativo é simulado no protótipo (escolhe-se a pessoa, sem senha): só na demonstração. */}
          {demo && (
            <>
              <SsoButton className="w-full" />
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-border after:border-t">
                <span className="relative z-10 bg-background px-2 text-muted-foreground sm:bg-card">
                  Ou entre com a matrícula
                </span>
              </div>
            </>
          )}
          <LoginForm />
        </div>
      </div>

      <div className="flex w-full justify-between px-10 pb-5">
        <div className="text-sm">{APP_CONFIG.copyright}</div>
        <div className="flex items-center gap-1 text-sm">
          <Globe className="size-4 text-muted-foreground" />
          PT-BR
        </div>
      </div>
    </div>
  );
}
