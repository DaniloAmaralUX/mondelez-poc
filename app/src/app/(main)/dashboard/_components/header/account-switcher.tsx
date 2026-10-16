"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { cn } from "cn";
import { Bell, Check, ListChecks, LogOut, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
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
  const entrarComo = useSessionStore((s) => s.entrarComo);
  const sair = useSessionStore((s) => s.sair);
  const activeUser = users.find((user) => user.id === usuarioId);

  // Demonstração (RF-13): troca de pessoa no tablet compartilhado sem sair do posto.
  const setActiveUser = (user: (typeof users)[number]) => {
    if (user.id === usuarioId) return;
    entrarComo(user.id);
    toast(`Agora com ${user.name}`, { description: user.role });
  };

  const encerrar = () => {
    sair();
    router.replace("/auth/login");
  };

  if (!activeUser) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-8 rounded-lg">
          <AvatarImage src={activeUser.avatar || undefined} alt={activeUser.name} />
          <AvatarFallback>{getInitials(activeUser.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 space-y-1 rounded-lg" side="bottom" align="end" sideOffset={4}>
        {users.map((user) => (
          <DropdownMenuItem
            key={user.email}
            className={cn("p-0", user.id === activeUser.id && "bg-accent/50")}
            aria-current={user.id === activeUser.id ? "true" : undefined}
            onClick={() => setActiveUser(user)}
          >
            <div className="flex w-full items-center gap-2 px-1 py-1.5">
              <Avatar className="size-9 rounded-lg">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs capitalize">{user.role}</span>
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
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link prefetch={false} href="/dashboard/rotina">
              <ListChecks />
              Minha Rotina
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link prefetch={false} href="/dashboard/alertas">
              <Bell />
              Alertas
            </Link>
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
