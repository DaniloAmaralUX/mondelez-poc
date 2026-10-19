import { CalendarDays, Megaphone, PartyPopper, UsersRound, Wrench } from "lucide-react";

import { localRepository } from "@/data/repository";
import { dataLocal } from "@/domain/producao";
import type { Recado, TipoRecado } from "@/domain/types";

export const TIPOS_DE_RECADO: readonly TipoRecado[] = ["recado", "parada", "visita", "evento", "agenda"];

export const NOME_DO_TIPO: Record<TipoRecado, string> = {
  recado: "Recado",
  parada: "Parada",
  visita: "Visita",
  evento: "Evento",
  agenda: "Compromisso",
};

export const ICONE_DO_TIPO: Record<TipoRecado, typeof Wrench> = {
  recado: Megaphone,
  parada: Wrench,
  visita: UsersRound,
  evento: PartyPopper,
  agenda: CalendarDays,
};

/**
 * Tinta por tipo, sempre junto do ícone e do nome do tipo (a cor nunca é a única pista). Paleta nomeada do Tailwind
 * (regras do código), tom 700/800 no texto para ficar acima de 4,5:1 sobre o fundo 500/15.
 */
export const TINTA_DO_TIPO: Record<TipoRecado, string> = {
  recado: "bg-muted text-muted-foreground",
  parada: "bg-orange-500/15 text-orange-800 dark:text-orange-300",
  visita: "bg-sky-500/15 text-sky-800 dark:text-sky-300",
  evento: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  agenda: "bg-zinc-500/15 text-zinc-800 dark:text-zinc-200",
};

/** Data local de uma chave AAAA-MM-DD. */
export function deChave(data: string): Date {
  const [a, m, d] = data.split("-").map(Number);
  return new Date(a ?? 2026, (m ?? 1) - 1, d ?? 1);
}

const DIA = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric", month: "short" });
const DIA_LONGO = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });
const HORA = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** "qua., 21 de out. · 14:00–16:00". */
export function quandoDoRecado(recado: Recado): string | null {
  if (!recado.data) return null;
  const dia = DIA.format(deChave(recado.data));
  return recado.horario ? `${dia} · ${recado.horario}` : dia;
}

/** "Quarta-feira, 21 de outubro" (com "Hoje, " ou "Amanhã, " pelo relógio da demo). */
export function rotuloDoDia(data: string, hoje: string): string {
  const longo = DIA_LONGO.format(deChave(data));
  const amanha = new Date(deChave(hoje));
  amanha.setDate(amanha.getDate() + 1);
  if (data === hoje) return `Hoje, ${longo}`;
  if (data === dataLocal(amanha)) return `Amanhã, ${longo}`;
  return longo.charAt(0).toUpperCase() + longo.slice(1);
}

/** "Bis 2" ou "Fábrica toda". */
export function ondeDoRecado(recado: Recado): string {
  return recado.linhaId ? (localRepository.linha(recado.linhaId)?.nome ?? recado.linhaId) : "Fábrica toda";
}

/** "Carlos Mendes, hoje às 06:10" pelo relógio da demonstração. */
export function publicacao(recado: Recado, agora: Date): string {
  const autor = localRepository.usuario(recado.autorId)?.nome ?? "Fábrica";
  const em = new Date(recado.em);
  const dias = Math.round(
    (new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime() -
      new Date(em.getFullYear(), em.getMonth(), em.getDate()).getTime()) /
      86_400_000,
  );
  let quando = DIA.format(em);
  if (dias === 0) quando = "hoje";
  else if (dias === 1) quando = "ontem";
  return `${autor}, ${quando} às ${HORA.format(em)}`;
}
