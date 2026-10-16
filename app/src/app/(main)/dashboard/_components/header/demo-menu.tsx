"use client";

import { Clock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { turnoAtual } from "@/domain/turno";
import { formatarHora } from "@/lib/format";
import { useAgora, useSessionHydrated, useSessionStore } from "@/stores/session/session-store";

/** Painel de demonstração (RF-13), no lugar do menu de repositórios do template. */
export function DemoMenu() {
  // O relógio simulado só existe no cliente: o rótulo com horário espera o estado do tablet.
  const hydrated = useSessionHydrated();
  const agora = useAgora(5_000);
  const rede = useSessionStore((s) => s.rede);
  const avancarRelogio = useSessionStore((s) => s.avancarRelogio);
  const irParaFimDoTurno = useSessionStore((s) => s.irParaFimDoTurno);
  const alternarRede = useSessionStore((s) => s.alternarRede);
  const resetarDemo = useSessionStore((s) => s.resetarDemo);
  const turno = turnoAtual(agora);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" aria-label={hydrated ? `Demonstração: ${turno.numero}º turno, ${formatarHora(agora)}` : "Demonstração"}>
          <Clock />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            Relógio da demonstração
            <DropdownMenuShortcut className="tabular-nums">{formatarHora(agora)}</DropdownMenuShortcut>
          </DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => avancarRelogio(15)}>Avançar 15 min</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => avancarRelogio(60)}>Avançar 1 hora</DropdownMenuItem>
          <DropdownMenuItem onSelect={irParaFimDoTurno}>Ir para o fim do turno</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Rede do tablet</DropdownMenuLabel>
          <DropdownMenuCheckboxItem checked={rede === "offline"} onCheckedChange={alternarRede}>
            Simular sem rede
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            resetarDemo();
            toast("Dados da demonstração restaurados", { description: "Relógio de volta às 07:40 do 1º turno." });
          }}
        >
          Resetar dados
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
