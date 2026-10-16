import { Globe } from "lucide-react";
import type { Metadata } from "next";

import { APP_CONFIG } from "@/config/app-config";
import { PIN_DEMO } from "@/data/seed";

import { LoginForm } from "./_components/login-form";
import { SsoButton } from "./_components/sso-button";

export const metadata: Metadata = {
  title: `Entrar · ${APP_CONFIG.name}`,
};

export default function LoginPage() {
  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
        <div className="space-y-2 text-center">
          <h1 className="font-medium text-3xl">Entrar no posto</h1>
          <p className="text-muted-foreground text-sm">Use a matrícula do crachá e o seu PIN.</p>
        </div>
        <div className="space-y-4">
          <SsoButton className="w-full" />
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-border after:border-t">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">Ou entre com a matrícula</span>
          </div>
          <LoginForm />
        </div>
      </div>

      <div className="absolute top-5 flex w-full justify-end px-10">
        <div className="text-muted-foreground text-sm">
          Demonstração: matrícula <span className="text-foreground">104233</span>, PIN{" "}
          <span className="text-foreground">{PIN_DEMO}</span>
        </div>
      </div>

      <div className="absolute bottom-5 flex w-full justify-between px-10">
        <div className="text-sm">{APP_CONFIG.copyright}</div>
        <div className="flex items-center gap-1 text-sm">
          <Globe className="size-4 text-muted-foreground" />
          PT-BR
        </div>
      </div>
    </>
  );
}
