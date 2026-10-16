import { Globe } from "lucide-react";
import type { Metadata } from "next";

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
    <div className="flex min-h-full w-full flex-col">
      <div className="flex w-full justify-end px-10 pt-5">
        {demo && (
          <div className="text-muted-foreground text-sm">
            Demonstração: matrícula <span className="text-foreground tabular-nums">104233</span>, PIN{" "}
            <span className="text-foreground tabular-nums">{PIN_DEMO}</span>
          </div>
        )}
      </div>

      <div className="mx-auto my-auto flex w-full flex-col justify-center space-y-8 py-8 sm:w-[350px]">
        <div className="space-y-2 text-center">
          <h1 className="font-medium text-3xl">Entrar no posto</h1>
          <p className="text-muted-foreground text-sm toque:text-base">Use a matrícula do crachá e o seu PIN.</p>
        </div>
        <div className="space-y-4">
          {/* SSO corporativo é simulado no protótipo (escolhe-se a pessoa, sem senha): só na demonstração. */}
          {demo && (
            <>
              <SsoButton className="w-full" />
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-border after:border-t">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">Ou entre com a matrícula</span>
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
