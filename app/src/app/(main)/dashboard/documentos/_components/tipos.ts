import { BookOpen, FileText, GraduationCap, type LucideIcon } from "lucide-react";

import type { DocumentoTecnico, TipoDocumento } from "@/domain/types";

export const TIPOS: readonly TipoDocumento[] = ["it", "lpp", "book"];

export const SIGLA: Record<TipoDocumento, string> = { it: "IT", lpp: "LPP", book: "Book" };

export const NOME_DO_TIPO: Record<TipoDocumento, string> = {
  it: "Instrução de trabalho",
  lpp: "Lição ponto a ponto",
  book: "Book de defeitos",
};

export const ICONE_DO_TIPO: Record<TipoDocumento, LucideIcon> = {
  it: FileText,
  lpp: GraduationCap,
  book: BookOpen,
};

const DATA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const DATA_LONGA = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" });

function deChave(data: string): Date {
  const [a, m, d] = data.split("-").map(Number);
  return new Date(a ?? 2026, (m ?? 1) - 1, d ?? 1);
}

/** "12/08/2026". */
export function dataCurta(data: string): string {
  return DATA.format(deChave(data));
}

/** "12 de agosto de 2026". */
export function dataLonga(data: string): string {
  return DATA_LONGA.format(deChave(data));
}

/** IT primeiro, depois LPP e book; no mesmo tipo, pelo título. */
export function ordenar(a: DocumentoTecnico, b: DocumentoTecnico): number {
  return TIPOS.indexOf(a.tipo) - TIPOS.indexOf(b.tipo) || a.titulo.localeCompare(b.titulo, "pt-BR");
}

/** Busca sem acento por título, código e resumo. */
export function confere(doc: DocumentoTecnico, termo: string): boolean {
  if (!termo) return true;
  const n = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const alvo = n(`${doc.titulo} ${doc.codigo} ${doc.resumo} ${doc.defeito?.modo ?? ""}`);
  return n(termo)
    .split(/\s+/)
    .every((parte) => alvo.includes(parte));
}
