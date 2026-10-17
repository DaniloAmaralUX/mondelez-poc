/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    // Next 16.4: detecta queda de rede (eventos + falha real de fetch), retenta navegação/prefetch quando volta e
    // expõe `useOffline()` de "next/offline", que alimenta a rede do tablet na <Plataforma /> (docs/12 §3.5).
    useOffline: true,
    // Rotas do operador buscadas com prefetch completo (lib/rotas.ts) ficam no cache do cliente por `static`, 5 min
    // por padrão: depois disso, sem rede, a navegação esperava a conexão. Um turno (8 h) cobre uma queda longa e um
    // checklist demorado. As telas leem o estado do tablet no cliente, então o HTML guardado não fica velho.
    // `dynamic` (0 por padrão): a tela aberta ou visitada (a primeira carga, uma navegação) também fica reutilizável
    // por um turno. O prefetch não guarda a tela em que se está (só o que difere dela): sem isto, a Minha Rotina aberta
    // quando a rede caiu não voltava depois do checklist.
    staleTimes: { static: 8 * 60 * 60, dynamic: 8 * 60 * 60 },
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/dashboard/default",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
