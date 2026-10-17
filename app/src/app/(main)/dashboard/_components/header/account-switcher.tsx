"use client";

import { useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { cn } from "cn";
import { Bell, Check, ListChecks, Lock, LogOut, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import { useSessionStore } from "@/stores/session/session-store";

export function AccountSwitcher({
  users,
}: {
  readonly users: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly avatar: string;
    readonly role: string;
  }>;
}) {
  const router = useRouter();
  const usuarioId = useSessionStore((s) => s.usuarioId);
  const bloquear = useSessionStore((s) => s.bloquear);
  const sair = useSessionStore((s) => s.sair);
  const activeUser = users.find((user) => user.id === usuarioId);

  // Tablet compartilhado (RF-13, docs/12 §3.4): trocar de pessoa pede o PIN de quem chega. O tablet bloqueia com a
  // pessoa escolhida já selecionada na tela "Quem está no posto?"; quem pediu pode voltar sem PIN de lá.
  const trocarPara = (user: (typeof users)[number]) => {
    if (user.id === usuarioId) return;
    bloquear("troca", user.id);
  };

  // Bloqueio explícito (ex.: vai sair do posto por um momento): sem pessoa escolhida, então para voltar é com PIN.
  const bloquearTablet = () => bloquear("troca");

  // O login fica no aparelho (staleTimes.static, next.config.mjs): "Sair", "Trocar posto" e o "Sair do posto" da tela
  // de bloqueio funcionam sem rede. O header está em todas as telas do dashboard.
  useEffect(() => {
    router.prefetch("/auth/login");
  }, [router]);

  const encerrar = () => {
    // Avisos com "Desfazer" da pessoa que sai não ficam no login para quem chega (o Toaster é do layout raiz).
    toast.dismiss();
    sair();
    router.replace("/auth/login");
  };

  if (!activeUser) {
    return null;
  }

  return (
    <DropdownMenu>
      {/* Gatilho focável e com nome acessível: o Avatar sozinho não recebia teclado (UI Audit, acessibilidade).
          32 px com ponteiro fino (size="icon" do template); 56 px no toque (toque:size-14), acima do piso de 48 px que
          a camada de toque dá às utilidades do header, porque trocar de pessoa é ação do operador. O avatar acompanha
          (toque:size-12); o size-8 fixo que havia aqui o deixava com 32 px dentro de um alvo maior. */}
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="toque:size-14 rounded-lg p-0"
          aria-label={`Trocar pessoa (agora: ${activeUser.name})`}
        >
          <Avatar className="size-8 toque:size-12 rounded-lg">
            <AvatarImage src={activeUser.avatar || undefined} alt="" />
            <AvatarFallback>{getInitials(activeUser.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      {/* min-w-72 e nome em até 2 linhas: no tablet compartilhado, "Ana Beatriz do Nascimento" e "Ana Beatriz dos
          Santos" não podem virar o mesmo "Ana Beatriz do…" na hora de escolher quem entra. */}
      <DropdownMenuContent className="min-w-72 space-y-1 rounded-lg" side="bottom" align="end" sideOffset={4}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="toque:text-sm">Trocar de pessoa · pede o PIN</DropdownMenuLabel>
          {users.map((user) => (
            <DropdownMenuItem
              key={user.email}
              className={cn("p-0", user.id === activeUser.id && "bg-accent/50")}
              aria-current={user.id === activeUser.id ? "true" : undefined}
              onSelect={() => trocarPara(user)}
            >
              <div className="flex w-full items-center gap-2 px-1 py-1.5">
                <Avatar className="size-9 rounded-lg">
                  <AvatarImage src={user.avatar || undefined} alt="" />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left text-sm toque:text-base leading-tight">
                  <span className="wrap-break-word line-clamp-2 font-semibold">{user.name}</span>
                  <span className="truncate text-xs toque:text-sm capitalize">{user.role}</span>
                </div>
                <span
                  className={cn(
                    "mr-1 flex size-5 items-center justify-center rounded-full text-primary opacity-0",
                    user.id === activeUser.id && "opacity-100",
                  )}
                >
                  <Check aria-hidden="true" />
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {/* Prefetch completo (lib/rotas.ts): o padrão do Link não busca as rotas dinâmicas do dashboard. Os itens só
              existem com o menu aberto, então a busca acontece ao abri-lo; a Minha Rotina já costuma estar no aparelho
              pelos outros links com prefetch (menu lateral, Voltar do checklist). */}
          <DropdownMenuItem asChild>
            <Link prefetch href="/dashboard/rotina">
              <ListChecks />
              Minha Rotina
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link prefetch href="/dashboard/alertas">
              <Bell />
              Alertas
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={bloquearTablet}>
            <Lock />
            Bloquear tablet
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={encerrar}>
            <MapPin />
            Trocar posto
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={encerrar}>
          <LogOut />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
