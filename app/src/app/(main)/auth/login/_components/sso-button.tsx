"use client";

import { useRouter } from "next/navigation";

import { cn } from "cn";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { localRepository } from "@/data/repository";
import { primeiroNome } from "@/lib/format";
import { useSessionStore } from "@/stores/session/session-store";

/**
 * Liderança entra pelo diretório corporativo (RF-01). No protótipo o SSO é simulado: escolhe-se a pessoa, sem PIN.
 * Por isso só aparece com a demonstração ligada (`APP_CONFIG.demo.enabled`, ver login/page.tsx).
 */
export function SsoButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  const router = useRouter();
  const entrarComo = useSessionStore((s) => s.entrarComo);
  const lideranca = localRepository.usuarios().filter((u) => u.perfil !== "operacao");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn("h-11", className)} {...props}>
          <Building2 className="size-4" />
          Entrar com SSO corporativo
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
        <DropdownMenuGroup>
          <DropdownMenuLabel>SSO simulado · liderança</DropdownMenuLabel>
          {lideranca.map((u) => (
            <DropdownMenuItem
              key={u.id}
              onSelect={() => {
                entrarComo(u.id);
                toast(`Bom turno, ${primeiroNome(u.nome)}`, { description: u.cargo });
                router.replace("/dashboard/rotina");
              }}
            >
              <div className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate">{u.nome}</span>
                <span className="truncate text-muted-foreground text-xs toque:text-sm">{u.cargo}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
