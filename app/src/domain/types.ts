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
}

export type EstadoTarefa = "a_fazer" | "em_andamento" | "feita" | "atrasada" | "com_nc";

export interface TarefaInstancia {
  id: string;
  templateId: string;
  moduloSlug: string;
  titulo: string;
  equipamentoId?: string;
  criticidade: Criticidade;
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
