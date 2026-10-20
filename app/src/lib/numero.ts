/**
 * Tempo dos números que contam (NumberFlow) no app (v0.7, docs/auditorias/v0.7-emil.md). O padrão da biblioteca é
 * 900 ms: o número ficava girando depois que o operador já tinha olhado. Aqui é ease-out forte em 280 ms, com o
 * fade em 180 ms, o mesmo vocabulário de src/styles/movimento.css. Valores que só mudam por navegação (meta do turno,
 * durações) ficam com animated={false}.
 */
export const TEMPO_DO_NUMERO = {
  transformTiming: { duration: 280, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
  spinTiming: { duration: 280, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
  opacityTiming: { duration: 180, easing: "ease-out" },
} as const;
