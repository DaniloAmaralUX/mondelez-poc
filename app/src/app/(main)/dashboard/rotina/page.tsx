import type { Metadata } from "next";

import { AtalhosDoPerfil } from "./_components/atalhos-do-perfil";
import { FazerAgora } from "./_components/fazer-agora";
import { FocusCard } from "./_components/focus-card";
import { Greeting } from "./_components/greeting";
import { LinhaDoTurno } from "./_components/linha-do-turno";
import { QuoteCard } from "./_components/quote-card";
import { RecentNotesCard } from "./_components/recent-notes-card";
import { TasksSection } from "./_components/tasks-section";

export const metadata: Metadata = {
  title: "Minha Rotina · Rotinas Operacionais",
};

/**
 * v0.4 (docs/14): composição por largura útil (@container/content, descontada a sidebar), com a ordem do DOM igual à
 * ordem visual em todos os arranjos (WCAG 1.3.2/2.4.3, sem `order-*`):
 *
 * 1. Título grande (Large Title do iOS).
 * 2. Linha de widgets: "Fazer agora" (8/12) e "Fim do turno" (4/12) lado a lado a partir de 42 rem de área útil
 *    (iPad em retrato, 772 px). Abaixo disso, empilhados.
 * 3. Corpo: a partir de 60 rem (notebook, 1.120 px úteis) duas colunas 8/4: passagem, tarefas e atalhos à esquerda;
 *    linha do turno e recados no trilho da direita. Abaixo de 60 rem (iPad em retrato e em paisagem com a sidebar),
 *    coluna única, e os dois cards do trilho ficam lado a lado no fim, em vez de uma coluna de 260 px que rolava longe.
 */
export default function Page() {
  return (
    <div className="flex flex-col @min-[60rem]/content:gap-8 gap-6">
      {/*
       * Hero (v0.7, docs/20b), no espírito da home do YouTube Music: uma luz da marca descendo do topo (o roxo MDLZ World
       * e um toque de Golden Wheat) que se apaga na tela, o título grande e os atalhos em chips. "isolate" faz da seção
       * o contexto de empilhamento: a luz (-z-10) fica atrás do conteúdo e acima do fundo, e passa por baixo do
       * cabeçalho de vidro.
       */}
      <section aria-label="Início do turno" className="relative isolate flex flex-col gap-5">
        <div
          aria-hidden
          className="ambiente-da-marca pointer-events-none absolute -inset-x-4 -top-[calc(var(--dashboard-header-height)+1rem)] -z-10 h-[30rem] md:-inset-x-6 md:-top-[calc(var(--dashboard-header-height)+1.5rem)]"
        />
        <Greeting />
        <AtalhosDoPerfil />
      </section>

      <div className="grid @2xl/content:grid-cols-12 gap-6">
        <div className="@2xl/content:col-span-8 min-w-0 empty:hidden">
          <FazerAgora />
        </div>
        <div className="@2xl/content:col-span-4 min-w-0 empty:hidden">
          <FocusCard />
        </div>
      </div>

      <div className="grid @min-[60rem]/content:grid-cols-12 gap-6">
        <section className="@min-[60rem]/content:col-span-8 flex min-w-0 flex-col gap-6">
          <div className="min-w-0 empty:hidden">
            <QuoteCard />
          </div>
          <div className="min-w-0 empty:hidden">
            <TasksSection />
          </div>
        </section>

        <aside
          aria-label="Turno e recados"
          className="@min-[60rem]/content:col-span-4 grid min-w-0 @2xl/content:grid-cols-2 @min-[60rem]/content:grid-cols-1 items-start gap-6"
        >
          <div className="min-w-0 empty:hidden">
            <LinhaDoTurno />
          </div>
          <div className="min-w-0 empty:hidden">
            <RecentNotesCard />
          </div>
        </aside>
      </div>
    </div>
  );
}
