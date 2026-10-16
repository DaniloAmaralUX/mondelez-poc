import type { Metadata } from "next";

import { TarefasDoPosto } from "./_components/tarefas-do-posto";

export const metadata: Metadata = {
  title: "Tarefas do posto · Rotinas Operacionais",
};

export default function Page() {
  return <TarefasDoPosto />;
}
