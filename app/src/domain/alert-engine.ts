import { descreverResposta, situacaoItem } from "./formulario-engine";
import type { AcaoAlerta, Alerta, EstadoAlerta, Formulario, Registro, TarefaInstancia } from "./types";

const MIN = 60 * 1000;
/** Atraso sem tratamento que passa de atenção para crítico (RN-01). */
export const ESCALONAMENTO_ATRASO_MIN = 30;

export interface GerarAlertasInput {
  /** Tarefas de operação dos postos acompanhados, no turno atual. */
  tarefas: readonly { postoId: string; tarefa: TarefaInstancia }[];
  registros: readonly Registro[];
  formularios: Readonly<Record<string, Formulario>>;
  /** Ações registradas pela liderança, por id de alerta. */
  tratamentos: Readonly<Record<string, AcaoAlerta[]>>;
  agora: Date;
}

/** Alertas derivados do relógio e dos registros (RN-01, RN-02), com o ciclo de tratamento aplicado. */
export function gerarAlertas({ tarefas, registros, formularios, tratamentos, agora }: GerarAlertasInput): Alerta[] {
  const alertas: Alerta[] = [];

  for (const { postoId, tarefa } of tarefas) {
    const concluidaComAtraso = tarefa.concluidaEm !== undefined && tarefa.concluidaEm > tarefa.prazo;
    if (tarefa.estado !== "atrasada" && !concluidaComAtraso) continue;

    const id = `atraso:${tarefa.id}`;
    const fimDoAtraso = tarefa.concluidaEm ?? agora;
    const minutosAtraso = (fimDoAtraso.getTime() - tarefa.prazo.getTime()) / MIN;
    const acoes: AcaoAlerta[] = [envio(tarefa.prazo), ...(tratamentos[id] ?? [])];
    if (tarefa.concluidaEm && concluidaComAtraso) {
      acoes.push({
        tipo: "automatica",
        texto: "Tarefa concluída no posto. Alerta encerrado automaticamente.",
        em: tarefa.concluidaEm.toISOString(),
      });
    }

    alertas.push(
      montar({
        id,
        regra: "A-ATRASO",
        criticidade: minutosAtraso >= ESCALONAMENTO_ATRASO_MIN ? "critico" : "atencao",
        titulo: `${tarefa.titulo} não registrada no prazo`,
        descricao: "Tarefa obrigatória do posto sem registro até o fim da janela.",
        postoId,
        equipamentoId: tarefa.equipamentoId,
        moduloSlug: tarefa.moduloSlug,
        tarefaId: tarefa.id,
        criadoEm: tarefa.prazo,
        acoes,
        itensNaoConformes: [],
      }),
    );
  }

  for (const registro of registros) {
    if (registro.naoConformes === 0) continue;
    const form = formularios[registro.formularioId];
    if (!form) continue;

    const itensNaoConformes = form.itens
      .filter((item) => situacaoItem(item, registro.respostas[item.id]) === "NC")
      .map((item) => ({
        texto: item.texto,
        detalhe: [descreverResposta(item, registro.respostas[item.id]), registro.respostas[item.id]?.justificativa]
          .filter(Boolean)
          .join(" · "),
        critico: Boolean(item.critico),
      }));

    const id = `nc:${registro.id}`;
    const criadoEm = new Date(registro.criadoEm);
    alertas.push(
      montar({
        id,
        regra: "A-NC",
        criticidade: itensNaoConformes.some((i) => i.critico) ? "critico" : "atencao",
        titulo: `${itensNaoConformes.length} ${itensNaoConformes.length === 1 ? "item não conforme" : "itens não conformes"} em ${form.titulo}`,
        descricao: "Checklist registrado com itens fora do padrão.",
        postoId: registro.postoId,
        equipamentoId: registro.equipamentoId,
        moduloSlug: form.moduloSlug,
        tarefaId: registro.tarefaId,
        registroId: registro.id,
        criadoEm,
        acoes: [envio(criadoEm), ...(tratamentos[id] ?? [])],
        itensNaoConformes,
      }),
    );
  }

  return alertas.sort(compararAlertas);
}

/** Ação de envio simulado (Teams) que abre o histórico de todo alerta. */
export function envio(em: Date): AcaoAlerta {
  return { tipo: "envio", texto: "Enviado à Supervisão e à Especialista via Teams (simulado).", em: em.toISOString() };
}

/** Alerta com as ações em ordem e o estado e o responsável derivados delas. */
export function montar(base: Omit<Alerta, "estado" | "responsavelId">): Alerta {
  const acoes = [...base.acoes].sort((a, b) => a.em.localeCompare(b.em));
  return { ...base, acoes, ...cicloDoAlerta(acoes) };
}

/** Estado e responsável a partir do histórico de ações. */
export function cicloDoAlerta(acoes: readonly AcaoAlerta[]): { estado: EstadoAlerta; responsavelId?: string } {
  let estado: EstadoAlerta = "aberto";
  let responsavelId: string | undefined;

  for (const acao of acoes) {
    if (acao.tipo === "assumir") {
      estado = "em_tratamento";
      responsavelId = acao.usuarioId;
    }
    if (acao.tipo === "resolver" || acao.tipo === "automatica") estado = "resolvido";
  }

  return { estado, responsavelId };
}

const PESO_ESTADO: Record<EstadoAlerta, number> = { aberto: 0, em_tratamento: 1, resolvido: 2 };
const PESO_CRITICIDADE = { critico: 0, atencao: 1 } as const;

/** Abertos antes de resolvidos; críticos primeiro; os mais antigos primeiro (idade). */
export function compararAlertas(a: Alerta, b: Alerta): number {
  return (
    PESO_ESTADO[a.estado] - PESO_ESTADO[b.estado] ||
    PESO_CRITICIDADE[a.criticidade] - PESO_CRITICIDADE[b.criticidade] ||
    a.criadoEm.getTime() - b.criadoEm.getTime()
  );
}
