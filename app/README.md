# app · Protótipo funcional

> **Status:** I1 (Fundação) em andamento. Base: template Studio Admin (MIT), telas de exemplo removidas. Login, seleção de posto e Minha Rotina funcionando com dados simulados.

Código do protótipo web (Next.js, deploy na Vercel). A fonte de verdade de produto e arquitetura está em `../docs/`; regras para agentes em `regras do código`.

## Rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # testes do domínio (Vitest)
npm run typecheck
npm run check      # Biome
npm run build
```

Demonstração: na tela de login, toque em uma pessoa e digite o PIN `1234`. Escolha Chocolate → Bis 2 → Embalagem. O relógio da demo começa às 07:40 do dia (1º turno) e anda em tempo real.

## Leitura obrigatória

| Doc | Para quê |
|---|---|
| `../docs/02-solucao-e-stack.md` | Stack, arquitetura, modelo de dados, regras, decisões D1–D10 |
| `../docs/06-moscow.md` | Prioridades e ordem de construção I1–I6 |
| `../docs/08-plano-de-implementacao.md` | Entregáveis por incremento, backlog de I1 e I2, critérios de aceite |
| `../docs/09-framework-ux-ui-audit.md` | Regras de scaffold (tipo, espaço, toque 56 px, cor) e auditoria por incremento |

## Conferência do template

- [x] Next.js 16 com App Router, React 19, TypeScript estrito, Turbopack
- [x] Tailwind CSS v4 com tokens em `@theme`
- [x] shadcn/ui inicializado (`radix-nova`), todos os componentes do registry instalados em `src/components/ui`
- [x] lucide-react como única biblioteca de ícones
- [x] `src/` com alias `@/*`
- [x] Lint com **Biome** (decisão D9); `npm run build` passa
- [x] Removidos: Google Analytics do autor, husky, telas e imagens de exemplo, sitemap
- [x] Licença MIT
- [x] Paisagem 1180 × 820 e retrato 820 × 1180 sem depender de hover

## Ferramentas shadcn

- Guia oficial em `../referências locais (regras de composição, forms, ícones, estilo).
- Servidor MCP do shadcn em `../.mcp.json` e `.mcp.json`: reiniciar o o ambiente de desenvolvimento e aprovar o servidor `shadcn`.
- CLI: `npx shadcn@latest search`, `view`, `docs <componente>`, `add`.

## I1 · o que já existe

- Tokens: cor de ação, semânticos (`success`, `warning`, `info`), `--spacing-touch: 56px`, `font-strong` (650).
- Shell de tablet: sidebar com alvos de 56 px, header com contexto tocável, turno e relógio, indicador de salvamento, troca rápida de usuário.
- Seed da Bis 2: 6 pessoas (5 perfis), linhas Bis 1–4, postos, Loeschpack 2/4/5, 16 módulos, 15 rotinas por posto × perfil × frequência.
- Login por matrícula + PIN; contexto lembrado no tablet (IndexedDB).
- `RoutineEngine` e turnos no domínio, com 12 testes.
- Minha Rotina: próxima tarefa em destaque, atrasadas, para agora, mais tarde, feitas; progresso do turno.
- Grade de módulos e página de cada módulo (placeholder com o incremento previsto).

## Falta para fechar o I1

- [ ] Ligar o projeto na Vercel (preview por PR, produção em `main`).
- [ ] Página interna `/dev/componentes`.
- [ ] Auditoria `UI Audit` do I1 com relatório em `../docs/auditorias/`.
- [ ] Teste em tablet real, com luva, nas duas orientações.

O botão "Marcar como feita" na página do módulo é um atalho temporário do I1; sai quando o motor de formulários (I2) existir.
