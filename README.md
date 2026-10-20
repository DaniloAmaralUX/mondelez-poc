# Rotinas Operacionais · Mondelēz International

Protótipo funcional de um app tablet-first para as rotinas operacionais do chão de fábrica da Mondelēz (VSA, linha Bis 2, posto de Embalagem), feito pela Pitang Labs como proposta para o edital do Porto Digital.

O operador recebe a rotina do turno na ordem certa, marca checklists de luva num toque, aponta produção e falhas, registra desvios com foto e passa o turno com os números já preenchidos. A liderança é avisada na hora, trata os alertas e acompanha as linhas. Tudo continua funcionando sem rede.

## Como rodar

Pré-requisito: Node.js 20.9 ou mais novo (o projeto foi feito no 24).

```bash
cd app
npm ci
npm run dev          # http://localhost:3000
```

Verificação completa (typecheck, testes, build de produção e suíte Playwright):

```bash
npm run verificar
npm run test:e2e:relatorio   # capturas de cada tela por perfil e tamanho
```

## Logins da demonstração

PIN de todos: `1234`. O login por SSO é simulado.

| Perfil | Pessoa | Matrícula |
| --- | --- | --- |
| Operador | Alberto | 104233 |
| Supervisão | Renata | 201145 |
| Gerência de Seção | Marcos | 300512 |
| Especialista | Juliana | 250078 |
| Assistência | Carlos | 220390 |

O menu do relógio, no cabeçalho, avança o horário simulado do turno, simula a queda de rede e restaura os dados. A troca de pessoa no tablet compartilhado fica no avatar.

## O que tem

| Turno | Telas |
| --- | --- |
| Assumir | Minha Rotina, troca de turno (leitura da passagem), recados, plano de produção, agenda e escala |
| Preparar | Checklists: pré-partida, PPLI & Centerlining, manutenção autônoma, limpeza, rastreabilidade com foto |
| Produzir e apontar | Hora x Hora, Sobrepeso e refugo, MTBF por toque |
| Desviar e tratar | NC com foto e justificativa, alertas com contexto e tratamento, pedido de ajuda, IT/LPP e book |
| Encerrar e analisar | Troca de turno com aceite, relatório do turno, painel das linhas, histórico com CSV, tendências, notificações |

Status completo dos Jobs to be Done e do MoSCoW: [`docs/15-status-jtbd-e-funcionalidades.html`](docs/15-status-jtbd-e-funcionalidades.html).

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 e shadcn/ui sobre o template Studio Admin; Zustand com persistência em IndexedDB; Serwist (PWA e offline); Vitest e Playwright com axe. Regras de domínio em TypeScript puro (`app/src/domain/`), com testes.

## Documentação

- [`docs/`](docs/README.md): brief, personas, jobs, requisitos, MoSCoW, decisões de cada versão (v0.2 a v0.7) e a marca Mondelēz. Também em PDF: [`docs/Documentacao-do-Projeto-Mondelez.pdf`](docs/Documentacao-do-Projeto-Mondelez.pdf).
- [`docs/21-handoff.md`](docs/21-handoff.md): arquitetura, o que é simulado, decisões em aberto, riscos e próximos passos para o piloto.
- [`app/CONVENCOES.md`](app/CONVENCOES.md): regras do código.

## Marca

O logo e as cores seguem o brand book da Mondelēz International. As fontes proprietárias (Bw Surco e MDLZ Bite Type) não fazem parte do repositório: o app usa as que estiverem instaladas e, fora delas, Calibri ou Carlito (doc 19).
