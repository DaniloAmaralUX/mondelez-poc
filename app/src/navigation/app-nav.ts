import { Bell, ClipboardList, History, LayoutGrid, ListChecks, type LucideIcon } from "lucide-react";

import type { Perfil } from "@/domain/types";

export interface AppNavItem {
  id: string;
  titulo: string;
  url: string;
  icone: LucideIcon;
  /** Ainda não construído; aparece desabilitado com o incremento previsto. */
  emBreve?: string;
  perfis?: Perfil[];
}

export const appNav: AppNavItem[] = [
  { id: "rotina", titulo: "Minha Rotina", url: "/rotina", icone: ListChecks },
  { id: "modulos", titulo: "Módulos", url: "/modulos", icone: LayoutGrid },
  {
    id: "alertas",
    titulo: "Alertas",
    url: "/alertas",
    icone: Bell,
    emBreve: "I2",
    perfis: ["supervisao", "gerencia", "especialista"],
  },
  { id: "relatorio", titulo: "Relatório do turno", url: "/relatorio-turno", icone: ClipboardList, emBreve: "I4" },
  { id: "historico", titulo: "Histórico", url: "/historico", icone: History, emBreve: "I6" },
];
