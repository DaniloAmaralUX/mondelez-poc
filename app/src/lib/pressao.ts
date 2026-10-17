/**
 * Retorno de toque das ações primárias e das respostas do operador (doc 11 §5, docs/12 §2 item 3): a pressão aparece
 * no pointerdown (`active:`) e a ação acontece no pointerup. Com prefers-reduced-motion o retorno de escala fica, sem a
 * transição. Uma definição só para checklist, Minha Rotina e Alertas.
 */
export const PRESSAO = "transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none";
