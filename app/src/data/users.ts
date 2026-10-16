import type { Perfil, Usuario } from "@/domain/types";

import { usuarios } from "./seed";

/** Perfis de acesso (proposta Pitang), em uma palavra, como o template exibe o papel. */
const PERFIL_LABEL: Record<Perfil, string> = {
  operacao: "operação",
  supervisao: "supervisão",
  gerencia: "gerência",
  assistencia: "assistência",
  especialista: "especialista",
};

/** Pessoas da demonstração no formato usado pelo shell do template (NavUser, AccountSwitcher). */
export function paraUsuarioDoShell(u: Usuario) {
  return {
    id: u.id,
    name: u.nome,
    username: u.matricula,
    email: `Matrícula ${u.matricula}`,
    avatar: "",
    role: PERFIL_LABEL[u.perfil],
  };
}

export const users = usuarios.map(paraUsuarioDoShell);
