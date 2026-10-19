import { Suspense } from "react";

import type { Metadata } from "next";

import { AgendaEEscala } from "./_components/agenda-e-escala";

export const metadata: Metadata = {
  title: "Agenda e escala · Rotinas Operacionais",
};

export default function Page() {
  // Suspense: a aba vem de `?aba=` (useSearchParams).
  return (
    <Suspense>
      <AgendaEEscala />
    </Suspense>
  );
}
