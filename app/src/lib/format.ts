const hora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const diaLongo = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });

export function formatarHora(d: Date): string {
  return hora.format(d);
}

export function formatarDia(d: Date): string {
  return diaLongo.format(d);
}

/** Duração em linguagem de chão de fábrica: "45 min", "1 h", "1 h 20 min". */
export function formatarDuracao(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (h === 0) return `${min} min`;
  return min === 0 ? `${h} h` : `${h} h ${min} min`;
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}
