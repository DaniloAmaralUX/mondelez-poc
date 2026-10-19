import type { Metadata } from "next";

import { SoComPermissao } from "../_components/so-com-permissao";
import { Pessoas } from "./_components/pessoas";

export const metadata: Metadata = {
  title: "Pessoas · Rotinas Operacionais",
};

export default function Page() {
  return (
    <SoComPermissao recurso="usuarios">
      <Pessoas />
    </SoComPermissao>
  );
}
