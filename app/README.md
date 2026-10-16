# app · Protótipo funcional (v0.2)

Protótipo web de Gestão de Rotinas Operacionais sobre o template **Studio Admin** (Next.js 16, shadcn/ui), usado 1:1: mesmo shell, telas e componentes. O único ajuste visual é o tema **Linear** (`src/styles/presets/linear.css`, padrão do app, fonte Inter). O README original do template está em `README.template.md`.

Fonte de verdade de produto: `../docs/`. Mapa de cada parte do escopo para a tela do template: `../docs/10-mapa-do-template.md`.

## Rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # domínio (Vitest)
npm run typecheck
npm run build
```

## Demonstração

1. Login (`/auth/login`): matrícula `104233` (Alberto, operação), PIN `1234`, linha Bis 2, posto Embalagem. A liderança entra por "Entrar com SSO corporativo" (simulado).
2. O relógio da demo começa às 07:40 do 1º turno e anda em tempo real. O botão de relógio no header avança 15 min, 1 h ou vai ao fim do turno, simula falta de rede e reseta os dados.
3. Minha Rotina → "Registrar agora" abre o PPLI. Marque um item como NC, justifique e registre.
4. Troque para Renata Lins (avatar no header) → Alertas: o alerta A-NC aparece; assuma e resolva.
5. Avance o relógio: tarefas vencidas viram A-ATRASO, e crítico depois de 30 min.

## O que a v0 cobre

| Escopo | Tela do template |
|---|---|
| Login por matrícula + PIN e posto; SSO simulado | Login v2 |
| Minha Rotina do turno | Productivity |
| Checklists com C/NC/NA, centerline com faixa, justificativa de NC e prévia do registro | Invoice |
| Alertas A-ATRASO e A-NC com ciclo aberto → em tratamento → resolvido | Logistics |
| Tarefas do posto no turno | Tasks |
| Troca de pessoa, painel da demonstração, busca, ajuda | Shell do template (header e sidebar) |

Itens do menu com "em breve" (Hora x Hora, MTBF, Relatório do turno, Troca de turno, Agenda, Documentos, Usuários, Perfis) já têm tela do template definida no doc 10.

## v0.2

A v0.2 troca componentes e layouts onde o template não servia ao chão de fábrica, com base na auditoria UI Audit da v0 (`../docs/auditorias/`) e nas guias de Emil Kowalski (lista de bibliotecas de Emil Kowalski, design engineering de Emil Kowalski, oportunidades de movimento). Decisões em `../docs/11-v0.2-componentes-e-layout.md`.

- Minha Rotina: "Fazer agora" em destaque, lista de tarefas tocável com "Desfazer", linha do turno em timeline.
- Checklist: etapas por grupo com revisão final, barra fixa com progresso, C/NC/NA de 44 px, centerline com −/+ e régua da faixa.
- Alertas: histórico em timeline, barra de ações fixa, contagem no menu e aviso de alerta novo para a liderança.
- Shell: estado de envio sempre visível, PIN em 4 dígitos com envio automático, telas futuras agrupadas no menu.
- Novas dependências: `motion`, `@number-flow/react`; componentes `@diceui/timeline`, `@diceui/stepper`, `@diceui/status` e `@reui/number-field` via CLI do shadcn.

## Arquitetura

- Domínio puro e testado: `src/domain/` (turnos, motor de rotina, motor de formulários, motor de alertas).
- Dados: `src/data/seed.ts` e `src/data/repository.ts`.
- Estado do tablet: `src/stores/session/` (Zustand + IndexedDB), relógio injetável em `src/lib/clock.ts`.
- Login simulado protegido por `src/proxy.ts` (cookie `rotinas_sessao`).
- Telas do template originais continuam no código como referência, fora do menu.
