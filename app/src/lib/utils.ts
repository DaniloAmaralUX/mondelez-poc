/** Partículas de nomes em português que não entram nas iniciais. */
const PARTICULAS = new Set(["da", "das", "de", "di", "do", "dos", "du", "e"]);

/**
 * Iniciais para avatar: primeira letra da primeira e da última palavra (no máximo 2 letras).
 * Antes juntava a inicial de todas as palavras, e nomes longos vazavam do avatar (teste de estresse, v0.3).
 */
export const getInitials = (str: string): string => {
  if (typeof str !== "string" || !str.trim()) return "?";

  const palavras = str.trim().split(/\s+/).filter(Boolean);
  const nomes = palavras.filter((p) => !PARTICULAS.has(p.toLowerCase()));
  const base = nomes.length > 0 ? nomes : palavras;
  const primeira = base[0]?.[0] ?? "";
  const ultima = base.length > 1 ? (base[base.length - 1]?.[0] ?? "") : "";
  return (primeira + ultima).toUpperCase() || "?";
};

export function formatCurrency(
  amount: number,
  opts?: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    noDecimals?: boolean;
  },
) {
  const { currency = "USD", locale = "en-US", minimumFractionDigits, maximumFractionDigits, noDecimals } = opts ?? {};

  const formatOptions: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
    minimumFractionDigits: noDecimals ? 0 : minimumFractionDigits,
    maximumFractionDigits: noDecimals ? 0 : maximumFractionDigits,
  };

  return new Intl.NumberFormat(locale, formatOptions).format(amount);
}
