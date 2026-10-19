import { Suspense } from "react";

import type { Metadata } from "next";

import { Documentos } from "./_components/documentos";

export const metadata: Metadata = {
  title: "Documentos · Rotinas Operacionais",
};

export default function Page() {
  // Suspense: a tela lê `?doc=` e `?equipamento=` com useSearchParams.
  return (
    <Suspense>
      <Documentos />
    </Suspense>
  );
}
