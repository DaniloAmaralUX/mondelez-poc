"use client";

import { useState } from "react";

import { Clock } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { APP_CONFIG } from "@/config/app-config";
import { turnoAtual } from "@/domain/turno";
import { formatarHora } from "@/lib/format";
import { useAgora, useSessionHydrated, useSessionStore } from "@/stores/session/session-store";

/**
 * Painel de demonstração (RF-13), no lugar do menu de repositórios do template. Só existe com a demonstração ligada
 * (`APP_CONFIG.demo.enabled`, padrão); com `NEXT_PUBLIC_DEMO=false` some para todos os perfis.
 */
export function DemoMenu() {
  if (!APP_CONFIG.demo.enabled) return null;
  return <PainelDaDemonstracao />;
}

function PainelDaDemonstracao() {
  // O relógio simulado só existe no cliente: o rótulo com horário espera o estado do tablet.
  const hydrated = useSessionHydrated();
  const agora = useAgora();
  const redeNavegador = useSessionStore((s) => s.redeNavegador);
  const simularSemRede = useSessionStore((s) => s.simularSemRede);
  const avancarRelogio = useSessionStore((s) => s.avancarRelogio);
  const irParaFimDoTurno = useSessionStore((s) => s.irParaFimDoTurno);
  const alternarRede = useSessionStore((s) => s.alternarRede);
  const bloquear = useSessionStore((s) => s.bloquear);
  const resetarDemo = useSessionStore((s) => s.resetarDemo);
  const turno = turnoAtual(agora);
  const [confirmarReset, setConfirmarReset] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            aria-label={hydrated ? `Demonstração: ${turno.numero}º turno, ${formatarHora(agora)}` : "Demonstração"}
          >
            <Clock />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
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
            {/* A rede real do aparelho manda; a simulação só desliga por cima dela (nunca liga uma rede que não existe). */}
            <DropdownMenuLabel>
              Rede do tablet
              <DropdownMenuShortcut>{redeNavegador === "online" ? "Conectado" : "Sem rede"}</DropdownMenuShortcut>
            </DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={simularSemRede}
              onCheckedChange={(marcado) => {
                if (marcado !== simularSemRede) alternarRede();
              }}
            >
              Simular sem rede
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Tablet compartilhado</DropdownMenuLabel>
            {/* Mostra o bloqueio por inatividade sem esperar 5 min parado. */}
            <DropdownMenuItem onSelect={() => bloquear("inatividade")}>Simular 5 min parado</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmarReset(true)}>
            Resetar dados
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmarReset} onOpenChange={setConfirmarReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar os dados da demonstração?</AlertDialogTitle>
            <AlertDialogDescription>
              Registros, alertas e rascunhos deste tablet são apagados e o relógio volta às 07:40 do 1º turno.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                resetarDemo();
                toast("Dados da demonstração restaurados", { description: "Relógio de volta às 07:40 do 1º turno." });
              }}
            >
              Resetar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
