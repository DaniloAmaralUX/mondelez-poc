import type {
  Contexto,
  DocumentoTecnico,
  Equipamento,
  Formulario,
  Linha,
  Modulo,
  PlanoProducao,
  Planta,
  Posto,
  RotinaTemplate,
  Sku,
  TipoFalha,
  Usuario,
} from "@/domain/types";

import {
  documentos,
  equipamentos,
  formularios,
  linhas,
  modulos,
  planoSeed,
  plantas,
  postos,
  rotinaTemplates,
  skus,
  tiposFalha,
  usuarios,
} from "./seed";

/**
 * Fronteira de dados. No protótipo tudo vem do seed local; no piloto a mesma interface
 * passa a ser atendida por uma API, sem tocar na UI.
 *
 * v0.5: cadastros feitos no tablet (usuários pela Assistência, nova versão de checklist pela Especialista) ficam no
 * store da sessão e entram aqui por `definirCadastrosDoTablet`, chamado pelo store sempre que eles mudam. Assim login,
 * motor de rotinas e checklist enxergam o cadastro sem saber de onde ele veio.
 */
export interface Repository {
  usuarioPorMatricula(matricula: string): Usuario | undefined;
  usuario(id: string): Usuario | undefined;
  usuarios(): readonly Usuario[];
  plantas(): readonly Planta[];
  linhas(plantaId: string): readonly Linha[];
  linha(id: string): Linha | undefined;
  postos(linhaId: string): readonly Posto[];
  equipamento(id: string): Equipamento | undefined;
  /** Equipamentos de um posto. */
  equipamentos(postoId: string): readonly Equipamento[];
  modulos(): readonly Modulo[];
  modulo(slug: string): Modulo | undefined;
  templates(): readonly RotinaTemplate[];
  formulario(id: string): Formulario | undefined;
  formulariosPorId(): Readonly<Record<string, Formulario>>;
  /** Formulários na versão vigente (com as publicadas no tablet). */
  formularios(): readonly Formulario[];
  posto(id: string): Posto | undefined;
  descreverContexto(contexto: Contexto): { planta?: Planta; linha?: Linha; posto?: Posto };
  skus(linhaId?: string): readonly Sku[];
  sku(id: string): Sku | undefined;
  skusPorId(): Readonly<Record<string, Sku>>;
  tiposFalha(): readonly TipoFalha[];
  documentos(): readonly DocumentoTecnico[];
  documento(id: string): DocumentoTecnico | undefined;
  /** Plano de exemplo da semana (antes de qualquer importação). */
  planoSeed(semana: string): PlanoProducao;
}

let usuariosDoTablet: readonly Usuario[] = [];
let formulariosPublicados: Readonly<Record<string, Formulario>> = {};
let formulariosPorIdCache: Readonly<Record<string, Formulario>> = Object.fromEntries(formularios.map((f) => [f.id, f]));

/** Chamado pelo store da sessão: usuários cadastrados e formulários publicados no tablet. */
export function definirCadastrosDoTablet(cadastros: {
  usuarios: Readonly<Record<string, Usuario>>;
  formularios: Readonly<Record<string, Formulario>>;
}) {
  usuariosDoTablet = Object.values(cadastros.usuarios);
  formulariosPublicados = cadastros.formularios;
  formulariosPorIdCache = Object.fromEntries(formularios.map((f) => [f.id, formulariosPublicados[f.id] ?? f]));
}

const todosUsuarios = () => (usuariosDoTablet.length ? [...usuarios, ...usuariosDoTablet] : usuarios);
const SKUS_POR_ID = Object.fromEntries(skus.map((s) => [s.id, s]));

export const localRepository: Repository = {
  usuarioPorMatricula: (matricula) => todosUsuarios().find((u) => u.matricula === matricula.trim()),
  usuario: (id) => todosUsuarios().find((u) => u.id === id),
  usuarios: () => todosUsuarios(),
  plantas: () => plantas,
  linhas: (plantaId) => linhas.filter((l) => l.plantaId === plantaId),
  linha: (id) => linhas.find((l) => l.id === id),
  postos: (linhaId) => postos.filter((p) => p.linhaId === linhaId),
  equipamento: (id) => equipamentos.find((e) => e.id === id),
  equipamentos: (postoId) => equipamentos.filter((e) => e.postoId === postoId),
  modulos: () => modulos,
  modulo: (slug) => modulos.find((m) => m.slug === slug),
  templates: () => rotinaTemplates,
  formulario: (id) => formulariosPorIdCache[id],
  formulariosPorId: () => formulariosPorIdCache,
  formularios: () => Object.values(formulariosPorIdCache),
  posto: (id) => postos.find((p) => p.id === id),
  descreverContexto: (c) => ({
    planta: plantas.find((p) => p.id === c.plantaId),
    linha: linhas.find((l) => l.id === c.linhaId),
    posto: postos.find((p) => p.id === c.postoId),
  }),
  skus: (linhaId) => (linhaId ? skus.filter((s) => s.linhaId === linhaId) : skus),
  sku: (id) => SKUS_POR_ID[id],
  skusPorId: () => SKUS_POR_ID,
  tiposFalha: () => tiposFalha,
  documentos: () => documentos,
  documento: (id) => documentos.find((d) => d.id === id),
  planoSeed: (semana) => planoSeed(semana),
};
