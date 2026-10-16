import { Suspense } from "react";

import type { Metadata } from "next";

import { Alertas } from "./_components/alertas";

export const metadata: Metadata = {
  title: "Alertas · Rotinas Operacionais",
};

export default function Page() {
  return (
    <Suspense>
      <Alertas />
    </Suspense>
  );
}
