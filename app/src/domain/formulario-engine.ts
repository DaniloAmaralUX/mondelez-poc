import { LIMITES, limitarTexto } from "./limites";
import type { Formulario, ItemFormulario, Resposta, ValorCnc } from "./types";

export type SituacaoItem = "pendente" | ValorCnc;

/** Tamanho mínimo da justificativa de um item não conforme (RN-02). */
export const MIN_JUSTIFICATIVA = 10;
/** Tamanho máximo da justificativa (fronteira de dados, `LIMITES`). */
export const MAX_JUSTIFICATIVA = LIMITES.justificativa;
/** Tamanho máximo da resposta de texto de um item (lote). */
export const MAX_TEXTO_DO_ITEM = LIMITES.textoDoItem;

export function foraDaFaixa(item: ItemFormulario, numero: number | undefined): boolean {
  if (!item.faixa || numero === undefined || Number.isNaN(numero)) return false;
  return numero < item.faixa.min || numero > item.faixa.max;
}

/** Situação de um item a partir da resposta. Valor de centerline fora da faixa é não conforme. */
export function situacaoItem(item: ItemFormulario, resposta: Resposta | undefined): SituacaoItem {
  if (resposta?.valor === "NA") return "NA";

  switch (item.tipo) {
    case "cnc":
      return resposta?.valor ?? "pendente";
    case "numero":
      if (resposta?.numero === undefined || Number.isNaN(resposta.numero)) return "pendente";
      return foraDaFaixa(item, resposta.numero) ? "NC" : "C";
    case "texto":
      return resposta?.texto?.trim() ? "C" : "pendente";
  }
}

/** Erros por item: obrigatório sem resposta, não conforme sem justificativa e texto acima do limite. */
export function validarRespostas(form: Formulario, respostas: Readonly<Record<string, Resposta>>) {
  const erros: Record<string, string> = {};

  for (const item of form.itens) {
    const resposta = respostas[item.id];
    const situacao = situacaoItem(item, resposta);
    const justificativa = resposta?.justificativa?.trim().length ?? 0;

    if (situacao === "pendente") {
      erros[item.id] = item.tipo === "texto" ? "Preencha este campo." : "Responda este item.";
    } else if (item.tipo === "texto" && (resposta?.texto?.trim().length ?? 0) > MAX_TEXTO_DO_ITEM) {
      erros[item.id] = `Use até ${MAX_TEXTO_DO_ITEM} caracteres.`;
    } else if (situacao === "NC" && justificativa < MIN_JUSTIFICATIVA) {
      erros[item.id] = `Descreva o que está fora do padrão (mínimo ${MIN_JUSTIFICATIVA} caracteres).`;
    } else if (justificativa > MAX_JUSTIFICATIVA) {
      erros[item.id] = `Encurte a justificativa (até ${MAX_JUSTIFICATIVA} caracteres).`;
    }
  }

  return erros;
}

/**
 * Respostas dentro dos limites de tamanho (fronteira de dados): texto e justificativa acima do limite são cortados.
 * A validação do formulário já impede o registro nesse caso; isto só garante que nada maior chega à fila. Sem nada a
 * cortar, devolve o próprio objeto.
 */
export function limitarRespostas(respostas: Readonly<Record<string, Resposta>>): Record<string, Resposta> {
  let resultado: Record<string, Resposta> | null = null;
  for (const [id, resposta] of Object.entries(respostas)) {
    const texto = resposta.texto === undefined ? undefined : limitarTexto(resposta.texto, MAX_TEXTO_DO_ITEM);
    const justificativa =
      resposta.justificativa === undefined ? undefined : limitarTexto(resposta.justificativa, MAX_JUSTIFICATIVA);
    if (texto === resposta.texto && justificativa === resposta.justificativa) continue;
    resultado ??= { ...respostas };
    resultado[id] = {
      ...resposta,
      ...(texto === undefined ? {} : { texto }),
      ...(justificativa === undefined ? {} : { justificativa }),
    };
  }
  return resultado ?? (respostas as Record<string, Resposta>);
}

export interface ResumoFormulario {
  total: number;
  respondidos: number;
  conformes: number;
  naoConformes: number;
  naoAplicaveis: number;
  criticosNaoConformes: number;
}

export function resumirRespostas(form: Formulario, respostas: Readonly<Record<string, Resposta>>): ResumoFormulario {
  const resumo: ResumoFormulario = {
    total: form.itens.length,
    respondidos: 0,
    conformes: 0,
    naoConformes: 0,
    naoAplicaveis: 0,
    criticosNaoConformes: 0,
  };

  for (const item of form.itens) {
    const situacao = situacaoItem(item, respostas[item.id]);
    if (situacao === "pendente") continue;
    resumo.respondidos++;
    if (situacao === "C") resumo.conformes++;
    if (situacao === "NA") resumo.naoAplicaveis++;
    if (situacao === "NC") {
      resumo.naoConformes++;
      if (item.critico) resumo.criticosNaoConformes++;
    }
  }

  return resumo;
}

/** Texto do valor respondido, para o documento do registro e o alerta. */
export function descreverResposta(item: ItemFormulario, resposta: Resposta | undefined): string {
  if (resposta?.valor === "NA") return "Não se aplica";
  if (item.tipo === "numero") {
    if (resposta?.numero === undefined) return "—";
    return `${resposta.numero.toLocaleString("pt-BR")} ${item.faixa?.unidade ?? ""}`.trim();
  }
  if (item.tipo === "texto") return resposta?.texto?.trim() || "—";
  if (resposta?.valor === "C") return "Conforme";
  if (resposta?.valor === "NC") return "Não conforme";
  return "—";
}
