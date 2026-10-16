import type { Contexto, Equipamento, Linha, Modulo, Planta, Posto, RotinaTemplate, Usuario } from "@/domain/types";

import { equipamentos, linhas, modulos, plantas, postos, rotinaTemplates, usuarios } from "./seed";

/**
 * Fronteira de dados. No protótipo tudo vem do seed local; no piloto a mesma interface
 * passa a ser atendida por uma API, sem tocar na UI.
 */
export interface Repository {
  usuarioPorMatricula(matricula: string): Usuario | undefined;
  usuario(id: string): Usuario | undefined;
  usuarios(): readonly Usuario[];
  plantas(): readonly Planta[];
  linhas(plantaId: string): readonly Linha[];
  postos(linhaId: string): readonly Posto[];
  equipamento(id: string): Equipamento | undefined;
  modulos(): readonly Modulo[];
  modulo(slug: string): Modulo | undefined;
  templates(): readonly RotinaTemplate[];
  descreverContexto(contexto: Contexto): { planta?: Planta; linha?: Linha; posto?: Posto };
}

export const localRepository: Repository = {
  usuarioPorMatricula: (matricula) => usuarios.find((u) => u.matricula === matricula.trim()),
  usuario: (id) => usuarios.find((u) => u.id === id),
  usuarios: () => usuarios,
  plantas: () => plantas,
  linhas: (plantaId) => linhas.filter((l) => l.plantaId === plantaId),
  postos: (linhaId) => postos.filter((p) => p.linhaId === linhaId),
  equipamento: (id) => equipamentos.find((e) => e.id === id),
  modulos: () => modulos,
  modulo: (slug) => modulos.find((m) => m.slug === slug),
  templates: () => rotinaTemplates,
  descreverContexto: (c) => ({
    planta: plantas.find((p) => p.id === c.plantaId),
    linha: linhas.find((l) => l.id === c.linhaId),
    posto: postos.find((p) => p.id === c.postoId),
  }),
};
