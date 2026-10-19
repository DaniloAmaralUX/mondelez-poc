// Tipos do domínio. Este diretório não importa React nem Next (fronteira para a migração do piloto).
// Tamanho máximo dos textos: `LIMITES` em limites.ts (seed, store, validação e `maxLength` dos campos).

export type Perfil = "operacao" | "supervisao" | "gerencia" | "assistencia" | "especialista";

export interface Usuario {
  id: string;
  matricula: string;
  nome: string;
  perfil: Perfil;
  cargo: string;
  /** PIN de demonstração. No piloto a autenticação vem do SSO e da matrícula. */
  pin: string;
  /** Turma da escala (A–D), para quem trabalha em turno. */
  turma?: Turma;
  /** Posto de lotação (operação). */
  postoId?: string;
}

/** Turmas que revezam os três turnos. */
export type Turma = "A" | "B" | "C" | "D";

export interface Planta {
  id: string;
  nome: string;
}

export interface Linha {
  id: string;
  plantaId: string;
  nome: string;
}

export interface Posto {
  id: string;
  linhaId: string;
  nome: string;
}

export interface Equipamento {
  id: string;
  postoId: string;
  /** Até `LIMITES.nomeDoEquipamento` (40, limite do SAP). */
  nome: string;
}

export interface Contexto {
  plantaId: string;
  linhaId: string;
  postoId: string;
}

export type NumeroTurno = 1 | 2 | 3;

export interface Turno {
  numero: NumeroTurno;
  /** Data de referência do turno (o 3º turno começa em um dia e termina no seguinte). */
  data: Date;
  inicio: Date;
  fim: Date;
}

export type TipoModulo = "consulta" | "checklist" | "apontamento" | "gestao" | "consolidacao" | "formulario";

export interface Modulo {
  slug: string;
  nome: string;
  tipo: TipoModulo;
  descricao: string;
  /** Restrito à liderança (ex.: Alertas). */
  perfis?: Perfil[];
}

export type Frequencia =
  | { tipo: "turno" }
  | { tipo: "hora"; aCadaHoras: number }
  | { tipo: "semanal"; diaDaSemana: number };

export type Criticidade = "normal" | "alta" | "critica";

export interface RotinaTemplate {
  id: string;
  moduloSlug: string;
  /** Até `LIMITES.titulo` (80). */
  titulo: string;
  frequencia: Frequencia;
  /** Janela relativa ao início do turno (frequência turno/semanal) ou ao início do bloco (frequência hora). */
  janela: { inicioMin: number; duracaoMin: number };
  postoIds: string[];
  perfis: Perfil[];
  equipamentoId?: string;
  criticidade: Criticidade;
  /** Formulário preenchido para concluir a tarefa (checklists). Sem formulário, a tarefa é só confirmada. */
  formularioId?: string;
  /** Tela que resolve a tarefa, quando não é um formulário (ex.: revisar alertas). */
  rota?: string;
  /**
   * A tarefa se conclui pela ação na tela da `rota` (apontar a hora, entregar o turno), e não por "Concluir": a
   * Minha Rotina mostra só o atalho.
   */
  concluiNaTela?: boolean;
}

export type EstadoTarefa = "a_fazer" | "em_andamento" | "feita" | "atrasada" | "com_nc";

export interface TarefaInstancia {
  id: string;
  templateId: string;
  moduloSlug: string;
  titulo: string;
  equipamentoId?: string;
  criticidade: Criticidade;
  formularioId?: string;
  rota?: string;
  concluiNaTela?: boolean;
  abre: Date;
  prazo: Date;
  estado: EstadoTarefa;
  /** A janela ainda não abriu. */
  futura: boolean;
  concluidaEm?: Date;
}

export interface Conclusao {
  estado: "feita" | "com_nc" | "em_andamento";
  em: string;
  usuarioId: string;
}

// Formulários (motor de checklists) ------------------------------------------------------------

export type TipoItem = "cnc" | "numero" | "texto" | "foto";

export interface ItemFormulario {
  id: string;
  /** Etapa do checklist. Até `LIMITES.grupo` (40). */
  grupo: string;
  texto: string;
  tipo: TipoItem;
  /** Item de segurança ou qualidade crítica: NC vira alerta crítico (RN-02). */
  critico?: boolean;
  /** Faixa do centerline. Valor fora da faixa conta como não conforme. */
  faixa?: { min: number; max: number; unidade: string };
  ajuda?: string;
}

export interface Formulario {
  id: string;
  moduloSlug: string;
  /** Até `LIMITES.titulo` (80). */
  titulo: string;
  versao: number;
  itens: ItemFormulario[];
}

export type ValorCnc = "C" | "NC" | "NA";

export interface Resposta {
  valor?: ValorCnc;
  numero?: number;
  /** Item de texto (lote). Até `LIMITES.textoDoItem` (40). */
  texto?: string;
  /** Até `LIMITES.justificativa` (500); o mínimo é `MIN_JUSTIFICATIVA`. */
  justificativa?: string;
  /**
   * Fotos do item (ids no armazenamento de fotos do tablet, `lib/fotos`). Item de foto: ao menos uma, obrigatória.
   * Item C/NC: opcional, como evidência da não conformidade.
   */
  fotos?: string[];
}

/**
 * Estado de envio do registro na fila do tablet (RF-07):
 * - `pendente`: acabou de ser registrado, ainda na janela de desfazer (10 s); não entrou na fila.
 * - `local`: na fila, aguardando rede.
 * - `enviando`: envio em curso.
 * - `sincronizado`: recebido pelo servidor.
 * - `erro`: o envio falhou (a rede caiu no meio); volta a ser enviado sozinho e por "Tentar de novo".
 */
export type SyncStatus = "pendente" | "local" | "enviando" | "sincronizado" | "erro";

export interface Registro {
  id: string;
  tarefaId: string;
  formularioId: string;
  versaoFormulario: number;
  respostas: Record<string, Resposta>;
  criadoEm: string;
  turnoChave: string;
  postoId: string;
  equipamentoId?: string;
  usuarioId: string;
  dispositivoId: string;
  syncStatus: SyncStatus;
  naoConformes: number;
  /** Até `LIMITES.observacao` (1000). */
  observacao?: string;
}

/** Checklist em preenchimento, salvo no tablet a cada resposta. */
export interface Rascunho {
  respostas: Record<string, Resposta>;
  equipamentoId?: string;
  /** Até `LIMITES.observacao` (1000). */
  observacao: string;
  /**
   * Quem começou o preenchimento (usuarioId). O store preenche na primeira gravação e preserva depois; todo
   * rascunho salvo no tablet tem autor. Opcional aqui porque o formulário edita só os valores.
   */
  iniciadoPor?: string;
  /** Quando o preenchimento começou (ISO, horário simulado). Mesma regra de `iniciadoPor`. */
  iniciadoEm?: string;
}

// Alertas -------------------------------------------------------------------------------------------

/**
 * A-ATRASO e A-NC (RN-01, RN-02); A-GE, A-META e A-REPET (RN-07); A-AJUDA: pedido de ajuda do posto (RF-14);
 * A-PERDA: refugo da hora acima do limite (RM-03).
 */
export type RegraAlerta = "A-ATRASO" | "A-NC" | "A-GE" | "A-META" | "A-REPET" | "A-AJUDA" | "A-PERDA";
export type CriticidadeAlerta = "atencao" | "critico";
export type EstadoAlerta = "aberto" | "em_tratamento" | "resolvido";

export interface AcaoAlerta {
  tipo: "envio" | "assumir" | "acao" | "resolver" | "automatica";
  /** Até `LIMITES.acaoDoAlerta` (500). */
  texto: string;
  em: string;
  usuarioId?: string;
}

export interface Alerta {
  id: string;
  regra: RegraAlerta;
  criticidade: CriticidadeAlerta;
  estado: EstadoAlerta;
  titulo: string;
  descricao: string;
  postoId: string;
  equipamentoId?: string;
  moduloSlug: string;
  /** Tarefa de origem (atraso, NC). Alertas de KPI, falha repetida e pedido de ajuda não têm tarefa. */
  tarefaId?: string;
  registroId?: string;
  /** Pedido de ajuda de origem (A-AJUDA). */
  pedidoAjudaId?: string;
  /** Contexto extra, em linhas curtas (falhas da hora, valores do indicador). */
  contexto?: string[];
  criadoEm: Date;
  /** Quem assumiu o tratamento. */
  responsavelId?: string;
  acoes: AcaoAlerta[];
  itensNaoConformes: { texto: string; detalhe: string; critico: boolean }[];
}

// Produção (Hora x Hora, plano, perdas) ---------------------------------------------------------------

export interface Sku {
  id: string;
  /** Código SAP do material. */
  codigo: string;
  descricao: string;
  linhaId: string;
  /** Peso líquido por caixa (RN-03). */
  pesoCaixaKg: number;
  /** Capacidade nominal da linha com este SKU (RN-04). */
  capacidadeTonHora: number;
}

/** Toneladas planejadas de um SKU numa linha num dia (RM-01). */
export interface ItemPlano {
  linhaId: string;
  skuId: string;
  /** Data local no formato AAAA-MM-DD. */
  data: string;
  toneladas: number;
}

export interface PlanoProducao {
  /** Segunda-feira da semana (AAAA-MM-DD). Também é o id no store. */
  semana: string;
  itens: ItemPlano[];
  origem: "seed" | "excel";
  arquivo?: string;
  publicadoPor?: string;
  publicadoEm?: string;
}

/** Caixas produzidas numa hora do turno (RM-10). */
export interface ApontamentoHora {
  /** Igual ao id da tarefa do bloco (ex.: hora-x-hora@2026-10-16T1#07). */
  id: string;
  postoId: string;
  linhaId: string;
  turnoChave: string;
  /** Início da hora (ISO). */
  bloco: string;
  skuId: string;
  caixas: number;
  /** Obrigatório quando a hora fica abaixo da meta. */
  motivo?: string;
  usuarioId: string;
  em: string;
}

/** Sobrepeso, refugo e reprocesso de um bloco (RM-03). */
export interface ApontamentoPerdas {
  /** Igual ao id da tarefa do bloco. */
  id: string;
  postoId: string;
  turnoChave: string;
  bloco: string;
  /** Sobrepeso médio por pacote, em gramas. */
  sobrepesoG: number;
  refugoKg: number;
  reprocessoKg: number;
  motivo?: string;
  observacao?: string;
  usuarioId: string;
  em: string;
}

// Falhas (MTBF) --------------------------------------------------------------------------------------

export interface TipoFalha {
  id: string;
  nome: string;
  /** Falha de segurança ou qualidade: repetição vira alerta crítico. */
  critica?: boolean;
}

/** Uma falha apontada por toque (RM-05). Sem `fim`, ainda em curso; conta até agora ou até o fim do turno (RN-06). */
export interface EventoFalha {
  id: string;
  postoId: string;
  equipamentoId: string;
  turnoChave: string;
  tipoId: string;
  inicio: string;
  fim?: string;
  usuarioId: string;
  /** Quem encerrou, quando não foi quem abriu. */
  encerradaPor?: string;
}

// Turno ------------------------------------------------------------------------------------------------

/** Indicadores consolidados de um posto ou linha num turno (RM-12, RM-13). */
export interface KpisTurno {
  toneladas: number;
  /** Meta acumulada até o instante do cálculo (RN-05). */
  metaToneladas: number;
  /** Meta do turno inteiro. */
  metaTurno: number;
  /** 0–1, ou null sem horas apontadas. */
  ge: number | null;
  /** Minutos, ou null sem falhas. */
  mtbfMin: number | null;
  falhas: number;
  minutosParados: number;
  maiorParada?: { tipoId: string; nome: string; minutos: number };
  naoConformes: number;
  alertasAbertos: number;
  alertasTratados: number;
  pedidosAjuda: number;
  tarefasFeitas: number;
  tarefasTotal: number;
  tarefasAtrasadas: number;
  refugoKg: number;
  sobrepesoMedioG: number | null;
}

/** Passagem do posto para o turno seguinte (RM-13, RN-10). Id: `postoId|turnoChave`. */
export interface TrocaDeTurno {
  id: string;
  postoId: string;
  turnoChave: string;
  /** Fotografia dos indicadores no momento da entrega. */
  kpis: KpisTurno;
  etiquetasAbertas: number;
  ondeEtiquetas: string;
  paradas: string;
  pendencias: string;
  pedidosAjuda: string;
  comentario: string;
  entreguePor: string;
  entregueEm: string;
  /** Quem recebeu (operador do turno seguinte ou supervisão), com PIN. */
  aceitePor?: string;
  aceiteEm?: string;
}

// Pedido de ajuda --------------------------------------------------------------------------------------

export type MotivoAjuda = "manutencao" | "qualidade" | "material" | "seguranca" | "processo" | "outro";

/** Pedido de ajuda do posto, com contexto automático (RF-14). */
export interface PedidoAjuda {
  id: string;
  postoId: string;
  equipamentoId?: string;
  tarefaId?: string;
  /** Tela em que a pessoa estava (rota). */
  origem?: string;
  motivo: MotivoAjuda;
  texto: string;
  usuarioId: string;
  em: string;
  vistoPor?: string;
  vistoEm?: string;
  atendidoPor?: string;
  atendidoEm?: string;
  resposta?: string;
}

// Agenda, escala, documentos ---------------------------------------------------------------------------

export type TipoRecado = "recado" | "agenda" | "parada" | "visita" | "evento";

export interface Recado {
  id: string;
  titulo: string;
  tipo: TipoRecado;
  /** Sem linha: vale para a fábrica toda. */
  linhaId?: string;
  /** Data do compromisso (AAAA-MM-DD), para agenda, parada, visita e evento. */
  data?: string;
  /** Faixa de horário do compromisso, livre (ex.: 14:00–16:00). */
  horario?: string;
  autorId: string;
  /** Publicação (ISO, relógio da demo). */
  em: string;
}

/** Ajuste pontual na escala de uma pessoa num dia. Id: `usuarioId|AAAA-MM-DD`. */
export interface AjusteEscala {
  id: string;
  usuarioId: string;
  data: string;
  turno: NumeroTurno | "folga";
  motivo?: string;
  autorId: string;
  em: string;
}

export type TipoDocumento = "it" | "lpp" | "book";

export interface DocumentoTecnico {
  id: string;
  tipo: TipoDocumento;
  /** Código do documento no EQCMS (simulado). */
  codigo: string;
  titulo: string;
  versao: number;
  /** AAAA-MM-DD. */
  atualizadoEm: string;
  equipamentoIds: string[];
  resumo: string;
  /** IT e LPP: passos do procedimento. */
  passos?: { titulo: string; detalhe: string; atencao?: boolean }[];
  /** Book de defeitos. */
  defeito?: {
    categoria: string;
    modo: string;
    padrao: string;
    foraDoPadrao: string;
    oQueMonitorar: string;
    acao: string;
  };
}

// Notificações simuladas (Teams, e-mail) ---------------------------------------------------------------

export type CanalNotificacao = "teams" | "email";

/** Mensagem que o piloto enviaria pelo Teams ou e-mail; no protótipo fica numa caixa de saída simulada. */
export interface Notificacao {
  id: string;
  canal: CanalNotificacao;
  /** Perfis que recebem. */
  para: Perfil[];
  assunto: string;
  corpo: string;
  origem: { tipo: "alerta" | "relatorio" | "ajuda" | "recado"; id: string };
  em: string;
}
