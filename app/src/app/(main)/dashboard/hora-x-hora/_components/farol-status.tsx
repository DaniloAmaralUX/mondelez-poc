import { cn } from "cn";

import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import type { Farol } from "@/domain/producao";
import { STATUS_LEGIVEL } from "@/lib/status-legivel";

import { FAROL } from "./formato";

/** Farol da meta (RN-05) no `Status` do template: cor, ponto e o estado por extenso. O ping fica só no vermelho. */
export function FarolStatus({ farol, className }: { readonly farol: Farol; readonly className?: string }) {
  const { rotulo, variante } = FAROL[farol];
  return (
    <Status variant={variante} className={cn("toque:text-sm", STATUS_LEGIVEL, className)}>
      <StatusIndicator className={farol === "vermelho" ? undefined : "before:hidden"} />
      <StatusLabel>{rotulo}</StatusLabel>
    </Status>
  );
}
