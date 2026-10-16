import { chaveTurno } from "./turno";
import type { Conclusao, Criticidade, Perfil, RotinaTemplate, TarefaInstancia, Turno } from "./types";

const MIN = 60 * 1000;

export interface GerarTarefasInput {
  templates: readonly RotinaTemplate[];
  postoId: string;
  perfil: Perfil;
  turno: Turno;
  agora: Date;
  conclusoes: Readonly<Record<string, Conclusao>>;
}

const PESO_CRITICIDADE: Record<Criticidade, number> = { critica: 0, alta: 1, normal: 2 };

/** Gera as tarefas do turno para o posto e o perfil, com estado derivado do relógio e das conclusões. */
export function gerarTarefas({ templates, postoId, perfil, turno, agora, conclusoes }: GerarTarefasInput) {
  const chave = chaveTurno(turno);
  const tarefas: TarefaInstancia[] = [];

  for (const t of templates) {
    if (!t.postoIds.includes(postoId) || !t.perfis.includes(perfil)) continue;

    for (const janela of janelasDoTurno(t, turno)) {
      const id = janela.sufixo ? `${t.id}@${chave}#${janela.sufixo}` : `${t.id}@${chave}`;
      const conclusao = conclusoes[id];
      tarefas.push({
        id,
        templateId: t.id,
        moduloSlug: t.moduloSlug,
        titulo: t.titulo,
        equipamentoId: t.equipamentoId,
        criticidade: t.criticidade,
        abre: janela.abre,
        prazo: janela.prazo,
        futura: !conclusao && agora < janela.abre,
        estado: derivarEstado(conclusao, janela.prazo, agora),
        concluidaEm: conclusao && conclusao.estado !== "em_andamento" ? new Date(conclusao.em) : undefined,
      });
    }
  }

  return tarefas.sort(compararTarefas);
}

function janelasDoTurno(t: RotinaTemplate, turno: Turno) {
  const { inicioMin, duracaoMin } = t.janela;
  const em = (base: Date, min: number) => new Date(base.getTime() + min * MIN);

  switch (t.frequencia.tipo) {
    case "turno":
      return [{ sufixo: "", abre: em(turno.inicio, inicioMin), prazo: em(turno.inicio, inicioMin + duracaoMin) }];
    case "semanal":
      if (turno.data.getDay() !== t.frequencia.diaDaSemana) return [];
      return [{ sufixo: "", abre: em(turno.inicio, inicioMin), prazo: em(turno.inicio, inicioMin + duracaoMin) }];
    case "hora": {
      const janelas = [];
      const passo = t.frequencia.aCadaHoras * 60;
      const duracaoTurno = (turno.fim.getTime() - turno.inicio.getTime()) / MIN;
      for (let bloco = 0; bloco < duracaoTurno; bloco += passo) {
        const base = em(turno.inicio, bloco);
        janelas.push({
          sufixo: String(base.getHours()).padStart(2, "0"),
          abre: em(base, inicioMin),
          prazo: em(base, inicioMin + duracaoMin),
        });
      }
      return janelas;
    }
  }
}

function derivarEstado(conclusao: Conclusao | undefined, prazo: Date, agora: Date) {
  if (conclusao?.estado === "feita" || conclusao?.estado === "com_nc") return conclusao.estado;
  if (agora > prazo) return "atrasada";
  return conclusao?.estado === "em_andamento" ? "em_andamento" : "a_fazer";
}

/** Ordem da Minha Rotina: pendentes antes de concluídas; atrasadas primeiro; depois prazo e criticidade. */
export function compararTarefas(a: TarefaInstancia, b: TarefaInstancia): number {
  const grupo = (t: TarefaInstancia) => {
    if (concluida(t)) return 2;
    return t.estado === "atrasada" ? 0 : 1;
  };
  return (
    grupo(a) - grupo(b) ||
    a.prazo.getTime() - b.prazo.getTime() ||
    PESO_CRITICIDADE[a.criticidade] - PESO_CRITICIDADE[b.criticidade] ||
    a.titulo.localeCompare(b.titulo, "pt-BR")
  );
}

export function concluida(t: TarefaInstancia): boolean {
  return t.estado === "feita" || t.estado === "com_nc";
}

/** A próxima tarefa a fazer agora: a primeira pendente com a janela já aberta. */
export function proximaTarefa(tarefas: readonly TarefaInstancia[]): TarefaInstancia | undefined {
  return tarefas.find((t) => !concluida(t) && !t.futura);
}
