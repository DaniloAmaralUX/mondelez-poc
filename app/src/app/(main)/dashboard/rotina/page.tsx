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

export default function Page() {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <section className="lg:col-span-8 xl:col-span-9">
        <div className="flex flex-col gap-6">
          <Greeting />
          <FazerAgora />
          <QuoteCard />
          <TasksSection />
          <QuickActions />
        </div>
      </section>

      <section className="flex flex-col gap-6 lg:col-span-4 xl:col-span-3">
        <LinhaDoTurno />
        <FocusCard />
        <RecentNotesCard />
      </section>
    </div>
  );
}
