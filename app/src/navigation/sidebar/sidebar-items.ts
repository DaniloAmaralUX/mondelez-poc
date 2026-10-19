import {
  Bell,
  BookOpenText,
  CalendarDays,
  CalendarRange,
  ChartColumn,
  ChartLine,
  ClipboardCheck,
  ClipboardList,
  FileClock,
  Gauge,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  type LucideIcon,
  Repeat,
  Scale,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";

import { pode, type Recurso } from "@/domain/permissoes";
import type { Perfil } from "@/domain/types";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
  /** Recurso da matriz de permissões (domain/permissoes): sem leitura para o perfil, o item some do menu. */
  recurso?: Recurso;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
  /** Recurso da matriz de permissões (domain/permissoes): sem leitura para o perfil, o item some do menu. */
  recurso?: Recurso;
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

/**
 * Menu da v0.5 (docs/16): os grupos do template (doc 10) com as telas novas. Cada item diz o recurso da matriz de
 * permissões; `itensDoPerfil` tira o que o perfil não lê (RF-08).
 */
export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Turno",
    items: [
      { id: "rotina", title: "Minha Rotina", url: "/dashboard/rotina", icon: ListChecks, recurso: "rotina" },
      { id: "tarefas", title: "Tarefas dos postos", url: "/dashboard/tarefas", icon: ListTodo, recurso: "rotina" },
      {
        id: "troca-de-turno",
        title: "Troca de turno",
        url: "/dashboard/troca-de-turno",
        icon: Repeat,
        recurso: "troca-de-turno",
      },
    ],
  },
  {
    id: 2,
    label: "Produção",
    items: [
      {
        id: "hora-x-hora",
        title: "Hora x Hora",
        url: "/dashboard/hora-x-hora",
        icon: ChartColumn,
        recurso: "apontamentos",
      },
      { id: "mtbf", title: "MTBF", url: "/dashboard/mtbf", icon: Gauge, recurso: "apontamentos" },
      {
        id: "sobrepeso",
        title: "Sobrepeso e refugo",
        url: "/dashboard/sobrepeso",
        icon: Scale,
        recurso: "apontamentos",
      },
    ],
  },
  {
    id: 3,
    label: "Registros",
    items: [
      { id: "alertas", title: "Alertas", url: "/dashboard/alertas", icon: Bell, recurso: "alertas" },
      {
        id: "checklists",
        title: "Checklists",
        icon: ClipboardCheck,
        recurso: "checklists",
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
      { id: "historico", title: "Histórico", url: "/dashboard/historico", icon: FileClock, recurso: "historico" },
    ],
  },
  {
    id: 4,
    label: "Liderança",
    items: [
      {
        id: "relatorio-turno",
        title: "Relatório do turno",
        url: "/dashboard/relatorio-turno",
        icon: ClipboardList,
        recurso: "relatorio",
      },
      { id: "painel", title: "Painel das linhas", url: "/dashboard/painel", icon: LayoutDashboard, recurso: "painel" },
      { id: "tendencias", title: "Tendências", url: "/dashboard/tendencias", icon: ChartLine, recurso: "tendencias" },
      {
        id: "notificacoes",
        title: "Notificações",
        url: "/dashboard/notificacoes",
        icon: Send,
        recurso: "notificacoes",
      },
    ],
  },
  {
    id: 5,
    label: "Consultas",
    items: [
      { id: "plano", title: "Plano de produção", url: "/dashboard/plano", icon: CalendarRange, recurso: "plano" },
      {
        id: "documentos",
        title: "IT, LPP e book",
        url: "/dashboard/documentos",
        icon: BookOpenText,
        recurso: "documentos",
      },
      { id: "agenda", title: "Agenda e escala", url: "/dashboard/agenda", icon: CalendarDays, recurso: "agenda" },
    ],
  },
  {
    id: 6,
    label: "Administração",
    items: [
      { id: "usuarios", title: "Pessoas", url: "/dashboard/usuarios", icon: Users, recurso: "usuarios" },
      { id: "padroes", title: "Padrões", url: "/dashboard/padroes", icon: ShieldCheck, recurso: "padroes" },
    ],
  },
];

/** Menu do perfil: itens e subitens sem leitura somem; grupos vazios também (RF-08). */
export function itensDoPerfil(perfil: Perfil | undefined): NavGroup[] {
  const ve = (recurso: Recurso | undefined) => !recurso || pode(perfil, recurso);
  return sidebarItems
    .map((grupo) => ({
      ...grupo,
      items: grupo.items
        .filter((item) => ve(item.recurso))
        .map((item) => (item.subItems ? { ...item, subItems: item.subItems.filter((sub) => ve(sub.recurso)) } : item)),
    }))
    .filter((grupo) => grupo.items.length > 0);
}
