import { dataLocal } from "@/domain/producao";
import type {
  DocumentoTecnico,
  Equipamento,
  Formulario,
  ItemPlano,
  Linha,
  Modulo,
  PlanoProducao,
  Planta,
  Posto,
  Recado,
  RotinaTemplate,
  Sku,
  TipoFalha,
  Usuario,
} from "@/domain/types";

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
    turma: "A",
    postoId: "bis-2-embalagem",
  },
  {
    id: "u-graziela",
    matricula: "108751",
    nome: "Graziela Felix",
    perfil: "operacao",
    cargo: "Operadora de Embalagem",
    pin: PIN_DEMO,
    turma: "D",
    postoId: "bis-2-embalagem",
  },
  {
    id: "u-joao",
    matricula: "109342",
    nome: "João Batista",
    perfil: "operacao",
    cargo: "Operador de Processo",
    pin: PIN_DEMO,
    turma: "A",
    postoId: "bis-2-processo",
  },
  {
    id: "u-patricia",
    matricula: "110587",
    nome: "Patrícia Moura",
    perfil: "operacao",
    cargo: "Operadora de Embalagem",
    pin: PIN_DEMO,
    turma: "B",
    postoId: "bis-2-embalagem",
  },
  {
    id: "u-diego",
    matricula: "111204",
    nome: "Diego Rocha",
    perfil: "operacao",
    cargo: "Operador de Embalagem",
    pin: PIN_DEMO,
    turma: "C",
    postoId: "bis-2-embalagem",
  },
  {
    id: "u-renata",
    matricula: "201145",
    nome: "Renata Lins",
    perfil: "supervisao",
    cargo: "Supervisora de Produção",
    pin: PIN_DEMO,
    turma: "A",
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
  { id: "temperadeira-2", postoId: "bis-2-processo", nome: "Temperadeira" },
  { id: "tunel-2", postoId: "bis-2-processo", nome: "Túnel de resfriamento" },
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
    rota: "/dashboard/hora-x-hora",
    concluiNaTela: true,
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
    rota: "/dashboard/sobrepeso",
    concluiNaTela: true,
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
    postoIds: TODOS_POSTOS_BIS2,
    perfis: ["operacao"],
    criticidade: "alta",
    rota: "/dashboard/troca-de-turno",
    concluiNaTela: true,
  },
  // Operação · Processo
  {
    id: "pre-partida-temperadeira",
    moduloSlug: "seguranca",
    titulo: "Pré-partida de segurança · Temperadeira",
    frequencia: { tipo: "turno" },
    janela: { inicioMin: 0, duracaoMin: 30 },
    postoIds: ["bis-2-processo"],
    perfis: ["operacao"],
    equipamentoId: "temperadeira-2",
    criticidade: "critica",
    formularioId: "pre-partida-temperadeira",
  },
  {
    id: "temperagem",
    moduloSlug: "ppli-centerlining",
    titulo: "Centerlining da temperagem",
    frequencia: { tipo: "hora", aCadaHoras: 2 },
    janela: { inicioMin: 30, duracaoMin: 60 },
    postoIds: ["bis-2-processo"],
    perfis: ["operacao"],
    equipamentoId: "temperadeira-2",
    criticidade: "alta",
    formularioId: "temperagem",
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
    rota: "/dashboard/troca-de-turno",
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
    rota: "/dashboard/relatorio-turno",
    concluiNaTela: true,
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
    rota: "/dashboard/relatorio-turno",
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
    rota: "/dashboard/plano",
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
    rota: "/dashboard/agenda",
  },
  {
    id: "ass-plano",
    moduloSlug: "plano-de-producao",
    titulo: "Importar o plano de produção da semana",
    frequencia: { tipo: "semanal", diaDaSemana: 1 },
    janela: { inicioMin: 0, duracaoMin: 240 },
    postoIds: TODOS_POSTOS_BIS2,
    perfis: ["assistencia"],
    criticidade: "alta",
    rota: "/dashboard/plano",
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
      {
        id: "protecoes",
        grupo: "Proteções",
        texto: "Proteções fixas instaladas e travadas",
        tipo: "cnc",
        critico: true,
      },
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
      {
        id: "pressao",
        grupo: "Centerline",
        texto: "Pressão de ar",
        tipo: "numero",
        faixa: { min: 5.5, max: 6.5, unidade: "bar" },
      },
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
    versao: 2,
    itens: [
      { id: "lote-pa", grupo: "Lotes", texto: "Lote do produto acabado", tipo: "texto" },
      { id: "lote-envoltorio", grupo: "Lotes", texto: "Lote do envoltório", tipo: "texto" },
      { id: "lote-caixa", grupo: "Lotes", texto: "Lote da caixa", tipo: "texto" },
      {
        id: "foto-etiqueta",
        grupo: "Evidência",
        texto: "Foto da etiqueta do lote na caixa",
        tipo: "foto",
        ajuda: "Enquadre a etiqueta com o código e a validade legíveis.",
      },
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

/** Recados e agenda iniciais da demonstração, relativos ao dia do relógio (o store guarda em `recados`). */
export function recadosIniciais(hoje: Date): Recado[] {
  const dia = (deslocamento: number, h = 7, m = 0) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() + deslocamento);
    d.setHours(h, m, 0, 0);
    return d;
  };
  return [
    {
      id: "r1",
      titulo: "Parada programada da Bis 2 para troca de formato",
      tipo: "parada",
      linhaId: "bis-2",
      data: dataLocal(dia(2)),
      horario: "14:00–16:00",
      autorId: "u-carlos",
      em: dia(0, 6, 10).toISOString(),
    },
    {
      id: "r2",
      titulo: "Nova embalagem do Bis 2 chega na próxima semana",
      tipo: "recado",
      linhaId: "bis-2",
      autorId: "u-marcos",
      em: dia(0, 6, 40).toISOString(),
    },
    {
      id: "r3",
      titulo: "DDS de segunda: uso de luva anticorte",
      tipo: "recado",
      autorId: "u-renata",
      em: dia(-1, 6, 5).toISOString(),
    },
    {
      id: "r4",
      titulo: "Visita da qualidade corporativa",
      tipo: "visita",
      data: dataLocal(dia(3)),
      horario: "09:00–11:00",
      autorId: "u-carlos",
      em: dia(-3, 10).toISOString(),
    },
  ];
}

/** Passagem do turno anterior (exemplo dos mockups da Mondelez). */
export const passagemTurnoAnterior = {
  autor: "Graziela Felix",
  pendencia: "Etiqueta aberta: desalinhamento da correia transportadora.",
  sugestao: "Pedir a movimentação da nova embalagem antes da troca de SKU.",
};

/** Checklists do posto Processo (v0.5): o status por posto da supervisão tem dois postos de verdade. */
formularios.push(
  {
    id: "pre-partida-temperadeira",
    moduloSlug: "seguranca",
    titulo: "Pré-partida de segurança · Temperadeira",
    versao: 1,
    itens: [
      {
        id: "protecoes",
        grupo: "Proteções",
        texto: "Tampa de inspeção fechada e intertravada",
        tipo: "cnc",
        critico: true,
      },
      { id: "emergencia", grupo: "Proteções", texto: "Botão de emergência testado", tipo: "cnc", critico: true },
      { id: "vazamento", grupo: "Área", texto: "Sem vazamento de chocolate ou água gelada", tipo: "cnc" },
      { id: "epi", grupo: "Área", texto: "Luva térmica e touca em uso", tipo: "cnc", critico: true },
    ],
  },
  {
    id: "temperagem",
    moduloSlug: "ppli-centerlining",
    titulo: "Centerlining da temperagem",
    versao: 1,
    itens: [
      {
        id: "temp-saida",
        grupo: "Centerline",
        texto: "Temperatura de saída do chocolate",
        tipo: "numero",
        critico: true,
        faixa: { min: 29, max: 31, unidade: "°C" },
      },
      {
        id: "indice",
        grupo: "Centerline",
        texto: "Índice de temperagem",
        tipo: "numero",
        faixa: { min: 4.5, max: 6, unidade: "TI" },
      },
      {
        id: "agua",
        grupo: "Centerline",
        texto: "Temperatura da água gelada",
        tipo: "numero",
        faixa: { min: 8, max: 12, unidade: "°C" },
      },
    ],
  },
);

// Produção ----------------------------------------------------------------------------------------------

/** SKUs por linha. Peso líquido por caixa e capacidade nominal de exemplo (a validar com a Mondelez). */
export const skus: Sku[] = [
  {
    id: "bis-leite-126",
    codigo: "7622300990121",
    descricao: "BIS AO LEITE 126G 32X",
    linhaId: "bis-2",
    pesoCaixaKg: 4.032,
    capacidadeTonHora: 3.2,
  },
  {
    id: "bis-black-100",
    codigo: "7622300990138",
    descricao: "BIS BLACK 100,8G 40X",
    linhaId: "bis-2",
    pesoCaixaKg: 4.032,
    capacidadeTonHora: 3.0,
  },
  {
    id: "bis-leite-126-l1",
    codigo: "7622300990121",
    descricao: "BIS AO LEITE 126G 32X",
    linhaId: "bis-1",
    pesoCaixaKg: 4.032,
    capacidadeTonHora: 3.0,
  },
  {
    id: "bis-xtra-45",
    codigo: "7622300990152",
    descricao: "BIS XTRA 45G 60X",
    linhaId: "bis-3",
    pesoCaixaKg: 2.7,
    capacidadeTonHora: 2.6,
  },
  {
    id: "bis-oreo-100",
    codigo: "7622300990169",
    descricao: "BIS OREO 100,8G 40X",
    linhaId: "bis-4",
    pesoCaixaKg: 4.032,
    capacidadeTonHora: 3.1,
  },
];

/** Toneladas por dia (seg a dom) e SKU de cada linha no plano de exemplo; domingo sem produção. */
const PLANO_BASE: { linhaId: string; skuId: string; porDia: number[] }[] = [
  { linhaId: "bis-1", skuId: "bis-leite-126-l1", porDia: [62, 62, 62, 62, 60, 40, 0] },
  { linhaId: "bis-2", skuId: "bis-leite-126", porDia: [68.7, 68.7, 68.7, 45.6, 68.7, 33.5, 0] },
  { linhaId: "bis-2", skuId: "bis-black-100", porDia: [0, 0, 0, 22, 0, 0, 0] },
  { linhaId: "bis-3", skuId: "bis-xtra-45", porDia: [54, 54, 54, 54, 54, 30, 0] },
  { linhaId: "bis-4", skuId: "bis-oreo-100", porDia: [66, 66, 66, 66, 66, 35, 0] },
];

/** Plano de exemplo de uma semana (segunda = `semana`), como se importado do SAP. */
export function planoSeed(semana: string): PlanoProducao {
  const [a, m, d] = semana.split("-").map(Number);
  const itens: ItemPlano[] = [];
  for (let i = 0; i < 7; i++) {
    const data = dataLocal(new Date(a ?? 2026, (m ?? 1) - 1, (d ?? 1) + i));
    for (const linha of PLANO_BASE) {
      itens.push({ linhaId: linha.linhaId, skuId: linha.skuId, data, toneladas: linha.porDia[i] ?? 0 });
    }
  }
  return { semana, itens, origem: "seed", arquivo: "Plano_semanal_SAP.xlsx" };
}

// Falhas ------------------------------------------------------------------------------------------------

/** Tipos de falha da envolvedora (mockup MTBF do V2) e do processo. */
export const tiposFalha: TipoFalha[] = [
  { id: "enrosco", nome: "Enrosco" },
  { id: "troca-bobina", nome: "Troca de bobina" },
  { id: "ajuste-mordente", nome: "Ajuste de mordente" },
  { id: "ajuste-temperatura", nome: "Ajuste de temperatura" },
  { id: "selagem-enrugada", nome: "Selagem enrugada", critica: true },
  { id: "perda-sincronismo", nome: "Perda de sincronismo" },
  { id: "falta-material", nome: "Falta de material" },
  { id: "sensor", nome: "Falha de sensor" },
];

// Documentos técnicos (simulação do EQCMS) -------------------------------------------------------------

export const documentos: DocumentoTecnico[] = [
  {
    id: "it-troca-bobina",
    tipo: "it",
    codigo: "IT-EMB-014",
    titulo: "Troca de bobina de envoltório",
    versao: 5,
    atualizadoEm: "2026-08-12",
    equipamentoIds: ["loeschpack-2", "loeschpack-4", "loeschpack-5"],
    resumo: "Troca segura da bobina com a máquina em parada controlada, sem perder o registro da marca de corte.",
    passos: [
      { titulo: "Parar a máquina", detalhe: "Parada controlada pelo painel; aguarde o mordente abrir.", atencao: true },
      { titulo: "Retirar o tubete vazio", detalhe: "Solte a trava do mandril e retire o tubete pela lateral." },
      { titulo: "Instalar a bobina nova", detalhe: "Lote da bobina para cima; confira o sentido de desenrolar." },
      { titulo: "Emendar o filme", detalhe: "Fita de emenda a 90°, sem dobras, alinhada à marca de corte." },
      { titulo: "Registrar o lote", detalhe: "Anote o lote do envoltório na Rastreabilidade antes de liberar." },
      {
        titulo: "Liberar e conferir",
        detalhe: "Rode 10 pacotes em vazio e confira a selagem e o corte.",
        atencao: true,
      },
    ],
  },
  {
    id: "it-ajuste-mordente",
    tipo: "it",
    codigo: "IT-EMB-021",
    titulo: "Ajuste de pressão e temperatura do mordente",
    versao: 3,
    atualizadoEm: "2026-06-30",
    equipamentoIds: ["loeschpack-2", "loeschpack-4", "loeschpack-5"],
    resumo: "Ajuste dentro do centerline quando a selagem fica enrugada ou aberta.",
    passos: [
      { titulo: "Conferir o centerline", detalhe: "Longitudinal 165–175 °C; transversal 180–190 °C; ar 5,5–6,5 bar." },
      { titulo: "Ajustar um parâmetro por vez", detalhe: "Passos de 2 °C; espere 3 min entre ajustes." },
      { titulo: "Validar a selagem", detalhe: "Teste de vazamento em 5 pacotes seguidos.", atencao: true },
      { titulo: "Registrar o ajuste", detalhe: "Aponte a falha no MTBF como Ajuste de mordente ou de temperatura." },
    ],
  },
  {
    id: "lpp-luva",
    tipo: "lpp",
    codigo: "LPP-SEG-007",
    titulo: "Luva anticorte na troca de faca",
    versao: 2,
    atualizadoEm: "2026-09-02",
    equipamentoIds: ["loeschpack-2", "loeschpack-4", "loeschpack-5"],
    resumo: "Lição ponto a ponto: a faca transversal só é manuseada com luva anticorte nível 5.",
    passos: [
      { titulo: "Certo", detalhe: "Luva anticorte nível 5 nas duas mãos, faca segura pelo suporte." },
      { titulo: "Errado", detalhe: "Luva de nitrila ou mão nua, faca segura pela lâmina.", atencao: true },
    ],
  },
  {
    id: "lpp-temperagem",
    tipo: "lpp",
    codigo: "LPP-PRO-003",
    titulo: "Leitura do índice de temperagem",
    versao: 1,
    atualizadoEm: "2026-05-18",
    equipamentoIds: ["temperadeira-2"],
    resumo: "Como ler o temperímetro e quando ajustar a água gelada.",
    passos: [
      { titulo: "Coletar a amostra", detalhe: "Na saída da temperadeira, com a concha limpa e seca." },
      { titulo: "Ler o índice", detalhe: "Entre 4,5 e 6 TI está no padrão." },
      { titulo: "Fora do padrão", detalhe: "Ajuste a água gelada em 1 °C e repita em 10 min.", atencao: true },
    ],
  },
  {
    id: "book-caixa-aberta",
    tipo: "book",
    codigo: "BOOK-QUA-012",
    titulo: "Caixa de embarque aberta",
    versao: 4,
    atualizadoEm: "2026-02-18",
    equipamentoIds: ["loeschpack-2", "loeschpack-4", "loeschpack-5"],
    resumo: "Aparência da caixa de embarque: abas abertas ou mal coladas.",
    defeito: {
      categoria: "OBR · Aparência da caixa de embarque",
      modo: "Aberta",
      padrao: "Abas fechadas, coladas em toda a extensão, sem folga na tampa.",
      foraDoPadrao: "Aba levantada, cola falhando ou tampa com folga visível.",
      oQueMonitorar: "Nível de cola e alinhamento das abas a cada troca de bobina.",
      acao: "Separe as caixas, ajuste a coladeira e registre NC na Rastreabilidade.",
    },
  },
  {
    id: "book-selagem",
    tipo: "book",
    codigo: "BOOK-QUA-004",
    titulo: "Selagem enrugada",
    versao: 6,
    atualizadoEm: "2026-07-07",
    equipamentoIds: ["loeschpack-2", "loeschpack-4", "loeschpack-5"],
    resumo: "Pacote com rugas na solda transversal ou longitudinal.",
    defeito: {
      categoria: "PRI · Integridade da embalagem primária",
      modo: "Selagem enrugada",
      padrao: "Solda lisa, contínua, sem rugas nem canais.",
      foraDoPadrao: "Rugas na solda, canais que deixam o ar passar, filme queimado.",
      oQueMonitorar: "Temperatura dos mordentes e tensão do filme.",
      acao: "Siga a IT-EMB-021 e aponte Selagem enrugada no MTBF.",
    },
  },
  {
    id: "book-codificacao",
    tipo: "book",
    codigo: "BOOK-QUA-009",
    titulo: "Codificação ilegível",
    versao: 3,
    atualizadoEm: "2026-04-22",
    equipamentoIds: ["loeschpack-2", "loeschpack-4", "loeschpack-5"],
    resumo: "Lote e validade borrados ou incompletos no pacote.",
    defeito: {
      categoria: "PRI · Codificação",
      modo: "Ilegível",
      padrao: "Lote e validade nítidos, completos, na área prevista.",
      foraDoPadrao: "Caracteres borrados, falhando ou fora da área.",
      oQueMonitorar: "Fita do codificador e limpeza do cabeçote.",
      acao: "Pare a codificação, limpe o cabeçote e segregue o lote afetado.",
    },
  },
  {
    id: "book-bloom",
    tipo: "book",
    codigo: "BOOK-QUA-015",
    titulo: "Fat bloom no chocolate",
    versao: 2,
    atualizadoEm: "2026-03-09",
    equipamentoIds: ["temperadeira-2", "tunel-2"],
    resumo: "Manchas esbranquiçadas na superfície do chocolate.",
    defeito: {
      categoria: "PRO · Aparência do produto",
      modo: "Fat bloom",
      padrao: "Superfície brilhante e uniforme.",
      foraDoPadrao: "Manchas brancas ou acinzentadas, superfície fosca.",
      oQueMonitorar: "Índice de temperagem e temperatura do túnel.",
      acao: "Ajuste a temperagem (LPP-PRO-003) e avise a Qualidade.",
    },
  },
];
