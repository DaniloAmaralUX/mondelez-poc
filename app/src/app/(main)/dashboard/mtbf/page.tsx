import { Suspense } from "react";

import type { Metadata } from "next";

import { Mtbf } from "./_components/mtbf";

export const metadata: Metadata = {
  title: "MTBF · Rotinas Operacionais",
};

export default function Page() {
  return (
    <Suspense>
      <Mtbf />
    </Suspense>
  );
}
