import type { Metadata } from "next";

import { FazerAgora } from "./_components/fazer-agora";
import { FocusCard } from "./_components/focus-card";
import { Greeting } from "./_components/greeting";
import { LinhaDoTurno } from "./_components/linha-do-turno";
import { QuickActions } from "./_components/quick-actions";
import { QuoteCard } from "./_components/quote-card";
import { RecentNotesCard } from "./_components/recent-notes-card";
import { TasksSection } from "./_components/tasks-section";

export const metadata: Metadata = {
  title: "Minha Rotina · Rotinas Operacionais",
};

/**
 * Duas colunas (8/4) quando a área útil (descontada a sidebar) passa de 896 px; 9/3 a partir de 960 px de área útil,
 * que é o `xl` do template (1280 px de viewport) com a sidebar aberta (1280 − 272 − 48): o desktop não muda
 * (docs/12 §3.2). Em coluna única (tablet em retrato, paisagem com a sidebar aberta) as seções deixam de ser caixas (`contents`) e
 * os blocos seguem a ordem do turno do operador: saudação, fazer agora, fim do turno, passagem do turno anterior,
 * tarefas (e os atalhos da liderança), linha do turno e recados.
 *
 * - A passagem (pendência deixada pelo turno anterior) se lê no início do turno: antes das Tarefas, como na coluna
 *   principal das duas colunas. Antes ela era o último bloco no retrato e o segundo no desktop.
 * - Ordem visual próxima da do DOM (Tab e leitor de tela, WCAG 1.3.2/2.4.3): passagem, tarefas e atalhos têm o
 *   mesmo order e seguem a ordem em que estão no DOM. Só "Fim do turno" sobe da coluna lateral.
 */
export default function Page() {
  return (
    <div className="grid @4xl/content:grid-cols-12 gap-6">
      <section className="@4xl/content:col-span-8 @min-[60rem]/content:col-span-9 @4xl/content:flex contents @4xl/content:flex-col @4xl/content:gap-6">
        <div className="@4xl/content:order-none order-1 min-w-0 empty:hidden">
          <Greeting />
        </div>
        <div className="@4xl/content:order-none order-2 min-w-0 empty:hidden">
          <FazerAgora />
        </div>
        <div className="@4xl/content:order-none order-4 min-w-0 empty:hidden">
          <QuoteCard />
        </div>
        <div className="@4xl/content:order-none order-4 min-w-0 empty:hidden">
          <TasksSection />
        </div>
        {/* Os atalhos não existem para o operador: sem conteúdo, o bloco some e não deixa espaço sobrando. */}
        <div className="@4xl/content:order-none order-4 min-w-0 empty:hidden">
          <QuickActions />
        </div>
      </section>

      <section className="@4xl/content:col-span-4 @min-[60rem]/content:col-span-3 @4xl/content:flex contents @4xl/content:flex-col @4xl/content:gap-6">
        <div className="@4xl/content:order-none order-5 min-w-0 empty:hidden">
          <LinhaDoTurno />
        </div>
        <div className="@4xl/content:order-none order-3 min-w-0 empty:hidden">
          <FocusCard />
        </div>
        <div className="@4xl/content:order-none order-6 min-w-0 empty:hidden">
          <RecentNotesCard />
        </div>
      </section>
    </div>
  );
}
