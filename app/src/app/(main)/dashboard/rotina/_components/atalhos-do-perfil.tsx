"use client";

import Link from "next/link";

import { itensDoPerfil } from "@/navigation/sidebar/sidebar-items";
import { useUsuarioAtual } from "@/stores/session/session-store";

/**
 * Atalhos em chips logo abaixo do título (v0.7, docs/20b), como os chips de humor do YouTube Music: as telas que o
 * perfil usa, numa linha que rola de lado no iPad. Substitui o bloco "Atalhos" da liderança, que ficava no meio da
 * coluna; aqui servem a todos os perfis e ficam onde o olho começa. Só navegação: nada é registrado por eles.
 *
 * Chip: fundo do texto a 6 % (branco a 10 % no escuro, como no YouTube Music), raio de 8 px, 36 px no notebook e 44 px
 * no toque. Os itens vêm do menu do perfil (itensDoPerfil), sem a Minha Rotina e sem repetir telas.
 */
export function AtalhosDoPerfil() {
  const usuario = useUsuarioAtual();
  if (!usuario) return null;

  const vistos = new Set<string>(["/dashboard/rotina"]);
  const atalhos = itensDoPerfil(usuario.perfil)
    .flatMap((grupo) => grupo.items.flatMap((item) => (item.subItems ? [] : [{ titulo: item.title, url: item.url }])))
    .filter((a) => {
      if (vistos.has(a.url)) return false;
      vistos.add(a.url);
      return true;
    })
    .slice(0, 9);

  if (atalhos.length === 0) return null;

  return (
    <nav aria-label="Atalhos" className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
      <ul className="flex w-max gap-2.5 toque:gap-3">
        {atalhos.map((a) => (
          <li key={a.url}>
            {/* prefetch: as telas do perfil em cache para abrir sem rede (lib/rotas.ts). */}
            <Link
              prefetch
              href={a.url}
              className="inline-flex h-9 toque:h-11 items-center whitespace-nowrap rounded-lg bg-foreground/[0.06] px-3.5 toque:px-4 font-medium text-foreground text-sm toque:text-base transition-colors duration-150 hover:bg-foreground/[0.1] focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 dark:bg-white/10 dark:hover:bg-white/15"
            >
              {a.titulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
