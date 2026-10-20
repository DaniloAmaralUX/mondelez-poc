// Ações da v0.5 (docs/16), montadas dentro do store da sessão. Mesma disciplina das ações da v0.3: recusam com o
// tablet bloqueado ou sem pessoa no posto, conferem a permissão do perfil (domain/permissoes), carimbam autor e hora
// no relógio da demo e gravam já no IndexedDB (`gravarJa`).

import { localRepository } from "@/data/repository";
import { MOTIVO_AJUDA } from "@/domain/alertas-indicadores";
import { LIMITES, limitarTexto } from "@/domain/limites";
import { type Acao, pode, type Recurso } from "@/domain/permissoes";
import { chaveTurno, turnoAtual } from "@/domain/turno";
import type {
  AjusteEscala,
  ApontamentoHora,
  ApontamentoPerdas,
  CanalNotificacao,
  Conclusao,
  EventoFalha,
  Formulario,
  MotivoAjuda,
  Notificacao,
  NumeroTurno,
  PedidoAjuda,
  Perfil,
  PlanoProducao,
  Recado,
  RespostasDaTroca,
  TarefaInstancia,
  TrocaDeTurno,
  Turma,
  Usuario,
} from "@/domain/types";
import type { DadosV5, RelatorioEnviado } from "@/lib/sessao/migracao";
import { inicioDoBlocoDePerdas } from "@/lib/sessao/perdas";

/** Tempo em que quem apontou uma falha ainda pode apagá-la (toque errado). */
export const JANELA_APAGAR_FALHA_MS = 5 * 60_000;

export type ResultadoCadastro =
  | { ok: true; usuario: Usuario }
  | { ok: false; campo: "matricula" | "nome"; erro: string };

export interface AcoesV05 {
  /** Hora x Hora: aponta (ou corrige) as caixas da hora e conclui a tarefa do bloco. */
  apontarHora: (input: {
    tarefa: TarefaInstancia;
    skuId: string;
    caixas: number;
    motivo?: string;
  }) => ApontamentoHora | undefined;
  /** Sobrepeso, refugo e reprocesso do bloco; conclui a tarefa. */
  apontarPerdas: (input: {
    tarefa: TarefaInstancia;
    sobrepesoG: number;
    refugoKg: number;
    reprocessoKg: number;
    motivo?: string;
    observacao?: string;
  }) => ApontamentoPerdas | undefined;
  /** MTBF: primeiro toque abre a falha (hora automática). Recusa se já há uma falha aberta desse tipo no equipamento. */
  abrirFalha: (input: { equipamentoId: string; tipoId: string }) => EventoFalha | undefined;
  /** Segundo toque ou "Resolvido": encerra a falha. */
  encerrarFalha: (falhaId: string) => boolean;
  /** Apaga um toque errado: só quem apontou, até `JANELA_APAGAR_FALHA_MS`. */
  apagarFalha: (falhaId: string) => boolean;
  /**
   * Entrega o posto (RM-13). Id \`postoId|turnoChave\` do turno atual; conclui a tarefa de troca de turno da pessoa,
   * se informada. Entregar de novo substitui a entrega enquanto ninguém aceitou.
   */
  entregarTurno: (
    input: Omit<
      TrocaDeTurno,
      "id" | "postoId" | "turnoChave" | "entreguePor" | "entregueEm" | "aceitePor" | "aceiteEm"
    > & {
      tarefaId?: string;
    },
  ) => TrocaDeTurno | undefined;
  /**
   * Aceite de quem recebe o turno, com o PIN dessa pessoa (RN-10). Não troca a pessoa logada. Mesma contagem de PINs
   * errados do login.
   */
  aceitarTurno: (trocaId: string, usuarioId: string, pin: string) => { ok: true } | { ok: false; erro: string };
  /**
   * Rascunho da passagem enquanto a pessoa digita (`postoId|turnoChave` do turno atual, com o autor). Sair da tela não
   * perde o texto; outra pessoa no tablet não vê o rascunho de quem saiu. A entrega apaga o rascunho.
   */
  salvarRascunhoTroca: (respostas: RespostasDaTroca) => void;
  descartarRascunhoTroca: () => void;
  /** Pedido de ajuda com o contexto da tela (RF-14). Vira alerta A-AJUDA e mensagem no Teams (simulado). */
  pedirAjuda: (input: {
    motivo: MotivoAjuda;
    texto: string;
    equipamentoId?: string;
    tarefaId?: string;
    origem?: string;
  }) => PedidoAjuda | undefined;
  /** Agenda e recados: Gerência e Assistência publicam (doc 05 §4). */
  publicarRecado: (input: Omit<Recado, "id" | "autorId" | "em">) => Recado | undefined;
  /** Retira um recado: quem publicou, ou a Gerência. */
  removerRecado: (recadoId: string) => boolean;
  /** Publica o plano da semana (importado do Excel): Assistência. */
  publicarPlano: (
    plano: Omit<PlanoProducao, "publicadoPor" | "publicadoEm" | "origem"> & { origem?: PlanoProducao["origem"] },
  ) => PlanoProducao | undefined;
  /** Ajuste pontual da escala: Assistência. */
  ajustarEscala: (input: {
    usuarioId: string;
    data: string;
    turno: NumeroTurno | "folga";
    motivo?: string;
  }) => AjusteEscala | undefined;
  removerAjusteEscala: (ajusteId: string) => boolean;
  /** Cadastro de pessoa pela Assistência (ou Gerência), ligada a um posto. PIN inicial de demonstração. */
  cadastrarUsuario: (input: {
    nome: string;
    matricula: string;
    perfil: Perfil;
    cargo: string;
    turma?: Turma;
    postoId?: string;
  }) => ResultadoCadastro;
  /**
   * Publica uma nova versão do checklist (Especialista ou Gerência): versão vigente + 1. Os registros antigos guardam a
   * versão com que foram feitos; as tarefas seguintes usam a nova.
   */
  publicarFormulario: (formulario: Formulario) => Formulario | undefined;
  /** Envia o relatório do turno da linha à liderança (Teams e e-mail simulados) e conclui a tarefa, se informada. */
  enviarRelatorio: (input: {
    linhaId: string;
    turnoChave: string;
    resumo: string;
    tarefaId?: string;
  }) => RelatorioEnviado | undefined;
}

export interface DependenciasV05 {
  getState: () => DadosV5 & {
    usuarioId: string | null;
    bloqueado: boolean;
    contexto: { plantaId: string; linhaId: string; postoId: string } | null;
    conclusoes: Record<string, Conclusao>;
  };
  setState: (
    parcial:
      | Partial<DadosV5 & { conclusoes: Record<string, Conclusao> }>
      | ((
          s: DadosV5 & { conclusoes: Record<string, Conclusao> },
        ) => Partial<DadosV5 & { conclusoes: Record<string, Conclusao> }>),
  ) => void;
  agora: () => Date;
  gravarJa: () => void;
  /** Confere o PIN de uma pessoa com a contagem de tentativas do login; null = certo. */
  conferirPin: (usuario: Usuario, pin: string) => { erro: string } | null;
}

let sequencia = 0;
function novoId(prefixo: string, agora: Date): string {
  sequencia = (sequencia + 1) % 1000;
  return `${prefixo}-${agora.getTime().toString(36)}${sequencia.toString(36)}`;
}

const numeroValido = (n: number, max = 100_000) => Number.isFinite(n) && n >= 0 && n <= max;

export function criarAcoesV05(d: DependenciasV05): AcoesV05 {
  /** Pessoa no posto com permissão; senão undefined. */
  const autorizado = (recurso: Recurso, acao: Acao): Usuario | undefined => {
    const s = d.getState();
    if (!s.usuarioId || s.bloqueado) return undefined;
    const usuario = localRepository.usuario(s.usuarioId);
    return usuario && pode(usuario.perfil, recurso, acao) ? usuario : undefined;
  };

  const notificacao = (
    canal: CanalNotificacao,
    para: Perfil[],
    assunto: string,
    corpo: string,
    origem: Notificacao["origem"],
    em: Date,
  ): Notificacao => ({ id: novoId(`not-${canal}`, em), canal, para, assunto, corpo, origem, em: em.toISOString() });

  const concluir = (
    tarefaId: string | undefined,
    usuarioId: string,
    em: string,
    estado: Conclusao["estado"] = "feita",
  ) => (tarefaId ? { [tarefaId]: { estado, em, usuarioId } } : {});

  return {
    apontarHora: ({ tarefa, skuId, caixas, motivo }) => {
      const usuario = autorizado("apontamentos", "escrever");
      const { contexto } = d.getState();
      if (!usuario || !contexto || !numeroValido(caixas, 5000) || !localRepository.sku(skuId)) return undefined;
      const agora = d.agora();
      const apontamento: ApontamentoHora = {
        id: tarefa.id,
        postoId: contexto.postoId,
        linhaId: contexto.linhaId,
        turnoChave: chaveTurno(turnoAtual(tarefa.abre)),
        bloco: inicioDoBlocoDePerdas(tarefa.abre).toISOString(),
        skuId,
        caixas: Math.round(caixas),
        motivo: motivo?.trim() ? limitarTexto(motivo.trim(), LIMITES.justificativa) : undefined,
        usuarioId: usuario.id,
        em: agora.toISOString(),
      };
      d.setState((s) => ({
        apontamentosHora: { ...s.apontamentosHora, [apontamento.id]: apontamento },
        conclusoes: { ...s.conclusoes, ...concluir(tarefa.id, usuario.id, apontamento.em) },
      }));
      d.gravarJa();
      return apontamento;
    },

    apontarPerdas: ({ tarefa, sobrepesoG, refugoKg, reprocessoKg, motivo, observacao }) => {
      const usuario = autorizado("apontamentos", "escrever");
      const { contexto } = d.getState();
      if (!usuario || !contexto) return undefined;
      if (![sobrepesoG, refugoKg, reprocessoKg].every((n) => numeroValido(n, 10_000))) return undefined;
      const agora = d.agora();
      const apontamento: ApontamentoPerdas = {
        id: tarefa.id,
        postoId: contexto.postoId,
        turnoChave: chaveTurno(turnoAtual(tarefa.abre)),
        bloco: tarefa.abre.toISOString(),
        sobrepesoG,
        refugoKg,
        reprocessoKg,
        motivo: motivo?.trim() ? limitarTexto(motivo.trim(), LIMITES.justificativa) : undefined,
        observacao: observacao?.trim() ? limitarTexto(observacao.trim(), LIMITES.observacao) : undefined,
        usuarioId: usuario.id,
        em: agora.toISOString(),
      };
      d.setState((s) => ({
        apontamentosPerdas: { ...s.apontamentosPerdas, [apontamento.id]: apontamento },
        conclusoes: { ...s.conclusoes, ...concluir(tarefa.id, usuario.id, apontamento.em) },
      }));
      d.gravarJa();
      return apontamento;
    },

    abrirFalha: ({ equipamentoId, tipoId }) => {
      const usuario = autorizado("apontamentos", "escrever");
      const { contexto, falhas } = d.getState();
      const equipamento = localRepository.equipamento(equipamentoId);
      if (!usuario || !contexto || !equipamento || !localRepository.tiposFalha().some((t) => t.id === tipoId)) {
        return undefined;
      }
      const aberta = Object.values(falhas).some(
        (f) => !f.fim && f.equipamentoId === equipamentoId && f.tipoId === tipoId,
      );
      if (aberta) return undefined;
      const agora = d.agora();
      const falha: EventoFalha = {
        id: novoId("falha", agora),
        postoId: equipamento.postoId,
        equipamentoId,
        turnoChave: chaveTurno(turnoAtual(agora)),
        tipoId,
        inicio: agora.toISOString(),
        usuarioId: usuario.id,
      };
      d.setState((s) => ({ falhas: { ...s.falhas, [falha.id]: falha } }));
      d.gravarJa();
      return falha;
    },

    encerrarFalha: (falhaId) => {
      const usuario = autorizado("apontamentos", "escrever");
      const falha = d.getState().falhas[falhaId];
      if (!usuario || !falha || falha.fim) return false;
      const fim = d.agora().toISOString();
      d.setState((s) => ({
        falhas: {
          ...s.falhas,
          [falhaId]: { ...falha, fim, ...(usuario.id === falha.usuarioId ? {} : { encerradaPor: usuario.id }) },
        },
      }));
      d.gravarJa();
      return true;
    },

    apagarFalha: (falhaId) => {
      const s = d.getState();
      const falha = s.falhas[falhaId];
      if (!falha || s.bloqueado || s.usuarioId !== falha.usuarioId) return false;
      if (d.agora().getTime() - new Date(falha.inicio).getTime() > JANELA_APAGAR_FALHA_MS) return false;
      d.setState((atual) => ({
        falhas: Object.fromEntries(Object.entries(atual.falhas).filter(([id]) => id !== falhaId)),
      }));
      d.gravarJa();
      return true;
    },

    entregarTurno: ({ tarefaId, ...input }) => {
      const usuario = autorizado("troca-de-turno", "escrever");
      const { contexto, trocasDeTurno } = d.getState();
      if (!usuario || !contexto) return undefined;
      const agora = d.agora();
      const turnoChave = chaveTurno(turnoAtual(agora));
      const id = `${contexto.postoId}|${turnoChave}`;
      if (trocasDeTurno[id]?.aceitePor) return undefined;
      const texto = (t: string) => limitarTexto(t.trim(), LIMITES.observacao);
      const troca: TrocaDeTurno = {
        ...input,
        id,
        postoId: contexto.postoId,
        turnoChave,
        etiquetasAbertas: Math.max(0, Math.round(input.etiquetasAbertas)),
        ondeEtiquetas: texto(input.ondeEtiquetas),
        paradas: texto(input.paradas),
        pendencias: texto(input.pendencias),
        pedidosAjuda: texto(input.pedidosAjuda),
        comentario: texto(input.comentario),
        entreguePor: usuario.id,
        entregueEm: agora.toISOString(),
      };
      d.setState((s) => ({
        trocasDeTurno: { ...s.trocasDeTurno, [id]: troca },
        rascunhosTroca: Object.fromEntries(Object.entries(s.rascunhosTroca).filter(([chave]) => chave !== id)),
        conclusoes: { ...s.conclusoes, ...concluir(tarefaId, usuario.id, troca.entregueEm) },
      }));
      d.gravarJa();
      return troca;
    },

    salvarRascunhoTroca: (respostas) => {
      const usuario = autorizado("troca-de-turno", "escrever");
      const { contexto, trocasDeTurno } = d.getState();
      if (!usuario || !contexto) return;
      const agora = d.agora();
      const id = `${contexto.postoId}|${chaveTurno(turnoAtual(agora))}`;
      if (trocasDeTurno[id]) return;
      const texto = (t: string) => limitarTexto(t, LIMITES.observacao);
      d.setState((s) => ({
        rascunhosTroca: {
          ...s.rascunhosTroca,
          [id]: {
            id,
            usuarioId: usuario.id,
            em: agora.toISOString(),
            respostas: {
              etiquetasAbertas: respostas.etiquetasAbertas.slice(0, 4),
              ondeEtiquetas: texto(respostas.ondeEtiquetas),
              paradas: texto(respostas.paradas),
              pendencias: texto(respostas.pendencias),
              pedidosAjuda: texto(respostas.pedidosAjuda),
              comentario: texto(respostas.comentario),
            },
          },
        },
      }));
    },

    descartarRascunhoTroca: () => {
      const { contexto } = d.getState();
      if (!contexto) return;
      const id = `${contexto.postoId}|${chaveTurno(turnoAtual(d.agora()))}`;
      d.setState((s) => ({
        rascunhosTroca: Object.fromEntries(Object.entries(s.rascunhosTroca).filter(([chave]) => chave !== id)),
      }));
    },

    aceitarTurno: (trocaId, usuarioId, pin) => {
      const s = d.getState();
      const troca = s.trocasDeTurno[trocaId];
      const quemRecebe = localRepository.usuario(usuarioId);
      if (!troca || s.bloqueado || !s.usuarioId) return { ok: false, erro: "Entrega não encontrada." };
      if (troca.aceitePor) return { ok: false, erro: "Este turno já foi recebido." };
      if (!quemRecebe || !pode(quemRecebe.perfil, "troca-de-turno", "escrever")) {
        return { ok: false, erro: "Escolha quem recebe o posto." };
      }
      if (quemRecebe.id === troca.entreguePor)
        return { ok: false, erro: "Quem entrega não pode receber o próprio turno." };
      const recusa = d.conferirPin(quemRecebe, pin);
      if (recusa) return { ok: false, erro: recusa.erro };
      d.setState((atual) => ({
        trocasDeTurno: {
          ...atual.trocasDeTurno,
          [trocaId]: { ...troca, aceitePor: quemRecebe.id, aceiteEm: d.agora().toISOString() },
        },
      }));
      d.gravarJa();
      return { ok: true };
    },

    pedirAjuda: ({ motivo, texto, equipamentoId, tarefaId, origem }) => {
      const s = d.getState();
      if (!s.usuarioId || s.bloqueado || !s.contexto) return undefined;
      const descricao = limitarTexto(texto.trim(), LIMITES.justificativa);
      if (!descricao) return undefined;
      const agora = d.agora();
      const pedido: PedidoAjuda = {
        id: novoId("ajuda", agora),
        postoId: s.contexto.postoId,
        equipamentoId,
        tarefaId,
        origem,
        motivo,
        texto: descricao,
        usuarioId: s.usuarioId,
        em: agora.toISOString(),
      };
      const posto = localRepository.posto(pedido.postoId);
      const linha = posto ? localRepository.linha(posto.linhaId) : undefined;
      const pessoa = localRepository.usuario(s.usuarioId);
      const aviso = notificacao(
        "teams",
        ["supervisao", "especialista"],
        `Pedido de ajuda · ${MOTIVO_AJUDA[motivo]} · ${linha?.nome ?? ""} ${posto?.nome ?? ""}`.trim(),
        `${pessoa?.nome ?? "Operação"}: ${descricao}`,
        { tipo: "ajuda", id: pedido.id },
        agora,
      );
      d.setState((atual) => ({
        pedidosAjuda: { ...atual.pedidosAjuda, [pedido.id]: pedido },
        notificacoes: { ...atual.notificacoes, [aviso.id]: aviso },
      }));
      d.gravarJa();
      return pedido;
    },

    publicarRecado: (input) => {
      const usuario = autorizado("agenda", "administrar");
      const titulo = limitarTexto(input.titulo.trim(), LIMITES.titulo);
      if (!usuario || !titulo) return undefined;
      const agora = d.agora();
      const recado: Recado = {
        ...input,
        titulo,
        horario: input.horario?.trim() || undefined,
        id: novoId("recado", agora),
        autorId: usuario.id,
        em: agora.toISOString(),
      };
      const aviso = notificacao(
        "email",
        ["operacao", "supervisao", "gerencia", "especialista", "assistencia"],
        `Agenda da fábrica: ${titulo}`,
        [recado.data, recado.horario].filter(Boolean).join(" · ") || "Novo recado no tablet.",
        { tipo: "recado", id: recado.id },
        agora,
      );
      d.setState((s) => ({
        recados: { ...s.recados, [recado.id]: recado },
        notificacoes: { ...s.notificacoes, [aviso.id]: aviso },
      }));
      d.gravarJa();
      return recado;
    },

    removerRecado: (recadoId) => {
      const s = d.getState();
      const recado = s.recados[recadoId];
      const usuario = autorizado("agenda", "administrar");
      if (!recado || !usuario || (recado.autorId !== usuario.id && usuario.perfil !== "gerencia")) return false;
      d.setState((atual) => ({
        recados: Object.fromEntries(Object.entries(atual.recados).filter(([id]) => id !== recadoId)),
      }));
      d.gravarJa();
      return true;
    },

    publicarPlano: (input) => {
      const usuario = autorizado("plano", "administrar");
      if (!usuario || input.itens.length === 0) return undefined;
      const plano: PlanoProducao = {
        ...input,
        origem: input.origem ?? "excel",
        publicadoPor: usuario.id,
        publicadoEm: d.agora().toISOString(),
      };
      d.setState((s) => ({ planos: { ...s.planos, [plano.semana]: plano } }));
      d.gravarJa();
      return plano;
    },

    ajustarEscala: ({ usuarioId, data, turno, motivo }) => {
      const usuario = autorizado("escala", "administrar");
      if (!usuario || !localRepository.usuario(usuarioId) || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return undefined;
      const ajuste: AjusteEscala = {
        id: `${usuarioId}|${data}`,
        usuarioId,
        data,
        turno,
        motivo: motivo?.trim() ? limitarTexto(motivo.trim(), LIMITES.titulo) : undefined,
        autorId: usuario.id,
        em: d.agora().toISOString(),
      };
      d.setState((s) => ({ ajustesEscala: { ...s.ajustesEscala, [ajuste.id]: ajuste } }));
      d.gravarJa();
      return ajuste;
    },

    removerAjusteEscala: (ajusteId) => {
      if (!autorizado("escala", "administrar") || !d.getState().ajustesEscala[ajusteId]) return false;
      d.setState((s) => ({
        ajustesEscala: Object.fromEntries(Object.entries(s.ajustesEscala).filter(([id]) => id !== ajusteId)),
      }));
      d.gravarJa();
      return true;
    },

    cadastrarUsuario: ({ nome, matricula, perfil, cargo, turma, postoId }) => {
      const autor = autorizado("usuarios", "administrar");
      const nomeLimpo = limitarTexto(nome.trim().replace(/\s+/g, " "), LIMITES.titulo);
      const matriculaLimpa = matricula.trim();
      if (!autor) return { ok: false, campo: "nome", erro: "Sem permissão para cadastrar pessoas." };
      if (nomeLimpo.split(" ").length < 2) return { ok: false, campo: "nome", erro: "Informe nome e sobrenome." };
      if (!/^\d{6}$/.test(matriculaLimpa)) return { ok: false, campo: "matricula", erro: "A matrícula tem 6 números." };
      if (localRepository.usuarioPorMatricula(matriculaLimpa)) {
        return { ok: false, campo: "matricula", erro: "Já existe uma pessoa com esta matrícula." };
      }
      const usuario: Usuario = {
        id: `u-${matriculaLimpa}`,
        matricula: matriculaLimpa,
        nome: nomeLimpo,
        perfil,
        cargo: limitarTexto(cargo.trim(), LIMITES.titulo) || "Operador",
        pin: "1234",
        turma,
        postoId,
      };
      d.setState((s) => ({ usuariosCadastrados: { ...s.usuariosCadastrados, [usuario.id]: usuario } }));
      d.gravarJa();
      return { ok: true, usuario };
    },

    publicarFormulario: (formulario) => {
      const usuario = autorizado("padroes", "administrar");
      const vigente = localRepository.formulario(formulario.id);
      if (!usuario || !vigente || formulario.itens.length === 0) return undefined;
      const publicado: Formulario = { ...formulario, versao: vigente.versao + 1 };
      d.setState((s) => ({ formulariosPublicados: { ...s.formulariosPublicados, [publicado.id]: publicado } }));
      d.gravarJa();
      return publicado;
    },

    enviarRelatorio: ({ linhaId, turnoChave, resumo, tarefaId }) => {
      const usuario = autorizado("relatorio", "escrever");
      const linha = localRepository.linha(linhaId);
      if (!usuario || !linha) return undefined;
      const agora = d.agora();
      const relatorio: RelatorioEnviado = {
        id: `${linhaId}|${turnoChave}`,
        linhaId,
        turnoChave,
        enviadoPor: usuario.id,
        em: agora.toISOString(),
      };
      const assunto = `Relatório do turno · ${linha.nome} · ${turnoChave.replace("T", " · turno ")}`;
      const teams = notificacao(
        "teams",
        ["gerencia", "especialista"],
        assunto,
        resumo,
        { tipo: "relatorio", id: relatorio.id },
        agora,
      );
      const email = notificacao("email", ["gerencia"], assunto, resumo, { tipo: "relatorio", id: relatorio.id }, agora);
      d.setState((s) => ({
        relatoriosEnviados: { ...s.relatoriosEnviados, [relatorio.id]: relatorio },
        notificacoes: { ...s.notificacoes, [teams.id]: teams, [email.id]: email },
        conclusoes: { ...s.conclusoes, ...concluir(tarefaId, usuario.id, relatorio.em) },
      }));
      d.gravarJa();
      return relatorio;
    },
  };
}
