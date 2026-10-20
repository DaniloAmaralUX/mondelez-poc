# 17 · Frente D: consultas (Plano de produção, Documentos, Agenda e escala)

Parte do resultado da v0.5 (doc 16). Commits: `d684baa` (dependência), `b7646af` (Plano), `cdd7b8c` (Documentos), `9a8e004` (Agenda e escala), `ec78e20` (ajustes da verificação) e o deste relatório. Três telas que consomem o contrato do doc 16a (fundação `9c73a3b`), sem tocar em domínio, store, seed, hooks compartilhados, navegação ou `components/ui`. A única dependência nova é `read-excel-file` (commit próprio).

## 1. Telas e rotas

| Tela | Rota | Template de referência | Permissão |
| --- | --- | --- | --- |
| Plano de produção (RM-01, RN-05) | `/dashboard/plano` | Tabela do Ecommerce e do Tasks | `plano` (ler); importar com `plano` · administrar (Assistência) |
| Documentos: IT, LPP e book de defeitos (RM-04, RM-14) | `/dashboard/documentos` (`?doc=<id>&equipamento=<id>`) | File Manager | `documentos` (ler) |
| Agenda e escala (RM-06, RM-16) | `/dashboard/agenda` (`?aba=escala`) | Calendar (FullCalendar do template) | `agenda` (ler); publicar com `agenda` · administrar (Gerência e Assistência); ajustar escala com `escala` · administrar (Assistência) |

Arquivos (todos em `app/src/app/(main)/dashboard/`):

- `plano/page.tsx`, `plano/_components/`: `plano-de-producao.tsx` (tela), `tabela-da-semana.tsx` (tabela e lista), `importar-planilha.tsx` (Sheet de importação), `importacao.ts` (leitura e validação, pura), `importacao.test.ts` (6 testes), `semana.ts` (datas, agrupamento, origem do plano).
- `documentos/page.tsx`, `documentos/_components/`: `documentos.tsx` (tela, filtros e lista), `detalhe-do-documento.tsx`, `tipos.ts`.
- `agenda/page.tsx`, `agenda/_components/`: `agenda-e-escala.tsx` (tela e abas), `agenda.tsx`, `calendario-do-mes.tsx`, `item-de-recado.tsx`, `publicar-recado.tsx`, `escala.tsx`, `ajustar-escala.tsx`, `recados.ts`, `turnos.ts`.

## 2. Composição por largura

Todas com título grande (sobretítulo, `h1` de 32–34 px, subtítulo), cards brancos sobre o fundo cinza, um acento por tela (o roxo só na ação principal do perfil) e container queries na área útil (`@container/content`) ou no próprio card. Ordem do DOM igual à visual em todos os arranjos; quando o arranjo muda (tabela ou lista), as duas versões estão no HTML e o CSS escolhe.

| Tela | Notebook (1.440 × 900) | iPad paisagem (1.180 × 820) | iPad retrato (820 × 1.180) |
| --- | --- | --- | --- |
| Plano | Ações da Assistência ao lado do título; "Meta de hoje" da linha do tablet (5/12) e as outras linhas (7/12); tabela da semana com 9 colunas | Meta de hoje em cima, as outras linhas em fileira de três; tabela (o card tem 860 px, a tabela entra a partir de 50 rem de card) | Ações embaixo do título; a semana vira lista por linha, com os sete dias em grade de 7 |
| Documentos | Pastas (equipamentos) em 5 colunas; lista (5/12) e documento aberto (7/12) lado a lado | Pastas em 3 colunas; lista; o documento abre no lugar da lista, com "Voltar para a lista" | Igual à paisagem, na largura de 772 px |
| Agenda | Calendário do mês (8/12) e trilho (4/12) com o dia escolhido, os próximos e os recados | Calendário inteiro; dia escolhido e recados lado a lado embaixo | Igual à paisagem |
| Escala | "Minha escala": mês em grade (8/12) e resumo (hoje, próxima folga, ajustes, legenda); "Escala do posto" em tabela turnos × dias | Igual ao notebook (a tabela entra a partir de 50 rem de card) | Mês em grade e resumo embaixo; escala do posto com os sete dias como escolha e os turnos do dia em lista |

## 3. Decisões

| Antes | Depois | Por quê |
| --- | --- | --- |
| Rotas sem tela ("em breve") | Três telas completas sobre o contrato | Jobs do doc 16 |
| Tabela do template com uma linha por registro | Linhas de produção como grupos (`tbody` por linha, com o total dela), SKU por linha, total da semana por SKU e da fábrica no rodapé | O que a gerência valida é a linha no dia; o SKU detalha |
| Dia de hoje só pela cor | Coluna tingida e o rótulo "Hoje" no lugar do dia da semana | Cor não é a única pista |
| Meta por hora calculada só no Hora x Hora | Card "Meta de hoje" com a tonelagem do dia e a meta por hora (`metaHora`, 24 h programadas) da linha do tablet, em 36 px | É o número que o operador procura nesta tela |
| Plano só da semana atual (`usePlanoVigente`) | Escolha "Esta semana · Próxima" no card da semana, com `planoVigente` da semana seguinte | A planilha costuma chegar antes da semana; quem importa precisa ver o que publicou |
| Botão "Publicar" desabilitado quando há erro | "Publicar sem as N linhas com erro", com as linhas com erro listadas acima e a prévia de como o plano fica | app/CONVENCOES.md: nada desabilitado "porque o formulário é inválido"; o job pede importar e publicar em um passo |
| Confirmar antes de substituir o plano | Publica direto, com "Desfazer" por 10 s que publica de volta o plano anterior (com a origem dele) | Desfazer no lugar de confirmar |
| Planilha só no formato do SAP | Aceita os títulos usuais (Material, Código, Dia, Ton), separador `;` ou `,`, número com vírgula ou ponto, data DD/MM/AAAA, AAAA-MM-DD, data do Excel ou número de série; a semana é a da maioria das datas | O arquivo real ainda não foi visto; ser tolerante na leitura e rigoroso na validação |
| "Baixar modelo" vazio | CSV com o plano da semana mostrada (`paraCsv`), que volta igual na importação (testado) | Quem não tem o SAP edita o que já está lá |
| Leitor de Excel no pacote da tela | `import()` dinâmico de `read-excel-file/browser` só ao escolher um .xlsx | A tela abre leve no tablet; a leitura só baixa quando alguém importa |
| File Manager com pastas de arquivos | Pastas = equipamentos do posto do tablet, mais "Todo o posto" (padrão) e "Fábrica toda"; o equipamento do link entra como pasta própria | Filtro por equipamento como o operador pensa, com alvos de 64 px |
| Lista e prévia lado a lado em qualquer largura | Lado a lado só com 60 rem de área; abaixo, o documento toma o lugar da lista | Book com padrão e fora do padrão lado a lado precisa da largura do detalhe |
| Passos em texto corrido | Passos numerados em blocos; os de atenção em âmbar com ícone e a palavra "Atenção" | Leitura a um braço de distância, sem depender da cor |
| Book sem imagens | Duas molduras: verde com ✓ e "Padrão", vermelha com ✕ e "Fora do padrão", e um aviso "Foto entra no piloto"; LPP de certo e errado no mesmo formato | Pedido da frente; a forma do ícone e o rótulo carregam o sentido |
| Códigos de outros documentos citados como texto | "Siga a IT-EMB-021" vira atalho que abre o documento | O book manda para a IT; um toque leva lá |
| Calendário do template com eventos de 11–12 px e alvos de 20 px | Mesmo `EventCalendarViews`, com as opções sobrescritas no ponto de uso: o dia inteiro é o alvo (`dateClick`), eventos com ícone e tinta do tipo, texto de 14 px no toque, `now` no relógio da demo | Sem editar `components/calendar`; no tablet, tocar no dia é o gesto certo |
| Retirar com desfazer | Retirar com `AlertDialog` | O contrato não restaura um recado e publicar de novo mandaria outro e-mail para a fábrica: é irreversível |
| Escala como lista de dias | Mês em grade com o turno escrito ("1º", "06–14") e a tinta do turno; borda e ícone de lápis no dia ajustado | Cor com texto; a pessoa acha a semana dela de relance |
| Escala do posto só de hoje | Tabela turnos × dias da semana, com "Agora, no 1º turno: …" no topo | Quem trabalha hoje e na semana, o que a frente pediu |
| Ajuste por formulário genérico | O nome na escala é o botão: abre o ajuste com a pessoa e o dia, mostra o que a turma faria e oferece "Voltar à escala da turma"; salvar e voltar têm "Desfazer" | Editar uma vez, no lugar onde se vê o problema |

## 4. Jobs resolvidos

| Job | Persona | Como |
| --- | --- | --- |
| Quando chega a planilha do plano, quero importar e publicar em um passo, para o operador ver a meta do dia (P1) | Assistente | "Importar planilha" → escolher .xlsx ou .csv → prévia com validação → "Publicar"; a meta por hora das linhas passa a seguir o plano novo na hora (o Hora x Hora lê o mesmo `planos`) |
| Validar o plano do dia | Gerente | "Meta de hoje", tabela da semana com hoje destacado, origem do plano (exemplo ou importado, por quem e quando) |
| Quando tenho dúvida de como ajustar ou o que é defeito, quero a instrução e o book do meu equipamento ali no tablet (P1) | Operador | Documentos abre filtrado pelo posto do tablet; equipamento em um toque; passos e book legíveis; link `?doc=` para outras telas |
| Padrão vigente no ponto de uso | Especialista | Código EQCMS, versão vigente e data em cada linha e no documento |
| Consultar escala e avisos da fábrica no tablet (P2) | Operador | Aba Agenda (mês, dia, recados) e aba Escala ("Minha escala" e "Escala do posto") |
| Publicar parada, visita ou evento na agenda (P1) | Gerente, Assistente | "Publicar na agenda" (ou "Publicar neste dia") → tipo, título, para quem, dia e horário → aparece na Agenda e nos Recados da Minha Rotina, com aviso na caixa de saída |
| Editar a escala uma vez e todos verem (P1) | Assistente | Toque no nome na escala do posto → turno ou folga → "Salvar ajuste"; todos os tablets leem o mesmo `ajustesEscala` |

## 5. Verificação

- **Estático.** `npx tsc --noEmit`: nenhum erro nos meus arquivos. Biome nos meus arquivos: sem erros nem avisos (ficam 16 `useSortedClasses` informativos, do mesmo tipo que as telas existentes já têm). Vitest: `plano/_components/importacao.test.ts`, 6 testes (CSV do Excel pt-BR, data do Excel, cada erro de validação, arquivo sem as colunas, modelo baixado que volta igual).
- **Capturas** (Chrome headless do Puppeteer, `%TEMP%/frente-d/cap.mjs`): notebook 1.440 × 900 sem toque, iPad paisagem 1.180 × 820 e retrato 820 × 1.180 com `hasTouch` e `isMobile`, como operador (104233), gerente (300512) e assistente (220390), em Plano, Documentos (lista, IT, LPP e book) e Agenda (agenda e escala). Em todas: rolagem horizontal 0 e nenhum erro de console. No toque: nenhum alvo abaixo de 44 px e nenhum texto abaixo de 13 px. No notebook ficam a densidade e os textos de 12 px do template (header, selos), como nas outras telas.
- **Fluxos** (`%TEMP%/frente-d/fluxos.mjs`, Assistência, nos três tamanhos): importar `Plano_semana_44.xlsx` (próxima semana, 41 linhas, 6 erros de propósito) mostrou 35 prontas e os 6 erros esperados (linha inexistente, SKU de outra linha, toneladas negativas, data fora da semana, data e número inválidos, linhas repetidas) e publicou na próxima semana; importar `plano-semana-43.csv` (esta semana, separador `;`, vírgula decimal, 1 erro) publicou e a meta de hoje da Bis 2 passou de 68,7 t para 70,2 t. Publicar na agenda sem preencher mostrou os erros junto dos campos; uma visita para a Bis 2 apareceu no calendário e nos próximos na hora. Ajustar a escala da Patrícia para folga com motivo marcou o dia com o lápis. As planilhas foram geradas com `write-excel-file` numa pasta própria em `%TEMP%/frente-d`, fora do app.
- **Correções feitas depois de olhar as imagens** (commit `ec78e20`): ações do Plano empilhadas no iPad; recado recém-publicado só aparecia no minuto seguinte (ver §6); semana do calendário começando no domingo (agora segunda, como plano e escala); chave repetida entre os dois Sheets da Agenda (erro de console); "Publicar sem as 1 linha com erro"; aviso do ajuste com "Folga em hoje"; pasta "Todo o posto Embalagem" cortada; chip "Renata sup." cortado na tabela da escala no iPad.
- **Servidor de desenvolvimento.** Durante a frente, o `next dev` da porta 3100 parou de responder (login em 3–4 min, telas com 500): o `node_modules` foi reorganizado durante uma instalação ("Could not find the Next.js package"), o processo entrou em laço de `uncaughtException: write EPIPE` e, depois, o cache persistente do Turbopack ficou corrompido ("task is missing in memory or persistent storage"). Para destravar a verificação de todas as frentes, atualizei só a data do `next.config.mjs` (conteúdo intacto), o que reinicia o servidor; como ele não voltou, movi `app/.next/dev/cache` para `%TEMP%/frente-d/cache-dev-corrompido` (nada apagado) e subi de novo o mesmo `next dev -p 3100`, desacoplado do shell, com a saída em `%TEMP%/v03/dev.log` (o log anterior ficou em `dev-ate-1325.log`). Ele voltou a responder em ~150 ms.

## 6. O que faltou no contrato

- **Escala da demo.** Pelo ciclo de `domain/escala.ts`, a turma A (Alberto e Renata) está de folga em 19/10, mas a demonstração os põe no 1º turno nesse dia; a Escala mostra "Hoje: Folga" para o operador logado e "Agora, no 1º turno: Graziela Felix". A defasagem das turmas (ou a origem do ciclo) precisa ser alinhada ao dia da demonstração na fundação.
- **Recado recém-publicado.** `useRecados()` só mostra recados com `em <= agora`; o `agora` do hook vira no minuto e `publicarRecado` grava o instante com segundos, então o recado aparecia só no minuto seguinte (também nos Recados da Minha Rotina). Na Agenda uso um helper local com 1 min de folga (`useRecadosPublicados`); o certo é corrigir no hook.

- **Restaurar plano.** Não há ação para voltar ao plano de exemplo nem para desfazer uma publicação: o "Desfazer" publica de novo o plano anterior com `publicarPlano` (passando a origem), e por isso o autor e a hora da publicação passam a ser de quem desfez.
- **Restaurar recado.** `removerRecado` não tem volta; por isso "Retirar" usa confirmação. Um `restaurarRecado(recado)` permitiria o desfazer padrão.
- **Hook de documentos.** `localRepository.documentos()` é estático; quando a Especialista publicar versões (como os formulários), a tela vai precisar de um hook que junte as versões do tablet.
- **Plano de outra semana.** `usePlanoVigente()` só dá a semana atual; a próxima vem de `planoVigente` de `lib/sessao/indicadores` com a data + 7 dias.
- **Pessoas do posto.** Não há `usuariosDoPosto(postoId)` no repositório; a escala filtra `localRepository.usuarios()` por `postoId` e inclui a supervisão com turma (helper local `pessoasDoPosto`).

## 7. Em aberto

- **Imagens.** As capturas ficaram em `%TEMP%/frente-d/shots` (r2, r4 e fluxos-*), fora do repositório: a lista de arquivos da frente não inclui `docs/assets/`.
- **Leitura do arquivo real do SAP.** A importação aceita os títulos usuais e o formato do modelo; o layout exato da planilha do SAP ainda precisa ser visto com a Mondelez.
- **Fotos do book e da LPP.** As molduras dizem "Foto entra no piloto"; no piloto, as imagens vêm do EQCMS.
- **Links para Documentos.** `?doc=<id>&equipamento=<id>` está pronto; Checklist, MTBF e Alertas (outras frentes) ainda não apontam para ele.
