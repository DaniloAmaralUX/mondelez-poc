import type { Usuario } from "@/domain/types";

import { usuarios } from "./seed";

/** Pessoas da demonstração no formato usado pelo shell do template (NavUser, AccountSwitcher). */
export function paraUsuarioDoShell(u: Usuario) {
  return {
    id: u.id,
    name: u.nome,
    username: u.matricula,
    email: `Matrícula ${u.matricula}`,
    avatar: "",
    role: u.cargo,
  };
}

export const users = usuarios.map(paraUsuarioDoShell);
