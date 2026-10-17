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

const DATA_LONGA = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });

/**
 * Cabeçalho da tela no padrão Large Title do iOS (v0.4, docs/14): data como sobretítulo, saudação em 34 px semibold
 * com tracking negativo, turno e posto como subtítulo. A data vem do relógio da demonstração (useAgora), que antes do
 * IndexedDB usa o mesmo instante do servidor: a hidratação bate.
 */
export function Greeting() {
  const usuario = useUsuarioAtual();
  const contexto = useSessionStore((s) => s.contexto);
  const agora = useAgora();
  const turno = turnoAtual(agora);
  const { linha, posto } = contexto ? localRepository.descreverContexto(contexto) : {};
  const data = DATA_LONGA.format(agora);

  return (
    // Com pouca altura útil (paisagem com o teclado do Android aberto, src/styles/tablet.css), título e turno menores.
    <header className="flex flex-col gap-1.5 pouca-altura:gap-1">
      <p className="font-semibold text-muted-foreground text-sm first-letter:uppercase toque:text-base">{data}</p>
      <h1 className="pouca-altura:text-2xl text-[2rem] text-foreground leading-[1.1] @min-[60rem]/content:text-[2.125rem]">
        {saudacao(agora)}, {usuario ? primeiroNome(usuario.nome) : ""}.
      </h1>
      <p className="pouca-altura:text-base text-lg text-muted-foreground leading-snug">
        {turno.numero}º turno, das {formatarHora(turno.inicio)} às {formatarHora(turno.fim)}
        {linha && posto ? ` · ${linha.nome} · ${posto.nome}` : ""}
      </p>
    </header>
  );
}
