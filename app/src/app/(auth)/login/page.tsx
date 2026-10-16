import { Factory } from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";

import { LoginForm } from "./_components/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[2fr_3fr]">
      <section className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <Factory aria-hidden className="size-7" />
          <span className="font-strong text-xl">{APP_CONFIG.name}</span>
        </div>
        <div className="flex flex-col gap-3">
          <p className="font-strong text-3xl leading-tight">O que fazer agora, no seu posto, no seu turno.</p>
          <p className="text-lg text-primary-foreground/80">
            Registre em poucos toques. Nada se perde, mesmo sem rede.
          </p>
        </div>
        <p className="text-primary-foreground/70 text-sm">Protótipo funcional · dados simulados</p>
      </section>
      <section className="flex items-center justify-center p-6 md:p-10">
        <LoginForm />
      </section>
    </main>
  );
}
