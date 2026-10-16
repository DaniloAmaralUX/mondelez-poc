import {
  Bell,
  ClipboardCheck,
  Construction,
  type LucideIcon,
  ListChecks,
  ListTodo,
} from "lucide-react";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Turno",
    items: [
      { id: "rotina", title: "Minha Rotina", url: "/dashboard/rotina", icon: ListChecks },
      { id: "tarefas", title: "Tarefas do posto", url: "/dashboard/tarefas", icon: ListTodo },
    ],
  },
  {
    id: 2,
    label: "Registros",
    items: [
      { id: "alertas", title: "Alertas", url: "/dashboard/alertas", icon: Bell },
      {
        id: "checklists",
        title: "Checklists",
        icon: ClipboardCheck,
        subItems: [
          { id: "checklist-ppli", title: "PPLI e Centerlining", url: "/dashboard/checklist/ppli-l4" },
          { id: "checklist-pre-partida", title: "Pré-partida", url: "/dashboard/checklist/pre-partida-l4" },
          { id: "checklist-rastreabilidade", title: "Rastreabilidade", url: "/dashboard/checklist/rastreabilidade-envoltorio" },
          { id: "checklist-manutencao", title: "Manutenção autônoma", url: "/dashboard/checklist/manutencao-autonoma-l4" },
          { id: "checklist-limpeza", title: "Limpeza semanal", url: "/dashboard/checklist/limpeza-semanal" },
        ],
      },
    ],
  },
  {
    id: 3,
    label: "Em construção",
    items: [
      {
        // Um único item recolhido no lugar de oito itens desabilitados (UI Audit, navegação por prioridade).
        id: "proximas",
        title: "Próximas telas",
        icon: Construction,
        subItems: [
          { id: "hora-x-hora", title: "Hora x Hora", url: "/dashboard/coming-soon", disabled: true },
          { id: "mtbf", title: "MTBF", url: "/dashboard/coming-soon", disabled: true },
          { id: "relatorio-turno", title: "Relatório do turno", url: "/dashboard/coming-soon", disabled: true },
          { id: "troca-de-turno", title: "Troca de turno", url: "/dashboard/coming-soon", disabled: true },
          { id: "agenda", title: "Agenda e escala", url: "/dashboard/coming-soon", disabled: true },
          { id: "documentos", title: "IT, LPP e book", url: "/dashboard/coming-soon", disabled: true },
          { id: "usuarios", title: "Usuários", url: "/dashboard/coming-soon", disabled: true },
          { id: "perfis", title: "Perfis", url: "/dashboard/coming-soon", disabled: true },
        ],
      },
    ],
  },
];
