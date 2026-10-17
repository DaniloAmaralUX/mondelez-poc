import { cn } from "cn";
import { ListChecks } from "lucide-react";

/**
 * Marca do app como um ícone de app do iOS (v0.4, docs/14): bloco arredondado no acento do tema com o glifo em branco.
 * Substitui o ⌘ do template, que é a tecla Command do Mac e não diz nada sobre rotinas. Decorativa: o nome do app vem
 * sempre ao lado, em texto.
 */
export function MarcaDoApp({
  className,
  tamanho = "md",
}: {
  readonly className?: string;
  readonly tamanho?: "sm" | "md" | "lg";
}) {
  return (
    <span
      aria-hidden
      data-slot="marca-do-app"
      className={cn(
        "grid shrink-0 place-items-center bg-primary text-primary-foreground",
        "shadow-[inset_0_1px_0_oklch(1_0_0/18%),0_1px_2px_oklch(0_0_0/12%)]",
        tamanho === "sm" && "size-7 rounded-[0.5rem] [&_svg]:size-4",
        tamanho === "md" && "size-10 rounded-[0.7rem] [&_svg]:size-5",
        tamanho === "lg" && "size-16 rounded-[1.1rem] [&_svg]:size-8",
        className,
      )}
    >
      <ListChecks strokeWidth={2.25} />
    </span>
  );
}
