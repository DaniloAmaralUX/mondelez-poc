import {
  Bell,
  BookOpenText,
  CalendarDays,
  ChartColumn,
  ClipboardCheck,
  ClipboardList,
  Gauge,
  ListChecks,
  ListTodo,
  type LucideIcon,
  Repeat,
  ShieldCheck,
  Users,
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
      {
        id: "rotina",
        title: "Minha Rotina",
        url: "/dashboard/rotina",
        icon: ListChecks,
      },
      {
        id: "tarefas",
        title: "Tarefas do posto",
        url: "/dashboard/tarefas",
        icon: ListTodo,
      },
      {
        id: "hora-x-hora",
        title: "Hora x Hora",
        url: "/dashboard/coming-soon",
        icon: ChartColumn,
        badge: "soon",
        disabled: true,
      },
      {
        id: "mtbf",
        title: "MTBF",
        url: "/dashboard/coming-soon",
        icon: Gauge,
        badge: "soon",
        disabled: true,
      },
      {
        id: "relatorio-turno",
        title: "Relatório do turno",
        url: "/dashboard/coming-soon",
        icon: ClipboardList,
        badge: "soon",
        disabled: true,
      },
    ],
  },
  {
    id: 2,
    label: "Registros",
    items: [
      {
        id: "alertas",
        title: "Alertas",
        url: "/dashboard/alertas",
        icon: Bell,
      },
      {
        id: "checklists",
        title: "Checklists",
        icon: ClipboardCheck,
        subItems: [
          { id: "checklist-ppli", title: "PPLI e Centerlining", url: "/dashboard/checklist/ppli-l4" },
          { id: "checklist-pre-partida", title: "Pré-partida", url: "/dashboard/checklist/pre-partida-l4" },
          {
            id: "checklist-rastreabilidade",
            title: "Rastreabilidade",
            url: "/dashboard/checklist/rastreabilidade-envoltorio",
          },
          {
            id: "checklist-manutencao",
            title: "Manutenção autônoma",
            url: "/dashboard/checklist/manutencao-autonoma-l4",
          },
          { id: "checklist-limpeza", title: "Limpeza semanal", url: "/dashboard/checklist/limpeza-semanal" },
        ],
      },
      {
        id: "troca-de-turno",
        title: "Troca de turno",
        url: "/dashboard/coming-soon",
        icon: Repeat,
        badge: "soon",
        disabled: true,
      },
    ],
  },
  {
    id: 3,
    label: "Consultas",
    items: [
      {
        id: "agenda",
        title: "Agenda e escala",
        url: "/dashboard/coming-soon",
        icon: CalendarDays,
        badge: "soon",
        disabled: true,
      },
      {
        id: "documentos",
        title: "IT, LPP e book",
        url: "/dashboard/coming-soon",
        icon: BookOpenText,
        badge: "soon",
        disabled: true,
      },
    ],
  },
  {
    id: 4,
    label: "Administração",
    items: [
      {
        id: "usuarios",
        title: "Usuários",
        url: "/dashboard/coming-soon",
        icon: Users,
        badge: "soon",
        disabled: true,
      },
      {
        id: "perfis",
        title: "Perfis",
        url: "/dashboard/coming-soon",
        icon: ShieldCheck,
        badge: "soon",
        disabled: true,
      },
    ],
  },
];
