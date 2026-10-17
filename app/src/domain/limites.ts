/**
 * Limites de tamanho dos textos na fronteira de dados. Valem para o seed (testado), para o que o tablet grava
 * (`limitarRespostas`, observação e ações de alerta no store), para a validação do formulário (`validarRespostas`) e
 * para o `maxLength` dos campos. No piloto a API passa a aplicar os mesmos valores.
 * Contagem em unidades UTF-16, como o `maxLength` do HTML.
 */
export const LIMITES = {
  /** Resposta de texto de um item (lote, código). */
  textoDoItem: 40,
  /** Justificativa de um item não conforme. */
  justificativa: 500,
  /** Observação do registro. */
  observacao: 1000,
  /** Texto de uma ação no tratamento de um alerta. */
  acaoDoAlerta: 500,
  /** Título de rotina e de formulário. */
  titulo: 80,
  /** Grupo (etapa) dos itens de um formulário. */
  grupo: 40,
  /** Nome de equipamento (limite do SAP). */
  nomeDoEquipamento: 40,
} as const;

/** Corta o texto no limite sem partir um caractere fora do plano básico (emoji) ao meio. */
export function limitarTexto(texto: string, limite: number): string {
  if (texto.length <= limite) return texto;
  const fim = /[\uD800-\uDBFF]/.test(texto.charAt(limite - 1)) ? limite - 1 : limite;
  return texto.slice(0, fim);
}
