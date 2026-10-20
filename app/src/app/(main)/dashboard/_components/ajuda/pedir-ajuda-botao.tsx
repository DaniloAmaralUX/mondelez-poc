"use client";

import * as React from "react";

import { LifeBuoy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

import { PedirAjuda } from "./pedir-ajuda";

/**
 * "Pedir ajuda" de qualquer tela, para o header quando a sidebar está fechada (retrato). Abre o mesmo Sheet do card da
 * sidebar. Só a Operação pede ajuda; para os outros perfis não renderiza nada.
 *
 * Por padrão é um botão de ícone fantasma, como as utilidades do header (48 px no toque pela camada de densidade);
 * `comRotulo` mostra o texto ao lado do ícone.
 */
export function PedirAjudaBotao(props: { comRotulo?: boolean; className?: string }) {
  const usuario = useUsuarioAtual();
  const usuarioId = useSessionStore((s) => s.usuarioId);
  if (usuario?.perfil !== "operacao") return null;
  // Sheet com texto digitado: a troca de pessoa remonta tudo, inclusive o "aberto" (app/CONVENCOES.md).
  return <BotaoComSheet key={usuarioId} {...props} />;
}

function BotaoComSheet({ comRotulo = false, className }: { comRotulo?: boolean; className?: string }) {
  const [aberto, setAberto] = React.useState(false);
  return (
    <PedirAjuda aberto={aberto} onAbertoChange={setAberto}>
      <Button
        variant="ghost"
        size={comRotulo ? "default" : "icon"}
        aria-label={comRotulo ? undefined : "Pedir ajuda"}
        className={className}
      >
        <LifeBuoy data-icon={comRotulo ? "inline-start" : undefined} />
        {comRotulo && "Pedir ajuda"}
      </Button>
    </PedirAjuda>
  );
}
