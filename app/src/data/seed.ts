import type { Equipamento, Linha, Modulo, Planta, Posto, RotinaTemplate, Usuario } from "@/domain/types";

// Dados simulados do protótipo: fábrica de Chocolate, linha Bis 2, posto Embalagem.

export const PIN_DEMO = "1234";

export const usuarios: Usuario[] = [
  {
    id: "u-alberto",
    matricula: "104233",
    nome: "Alberto Forte",
    perfil: "operacao",
    cargo: "Operador de Embalagem",
    pin: PIN_DEMO,
  },
  {
    id: "u-graziela",
    matricula: "108751",
    nome: "Graziela Felix",
    perfil: "operacao",
    cargo: "Operadora de Embalagem",
    pin: PIN_DEMO,
  },
  {
    id: "u-renata",
    matricula: "201145",
    nome: "Renata Lins",
    perfil: "supervisao",
    cargo: "Supervisora de Produção",
    pin: PIN_DEMO,
  },
  {
    id: "u-marcos",
    matricula: "300512",
    nome: "Marcos Tavares",
    perfil: "gerencia",
    cargo: "Gerente de Seção",
    pin: PIN_DEMO,
  },
  {
    id: "u-juliana",
    matricula: "250078",
    nome: "Juliana Prado",
    perfil: "especialista",
    cargo: "Especialista de Seção",
    pin: PIN_DEMO,
  },
  {
    id: "u-carlos",
    matricula: "220390",
    nome: "Carlos Mendes",
    perfil: "assistencia",
    cargo: "Assistente de Produção",
    pin: PIN_DEMO,
  },
];

export const plantas: Planta[] = [{ id: "chocolate", nome: "Chocolate" }];

export const linhas: Linha[] = [
  { id: "bis-1", plantaId: "chocolate", nome: "Bis 1" },
  { id: "bis-2", plantaId: "chocolate", nome: "Bis 2" },
  { id: "bis-3", plantaId: "chocolate", nome: "Bis 3" },
  { id: "bis-4", plantaId: "chocolate", nome: "Bis 4" },
];

export const postos: Posto[] = linhas.flatMap((l) => [
  { id: `${l.id}-embalagem`, linhaId: l.id, nome: "Embalagem" },
  { id: `${l.id}-processo`, linhaId: l.id, nome: "Processo" },
]);

export const equipamentos: Equipamento[] = [
  { id: "loeschpack-2", postoId: "bis-2-embalagem", nome: "Loeschpack 2" },
  { id: "loeschpack-4", postoId: "bis-2-embalagem", nome: "Loeschpack 4" },
  { id: "loeschpack-5", postoId: "bis-2-embalagem", nome: "Loeschpack 5" },
];

/** Os 15 módulos do protótipo de referência, na ordem da grade, mais a Agenda. */
export const modulos: Modulo[] = [
  {
    slug: "plano-de-producao",
    nome: "Plano de produção",
    tipo: "consulta",
    descricao: "Plano do dia e da semana por linha e SKU, em toneladas.",
  },
  {
    slug: "manutencao-autonoma",
    nome: "Manutenção autônoma",
    tipo: "checklist",
    descricao: "Roteiro de limpeza, inspeção e lubrificação básica por equipamento.",
  },
  {
    slug: "sobrepeso-refugo",
    nome: "Sobrepeso, refugo e reprocesso",
    tipo: "apontamento",
    descricao: "Apontamento por hora de sobrepeso, refugo e reprocesso.",
  },
  {
    slug: "book-de-defeitos",
    nome: "Book de defeitos",
    tipo: "consulta",
    descricao: "Catálogo visual de defeitos: padrão e fora de padrão.",
  },
  {
    slug: "mtbf",
    nome: "MTBF",
    tipo: "apontamento",
    descricao: "Apontamento de falhas por toque, timeline e Pareto do turno.",
  },
  { slug: "escala", nome: "Escala", tipo: "consulta", descricao: "Escala do colaborador e do posto por turno." },
  {
    slug: "limpeza-semanal",
    nome: "Limpeza semanal",
    tipo: "checklist",
    descricao: "Itens obrigatórios de limpeza por equipamento na semana.",
  },
  {
    slug: "rastreabilidade-pa",
    nome: "Rastreabilidade de PA",
    tipo: "checklist",
    descricao: "Inspeção de produto acabado com lotes e foto obrigatória.",
  },
  {
    slug: "alertas",
    nome: "Alertas",
    tipo: "gestao",
    descricao: "Desvios por atraso e não conformidade, com responsável e ações.",
    perfis: ["supervisao", "gerencia", "especialista"],
  },
  {
    slug: "hora-x-hora",
    nome: "Hora x Hora",
    tipo: "apontamento",
    descricao: "Caixas por hora, toneladas, GE e farol da meta.",
  },
  {
    slug: "seguranca",
    nome: "Ferramentas de segurança",
    tipo: "checklist",
    descricao: "Pré-partida, DDS e nível de risco da linha.",
  },
  {
    slug: "relatorio-do-turno",
    nome: "Relatório do turno",
    tipo: "consolidacao",
    descricao: "Consolidação do turno por linha para a liderança.",
  },
  {
    slug: "troca-de-turno",
    nome: "Troca de turno",
    tipo: "formulario",
    descricao: "Passagem guiada e pré-preenchida, com aceite de quem recebe.",
  },
  {
    slug: "instrucao-de-trabalho",
    nome: "Instrução de trabalho e LPP",
    tipo: "consulta",
    descricao: "Biblioteca de documentos por equipamento.",
  },
  {
    slug: "ppli-centerlining",
    nome: "PPLI e Centerlining",
    tipo: "checklist",
    descricao: "Limpeza, lubrificação e parâmetros de centerline por equipamento.",
  },
  {
    slug: "agenda",
    nome: "Agenda e recados",
    tipo: "consulta",
    descricao: "Compromissos, paradas programadas e recados da fábrica.",
  },
];

const EMBALAGEM_BIS2 = ["bis-2-embalagem"];
const TODOS_POSTOS_BIS2 = ["bis-2-embalagem", "bis-2-processo"];

/** Rotinas por posto × perfil × frequência (RN-12). Janelas em minutos a partir do início do turno ou do bloco. */
export const rotinaTemplates: RotinaTemplate[] = [
  // Operação
  {
    id: "pre-partida-l4",
    moduloSlug: "seguranca",
    titulo: "Pré-partida de segurança · Loeschpack 4",
    frequencia: { tipo: "turno" },
    janela: { inicioMin: 0, duracaoMin: 30 },
    postoIds: EMBALAGEM_BIS2,
    perfis: ["operacao"],
    equipamentoId: "loeschpack-4",
    criticidade: "critica",
  },
  {
    id: "ppli-l4",
    moduloSlug: "ppli-centerlining",
    titulo: "PPLI e Centerlining · Loeschpack 4",
    frequencia: { tipo: "turno" },
    janela: { inicioMin: 0, duracaoMin: 120 },
    postoIds: EMBALAGEM_BIS2,
    perfis: ["operacao"],
    equipamentoId: "loeschpack-4",
    criticidade: "alta",
  },
  {
    id: "hora-x-hora",
    moduloSlug: "hora-x-hora",
    titulo: "Hora x Hora · apontar caixas",
    frequencia: { tipo: "hora", aCadaHoras: 1 },
    janela: { inicioMin: 0, duracaoMin: 70 },
    postoIds: EMBALAGEM_BIS2,
    perfis: ["operacao"],
    criticidade: "normal",
  },
  {
    id: "sobrepeso",
    moduloSlug: "sobrepeso-refugo",
    titulo: "Sobrepeso, refugo e reprocesso",
    frequencia: { tipo: "hora", aCadaHoras: 2 },
    janela: { inicioMin: 60, duracaoMin: 60 },
    postoIds: EMBALAGEM_BIS2,
    perfis: ["operacao"],
    criticidade: "normal",
  },
  {
    id: "rastreabilidade-envoltorio",
    moduloSlug: "rastreabilidade-pa",
    titulo: "Rastreabilidade · lote de envoltório",
    frequencia: { tipo: "turno" },
    janela: { inicioMin: 60, duracaoMin: 180 },
    postoIds: EMBALAGEM_BIS2,
    perfis: ["operacao"],
    criticidade: "alta",
  },
  {
    id: "manutencao-autonoma-l4",
    moduloSlug: "manutencao-autonoma",
    titulo: "Manutenção autônoma · Loeschpack 4",
    frequencia: { tipo: "turno" },
    janela: { inicioMin: 240, duracaoMin: 180 },
    postoIds: EMBALAGEM_BIS2,
    perfis: ["operacao"],
    equipamentoId: "loeschpack-4",
    criticidade: "normal",
  },
  {
    id: "limpeza-semanal",
    moduloSlug: "limpeza-semanal",
    titulo: "Limpeza semanal · Loeschpack 2, 4 e 5",
    frequencia: { tipo: "semanal", diaDaSemana: 5 },
    janela: { inicioMin: 0, duracaoMin: 480 },
    postoIds: EMBALAGEM_BIS2,
    perfis: ["operacao"],
    criticidade: "normal",
  },
  {
    id: "troca-de-turno-op",
    moduloSlug: "troca-de-turno",
    titulo: "Troca de turno · passar o posto",
    frequencia: { tipo: "turno" },
    janela: { inicioMin: 450, duracaoMin: 30 },
    postoIds: EMBALAGEM_BIS2,
    perfis: ["operacao"],
    criticidade: "alta",
  },
  // Supervisão
  {
    id: "sup-passagem",
    moduloSlug: "troca-de-turno",
    titulo: "Conferir passagem de turno da Bis 2",
    frequencia: { tipo: "turno" },
    janela: { inicioMin: 0, duracaoMin: 45 },
    postoIds: TODOS_POSTOS_BIS2,
    perfis: ["supervisao"],
    criticidade: "alta",
  },
  {
    id: "sup-alertas",
    moduloSlug: "alertas",
    titulo: "Revisar alertas abertos",
    frequencia: { tipo: "hora", aCadaHoras: 2 },
    janela: { inicioMin: 0, duracaoMin: 120 },
    postoIds: TODOS_POSTOS_BIS2,
    perfis: ["supervisao"],
    criticidade: "alta",
  },
  {
    id: "sup-relatorio",
    moduloSlug: "relatorio-do-turno",
    titulo: "Fechar relatório do turno",
    frequencia: { tipo: "turno" },
    janela: { inicioMin: 420, duracaoMin: 60 },
    postoIds: TODOS_POSTOS_BIS2,
    perfis: ["supervisao"],
    criticidade: "alta",
  },
  // Gerência
  {
    id: "ger-relatorio",
    moduloSlug: "relatorio-do-turno",
    titulo: "Ler relatório do turno anterior",
    frequencia: { tipo: "turno" },
    janela: { inicioMin: 0, duracaoMin: 90 },
    postoIds: TODOS_POSTOS_BIS2,
    perfis: ["gerencia"],
    criticidade: "normal",
  },
  {
    id: "ger-plano",
    moduloSlug: "plano-de-producao",
    titulo: "Validar plano de produção do dia",
    frequencia: { tipo: "turno" },
    janela: { inicioMin: 60, duracaoMin: 120 },
    postoIds: TODOS_POSTOS_BIS2,
    perfis: ["gerencia"],
    criticidade: "normal",
  },
  // Especialista
  {
    id: "esp-nc-ppli",
    moduloSlug: "alertas",
    titulo: "Analisar não conformidades de PPLI",
    frequencia: { tipo: "turno" },
    janela: { inicioMin: 120, duracaoMin: 180 },
    postoIds: TODOS_POSTOS_BIS2,
    perfis: ["especialista"],
    criticidade: "alta",
  },
  // Assistência
  {
    id: "ass-agenda",
    moduloSlug: "agenda",
    titulo: "Publicar agenda e recados do dia",
    frequencia: { tipo: "turno" },
    janela: { inicioMin: 0, duracaoMin: 60 },
    postoIds: TODOS_POSTOS_BIS2,
    perfis: ["assistencia"],
    criticidade: "normal",
  },
];
