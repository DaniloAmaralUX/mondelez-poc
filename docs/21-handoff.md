# 21 · Handoff do protótipo (v0.7)

O que alguém precisa saber para continuar o projeto: como o código está organizado, o que é de verdade e o que é simulado, o que ficou em aberto e o caminho até o piloto. Como rodar e os logins da demonstração estão no `README.md` da raiz; as regras do código, em `app/CONVENCOES.md`.

## 1. Arquitetura

| Camada | Onde | O que faz |
| --- | --- | --- |
| Domínio | `app/src/domain/` | Regras em TypeScript puro, sem React nem Next: rotina do turno (`routine-engine`), formulários (`formulario-engine`), alertas (`alert-engine`, `alertas-indicadores`), produção, GE e toneladas (`producao`, `kpis`), falhas e MTBF (`falhas`), escala, turno, permissões, limites de texto, CSV. Testes em `__tests__/` |
| Sessão | `app/src/stores/session/`, `app/src/lib/sessao/` | Store Zustand v5, persistido num IndexedDB próprio com merge entre abas, fila de envio, rascunhos (checklist e troca de turno), bloqueio do tablet, PIN, relógio simulado e migrações versionadas |
| Permissões | `app/src/domain/permissoes.ts` | Matriz perfil × recurso × ação (`pode`). O menu (`app/src/navigation/sidebar/`) e as ações do store consultam a mesma matriz |
| Telas | `app/src/app/(main)/dashboard/<tela>/` | Uma pasta por tela, com `_components/` ao lado. O shell (sidebar, cabeçalho, busca, ajuda) fica em `dashboard/_components/` |
| Plataforma | `dashboard/_components/plataforma.tsx` | Rede, envio da fila, prefetch das telas do tablet, Wake Lock e escuta das outras abas |
| Offline | `app/src/app/sw.ts`, `app/src/lib/pwa/` | Service worker (Serwist) com regras de cache testadas; página offline; manifest e ícones |
| Tema | `app/src/styles/` | Preset `mondelez` (tokens), acabamento por `data-slot`, marca, densidade para toque e movimento (docs 14, 19 e 20b) |
| Dados | `app/src/data/seed.ts` | Pessoas, perfis, postos, equipamentos, formulários e o turno da demonstração |

## 2. O que é simulado

| Item | No protótipo | No piloto |
| --- | --- | --- |
| Login | Matrícula + PIN conferido no cliente; SSO é um botão | SSO corporativo; PIN conferido no servidor, cookie httpOnly assinado |
| Servidor e banco | Não há: o estado vive no IndexedDB do aparelho e sincroniza só entre abas | API e banco; estado compartilhado entre aparelhos |
| Envio dos registros | A fila marca "enviado" sem destino | Envio real com idempotência e reenvio |
| Outras linhas (Bis 1, 3 e 4) | Geradas a partir do seed | Integração com o MES |
| Plano de produção | Importação de .xlsx/.csv no aparelho | Layout real da planilha do SAP (ainda não visto) |
| Teams e e-mail | Caixa de saída simulada em Notificações | Webhook do Teams e e-mail corporativo |
| Documentos (IT, LPP, book) | Estáticos, sem fotos | EQCMS |
| Relógio | Simulado, avançado pelo menu da demonstração | Relógio real |

## 3. Decisões em aberto

- **Produto** (doc 13 §6): foto no "Registrar desvio", itens críticos em "Restantes conformes", aviso de valor absurdo no centerline, reabrir alerta pelo histórico, limites de texto conferidos com o SAP, modelo do tablet.
- **Marca** (docs 19 §9 e 20b §9): aprovação do time de marca para a assinatura, o ícone da iniciativa, o painel do login com luz em movimento e a sidebar preta; licença web das fontes Bw Surco e MDLZ Bite Type.
- **Backlog das frentes** (doc 17 §4): ações do store que dizem por que recusaram; desfazer falha, entrega de turno, plano e recado; permissão e estado offline no pedido de ajuda; catálogo de falhas por equipamento; atalho "IT do equipamento" no checklist, no MTBF e nos alertas.

## 4. Riscos

| Risco | Efeito | Mitigação |
| --- | --- | --- |
| Uso real com luva e sob luz forte nunca testado | Alvos e contraste podem não bastar | Teste num Galaxy Tab e num iPad no chão de fábrica antes do piloto (doc 13 §7) |
| Estado só no aparelho | Troca de tablet ou limpeza do navegador perde o turno | Backend antes de qualquer uso real |
| Desempenho em tablet de entrada | Avançar o relógio passou de 200 ms em 4 de 18 rodadas com a CPU 4× | Medir no aparelho; reduzir animações de número se preciso |
| PIN conferido no cliente | Sem segurança real | Só para demonstração; ver §2 |
| Fontes da marca | Fora das máquinas da Mondelēz aparece a Calibri ou a Carlito | Licença web e `next/font/local` |

## 5. Próximos passos para o piloto

1. Publicar a demonstração (Vercel ou equivalente) com URL estável e "Resetar dados".
2. Teste com operadores e liderança num tablet de verdade, com luva, e ajuste do que aparecer.
3. Backend: autenticação, API dos registros, banco e estado compartilhado entre aparelhos.
4. Integrações: MES (produção e falhas), SAP (plano), Teams e e-mail, EQCMS (documentos).
5. Decisões de produto e de marca do §3.
6. Mesma disciplina de verificação: `npm run verificar` a cada mudança (typecheck, testes, build e a suíte com axe e toque por perfil).
