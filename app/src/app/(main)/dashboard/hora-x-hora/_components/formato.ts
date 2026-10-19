import type { Farol } from "@/domain/producao";

const TON_HORA = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TON_TURNO = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const INTEIRO = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const PCT = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });

/** Toneladas de uma hora, com duas casas: a diferença para a meta da hora fica na segunda casa (2,69 × 2,86). */
export const tonHora = (t: number) => `${TON_HORA.format(t)} t`;
/** Toneladas acumuladas ou do turno, com uma casa. */
export const tonTurno = (t: number) => `${TON_TURNO.format(t)} t`;
export const inteiro = (n: number) => INTEIRO.format(n);
export const pct = (razao: number) => PCT.format(razao);

/** Formato do NumberFlow para toneladas do turno (uma casa, vírgula). */
export const FORMATO_TON = { minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;

/** Rótulo do farol (RN-05) e variante do `Status` do template. O texto diz o estado: a cor nunca fica sozinha. */
export const FAROL: Record<Farol, { rotulo: string; variante: "success" | "warning" | "error" }> = {
  verde: { rotulo: "Na meta", variante: "success" },
  amarelo: { rotulo: "Perto da meta", variante: "warning" },
  vermelho: { rotulo: "Abaixo da meta", variante: "error" },
};

/** Motivos de uma hora abaixo da meta (RM-10). "Outro" pede o texto. */
export const MOTIVOS_HORA = ["Falha de máquina", "Falta de material", "Troca de SKU", "Setup", "Outro"] as const;

/** Motivo gravado no apontamento: "Setup", "Setup: troca de faca" ou o texto de "Outro". */
export function juntarMotivo(motivo: string, detalhe: string): string | undefined {
  const texto = detalhe.trim();
  if (!motivo) return texto || undefined;
  if (motivo === "Outro") return texto ? `Outro: ${texto}` : undefined;
  return texto ? `${motivo}: ${texto}` : motivo;
}

/** O inverso de `juntarMotivo`, para corrigir um apontamento: separa o motivo da lista do texto livre. */
export function separarMotivo(
  gravado: string | undefined,
  lista: readonly string[] = MOTIVOS_HORA,
): { motivo: string; detalhe: string } {
  if (!gravado) return { motivo: "", detalhe: "" };
  const conhecido = lista.find((m) => gravado === m || gravado.startsWith(`${m}: `));
  if (!conhecido) return { motivo: lista.includes("Outro") ? "Outro" : "", detalhe: gravado };
  return { motivo: conhecido, detalhe: gravado.slice(conhecido.length + 2) };
}
