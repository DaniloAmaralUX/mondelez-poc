// Tipos do domínio. Este diretório não importa React nem Next (fronteira para a migração do piloto).

export type Perfil = "operacao" | "supervisao" | "gerencia" | "assistencia" | "especialista";

export interface Usuario {
  id: string;
  matricula: string;
  nome: string;
  perfil: Perfil;
  cargo: string;
  /** PIN de demonstração. No piloto a autenticação vem do SSO e da matrícula. */
  pin: string;
}

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

export type TipoItem = "cnc" | "numero" | "texto";

export interface ItemFormulario {
  id: string;
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
  titulo: string;
  versao: number;
  itens: ItemFormulario[];
}

export type ValorCnc = "C" | "NC" | "NA";

export interface Resposta {
  valor?: ValorCnc;
  numero?: number;
  texto?: string;
  justificativa?: string;
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
  observacao?: string;
}

/** Checklist em preenchimento, salvo no tablet a cada resposta. */
export interface Rascunho {
  respostas: Record<string, Resposta>;
  equipamentoId?: string;
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

export type RegraAlerta = "A-ATRASO" | "A-NC";
export type CriticidadeAlerta = "atencao" | "critico";
export type EstadoAlerta = "aberto" | "em_tratamento" | "resolvido";

export interface AcaoAlerta {
  tipo: "envio" | "assumir" | "acao" | "resolver" | "automatica";
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
  tarefaId: string;
  registroId?: string;
  criadoEm: Date;
  /** Quem assumiu o tratamento. */
  responsavelId?: string;
  acoes: AcaoAlerta[];
  itensNaoConformes: { texto: string; detalhe: string; critico: boolean }[];
}
