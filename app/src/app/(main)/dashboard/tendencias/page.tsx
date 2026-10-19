import type { Metadata } from "next";

import { SoComPermissao } from "../_components/so-com-permissao";
import { Tendencias } from "./_components/tendencias";

export const metadata: Metadata = {
  title: "Tendências · Rotinas Operacionais",
};

export default function Page() {
  return (
    <SoComPermissao recurso="tendencias">
      <Tendencias />
    </SoComPermissao>
  );
}
