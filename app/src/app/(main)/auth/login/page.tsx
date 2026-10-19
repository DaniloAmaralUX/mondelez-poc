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
 * Login, refeito na v0.7 (docs/20b). Página branca e sem card; título alinhado à esquerda com o formulário, como uma
 * página de produto e não um diálogo. As faixas de cima e de baixo ficam no fluxo (e não `absolute`): no iPad em
 * paisagem o teclado do PIN passa da altura e a coluna rola (layout.tsx).
 *
 * Largura por quem usa: até lg, uma coluna de 28 rem (retrato, Split View); a partir de lg, 44 rem e o formulário em
 * duas colunas pelo container (@container/login, a partir de 32 rem): quem e onde à esquerda, PIN à direita, e cabe na
 * altura sem rolar. Larguras máximas, nunca fixas: a v0.6 tinha 640 px fixos e, em 1.280 px com o painel, o card passava
 * da coluna e aparecia a rolagem lateral.
 */
export default function LoginPage() {
  const demo = APP_CONFIG.demo.enabled;

  return (
    <div className="flex min-h-full w-full flex-col">
      <header className="flex items-center justify-between gap-4 px-6 pt-6 sm:px-10">
        {/* Sem o painel roxo (abaixo de xl), o logo abre a página: roxo no claro, branco no escuro (o roxo só vai sobre
            fundo claro). Com o painel, o logo já está lá; o espaço fica, para a dica não pular. */}
        <span className="flex min-h-8 items-center">
          <LogoMondelez cor="roxo" className="w-28 xl:hidden dark:hidden" />
          <LogoMondelez cor="branco" className="hidden w-28 dark:block xl:dark:hidden" />
        </span>
        {demo && (
          <p className="rounded-full bg-muted px-3 py-1.5 text-muted-foreground text-sm">
            Demonstração · matrícula <span className="font-medium text-foreground tabular-nums">104233</span> · PIN{" "}
            <span className="font-medium text-foreground tabular-nums">{PIN_DEMO}</span>
          </p>
        )}
      </header>

      <div className="@container/login mx-auto my-auto flex w-full max-w-[33rem] flex-col gap-8 px-6 py-10 sm:px-10 lg:max-w-[49rem] lg:gap-7">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[1.75rem] leading-tight">Entrar no posto</h1>
          <p className="text-muted-foreground toque:text-base">Use a matrícula do crachá e o seu PIN.</p>
        </div>

        <div className="flex flex-col gap-5">
          {/* SSO corporativo é simulado no protótipo (escolhe-se a pessoa, sem senha): só na demonstração. */}
          {demo && (
            <>
              <SsoButton className="w-full @[32rem]/login:w-fit" />
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <span className="h-px flex-1 bg-border" aria-hidden />
                ou com a matrícula
                <span className="h-px flex-1 bg-border" aria-hidden />
              </div>
            </>
          )}
          <LoginForm />
        </div>
      </div>

      <footer className="flex items-center justify-between gap-4 px-6 pb-6 text-muted-foreground text-sm sm:px-10">
        <span>{APP_CONFIG.copyright}</span>
        <span className="flex items-center gap-1.5">
          <Globe className="size-4" aria-hidden />
          PT-BR
        </span>
      </footer>
    </div>
  );
}
