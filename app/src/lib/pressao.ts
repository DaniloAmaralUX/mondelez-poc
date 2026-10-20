/**
 * Retorno de toque das ações primárias e das respostas do operador (doc 11 §5, docs/12 §2 item 3): a pressão aparece
 * no pointerdown e a ação acontece no pointerup. v0.7: a classe só marca o elemento; a regra (escala 0,96 em 140 ms, e
 * nenhuma escala com "reduzir movimento") é a mesma dos botões, em src/styles/movimento.css. Antes este utilitário somava
 * a própria escala à do tema e o C/NC/N/A descia a 0,94.
 */
export const PRESSAO = "pressao";
