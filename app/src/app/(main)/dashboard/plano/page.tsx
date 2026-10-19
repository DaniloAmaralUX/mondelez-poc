import type { Metadata } from "next";

import { PlanoDeProducao } from "./_components/plano-de-producao";

export const metadata: Metadata = {
  title: "Plano de produção · Rotinas Operacionais",
};

export default function Page() {
  return <PlanoDeProducao />;
}
