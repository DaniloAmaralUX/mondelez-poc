"use client";

import { localRepository } from "@/data/repository";
import { turnoAtual } from "@/domain/turno";
import { formatarHora, primeiroNome } from "@/lib/format";
import { useAgora, useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

function saudacao(agora: Date) {
  const h = agora.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function Greeting() {
  const usuario = useUsuarioAtual();
  const contexto = useSessionStore((s) => s.contexto);
  const agora = useAgora();
  const turno = turnoAtual(agora);
  const { linha, posto } = contexto ? localRepository.descreverContexto(contexto) : {};

  return (
    // Com pouca altura útil (paisagem com o teclado do Android aberto, src/styles/tablet.css), título e turno menores.
    <div className="flex flex-col gap-2 pouca-altura:gap-1">
      <h1 className="pouca-altura:text-2xl text-3xl text-foreground leading-none tracking-tight">
        {saudacao(agora)}, {usuario ? primeiroNome(usuario.nome) : ""}.
      </h1>
      <p className="pouca-altura:text-base text-lg text-muted-foreground leading-tight">
        {turno.numero}º turno, das {formatarHora(turno.inicio)} às {formatarHora(turno.fim)}
        {linha && posto ? ` · ${linha.nome} · ${posto.nome}` : ""}
      </p>
    </div>
  );
}
