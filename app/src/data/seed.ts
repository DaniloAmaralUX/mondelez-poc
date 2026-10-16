import type { Equipamento, Formulario, Linha, Modulo, Planta, Posto, RotinaTemplate, Usuario } from "@/domain/types";

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
    formularioId: "pre-partida-l4",
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
    formularioId: "ppli-l4",
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
    formularioId: "rastreabilidade-envoltorio",
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
    formularioId: "manutencao-autonoma-l4",
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
    formularioId: "limpeza-semanal",
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
    rota: "/dashboard/alertas",
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
    rota: "/dashboard/alertas",
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

/** Checklists do posto Embalagem. Cada formulário tem versão; o registro guarda a versão usada. */
export const formularios: Formulario[] = [
  {
    id: "pre-partida-l4",
    moduloSlug: "seguranca",
    titulo: "Pré-partida de segurança · Loeschpack 4",
    versao: 2,
    itens: [
      { id: "protecoes", grupo: "Proteções", texto: "Proteções fixas instaladas e travadas", tipo: "cnc", critico: true },
      { id: "emergencia", grupo: "Proteções", texto: "Botões de emergência testados", tipo: "cnc", critico: true },
      { id: "cortina", grupo: "Proteções", texto: "Cortina de luz interrompe o ciclo", tipo: "cnc", critico: true },
      { id: "area", grupo: "Área", texto: "Área livre de obstruções e piso seco", tipo: "cnc" },
      { id: "epi", grupo: "Área", texto: "EPIs em uso: luva, touca e protetor auricular", tipo: "cnc", critico: true },
    ],
  },
  {
    id: "ppli-l4",
    moduloSlug: "ppli-centerlining",
    titulo: "PPLI e Centerlining · Loeschpack 4",
    versao: 3,
    itens: [
      { id: "mordentes", grupo: "Limpeza", texto: "Mordentes sem resíduo de chocolate", tipo: "cnc", critico: true },
      { id: "bandeja", grupo: "Limpeza", texto: "Bandeja de refugo vazia e limpa", tipo: "cnc" },
      { id: "sensor", grupo: "Limpeza", texto: "Sensor da marca de corte limpo", tipo: "cnc" },
      { id: "corrente", grupo: "Lubrificação", texto: "Corrente do transportador lubrificada", tipo: "cnc" },
      { id: "redutor", grupo: "Lubrificação", texto: "Nível de óleo do redutor no visor", tipo: "cnc" },
      {
        id: "temp-longitudinal",
        grupo: "Centerline",
        texto: "Temperatura do mordente longitudinal",
        tipo: "numero",
        critico: true,
        faixa: { min: 165, max: 175, unidade: "°C" },
      },
      {
        id: "temp-transversal",
        grupo: "Centerline",
        texto: "Temperatura do mordente transversal",
        tipo: "numero",
        critico: true,
        faixa: { min: 180, max: 190, unidade: "°C" },
      },
      { id: "pressao", grupo: "Centerline", texto: "Pressão de ar", tipo: "numero", faixa: { min: 5.5, max: 6.5, unidade: "bar" } },
      {
        id: "velocidade",
        grupo: "Centerline",
        texto: "Velocidade da máquina",
        tipo: "numero",
        faixa: { min: 95, max: 105, unidade: "pacotes/min" },
      },
    ],
  },
  {
    id: "rastreabilidade-envoltorio",
    moduloSlug: "rastreabilidade-pa",
    titulo: "Rastreabilidade · lote de envoltório",
    versao: 1,
    itens: [
      { id: "lote-pa", grupo: "Lotes", texto: "Lote do produto acabado", tipo: "texto" },
      { id: "lote-envoltorio", grupo: "Lotes", texto: "Lote do envoltório", tipo: "texto" },
      { id: "lote-caixa", grupo: "Lotes", texto: "Lote da caixa", tipo: "texto" },
      { id: "codificacao", grupo: "Inspeção", texto: "Codificação legível na embalagem", tipo: "cnc", critico: true },
      { id: "selagem", grupo: "Inspeção", texto: "Selagem sem rugas ou vazamento", tipo: "cnc", critico: true },
    ],
  },
  {
    id: "manutencao-autonoma-l4",
    moduloSlug: "manutencao-autonoma",
    titulo: "Manutenção autônoma · Loeschpack 4",
    versao: 1,
    itens: [
      { id: "ruido", grupo: "Inspeção", texto: "Sem ruído ou vibração anormal", tipo: "cnc" },
      { id: "vazamento", grupo: "Inspeção", texto: "Sem vazamento de ar ou óleo", tipo: "cnc" },
      { id: "parafusos", grupo: "Inspeção", texto: "Parafusos das guias apertados", tipo: "cnc" },
      { id: "filtro", grupo: "Limpeza", texto: "Filtro de ar da unidade de conservação limpo", tipo: "cnc" },
      { id: "lubrificacao", grupo: "Lubrificação", texto: "Pontos de graxa conforme o mapa", tipo: "cnc" },
    ],
  },
  {
    id: "limpeza-semanal",
    moduloSlug: "limpeza-semanal",
    titulo: "Limpeza semanal · Loeschpack 2, 4 e 5",
    versao: 1,
    itens: [
      { id: "l2", grupo: "Equipamentos", texto: "Loeschpack 2 limpa por dentro e por fora", tipo: "cnc" },
      { id: "l4", grupo: "Equipamentos", texto: "Loeschpack 4 limpa por dentro e por fora", tipo: "cnc" },
      { id: "l5", grupo: "Equipamentos", texto: "Loeschpack 5 limpa por dentro e por fora", tipo: "cnc" },
      { id: "esteiras", grupo: "Área", texto: "Esteiras e calhas sem resíduo", tipo: "cnc", critico: true },
      { id: "ralo", grupo: "Área", texto: "Ralos desobstruídos", tipo: "cnc" },
    ],
  },
];

export interface Recado {
  id: string;
  titulo: string;
  autor: string;
  /** Dias antes de hoje (0 = hoje). */
  diasAtras: number;
  tipo: "recado" | "agenda";
}

export const recados: Recado[] = [
  {
    id: "r1",
    titulo: "Parada programada da Bis 2 na terça, das 14:00 às 16:00",
    autor: "Carlos Mendes",
    diasAtras: 0,
    tipo: "agenda",
  },
  { id: "r2", titulo: "Nova embalagem do Bis 2 chega na próxima semana", autor: "Marcos Tavares", diasAtras: 0, tipo: "recado" },
  { id: "r3", titulo: "DDS de segunda: uso de luva anticorte", autor: "Renata Lins", diasAtras: 1, tipo: "recado" },
  { id: "r4", titulo: "Visita da qualidade corporativa na quinta", autor: "Carlos Mendes", diasAtras: 3, tipo: "agenda" },
];

/** Passagem do turno anterior (exemplo dos mockups da Mondelez). */
export const passagemTurnoAnterior = {
  autor: "Graziela Felix",
  pendencia: "Etiqueta aberta: desalinhamento da correia transportadora.",
  sugestao: "Pedir a movimentação da nova embalagem antes da troca de SKU.",
};
