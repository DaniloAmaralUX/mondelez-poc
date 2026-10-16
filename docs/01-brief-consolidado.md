# Mondelez — Gestão de Rotinas Operacionais · Brief consolidado para o protótipo funcional

Consolidação de toda a documentação da pasta `Documentos/` (lida em 16/10/2026) para servir de base ao design engineering do protótipo.

## 1. Fontes

| Doc | Autor | O que é |
|---|---|---|
| `V1 - [DOCA HUB] ... Briefing Desafio 3 - Ciclo 2.pdf` (7 pág.) | Porto Digital / Mondelez | Briefing oficial do desafio "Digitalização da rotina de manufatura" |
| `V2 - DOC-20261015-WA0041.pdf` (31 pág.) | Mondelez (interno, "One Digital") | Detalhamento das rotinas obrigatórias + **protótipo de referência** (pág. 15–31) |
| `V1 - Proposta - Mondelez.pptx` (21 slides) | Pitang | Proposta comercial/técnica: escopo, stack, cronograma, equipe, investimento |
| `README.md` | GitLab | Boilerplate, sem conteúdo |

Foto real do estado atual (pastas de papel sobre a máquina): `docs/assets/foto-papel-chao-fabrica.png`.

## 2. Problema (briefing V1)

- Rotina de Manufatura (Operadores, Supervisão, Gerentes de Seção) gerida de forma **assíncrona, manual e em papel** (cadernos, formulários, planilhas e links dispersos).
- Sem sistema único para rotinas diárias/semanais/mensais; sem registro estruturado de ocorrências, controles e pendências.
- Liderança sem visibilidade em tempo real; operação sem direcionamento claro do que priorizar.
- Consequências: perda de tempo, atraso na identificação de desvios, decisão lenta, falta de padronização entre seções/turnos, auditorias difíceis.

**Fora de escopo:** substituir sistemas corporativos (produção/qualidade/manutenção), redesenhar processo produtivo, funcionalidades fora de rotina/ocorrências/controles.

## 3. O que o cliente pede (V1 + V2)

Quatro verbos do V2: **centralizar · registrar · direcionar · alertar**.

Obrigatórios: app de gestão de rotina por nível hierárquico; interface user friendly com direcionamento claro por perfil; gestão visual de pendências com alertas condicionados; tablets inclusos; controle de usuários/perfis.
Desejáveis: dashboard gerencial por seção/turno; histórico e tendências; notificações automáticas; fluxos de aprovação padronizados.
Opcionais: analytics de padrões recorrentes; integração com sistemas corporativos; gamificação.

### Acesso e contexto de trabalho
- Login por **SSO ligado à matrícula** do operador (V2). Proposta Pitang: liderança via diretório corporativo (SSO); operador por **matrícula em tablet compartilhado** por posto.
- Perfis citados no V2: operador, supervisor, especialista, gerente, técnico de segurança, técnico de qualidade. Proposta Pitang fixa **5 perfis**: Operação, Supervisão, Gerência, Assistência, Especialista de Seção.
- Rotinas pré-definidas **pela função e pelo posto de trabalho**.
- Árvore de contexto: **Fábrica → Linha → Equipamento** (ex.: Chocolate → Bis 2 → Loeschpack 4). Mockup usa breadcrumb `chocolate ▸ bis 2 ▸ embalagem`.

### Tablets
- V2: 20 tablets, tela ≥ 10.9", 128 GB SSD, 6 GB RAM, **toque com luvas**, capa anti-queda, totem.
- Pitang: 15 tablets Samsung Galaxy Tab Active5 5G (R$ 36.600,00, faturado à parte).

### PoC / restrições técnicas (V2)
- **Integralmente on-premise**, dados offline, **sem integrações** às plataformas existentes na PoC. Piloto em grupo reduzido (uma linha/área).
- Certificações de segurança exigidas (SOC2, ISO 27001 ou equivalentes).
- Solução final em 2 modalidades: SaaS ou cloud Mondelez (+ contrato de suporte mensal).
- Integrações futuras: SSO; Teams/e-mail; Excel (plano de produção); EQCMS (instruções de trabalho, book de defeitos); PowerApps (dashboards/apps Mdlz).

## 4. Catálogo das rotinas (15 módulos do protótipo de referência, pág. 16 do V2)

Grade 5×3 da tela principal, na ordem do mockup:

| # | Módulo | Tipo (V2) | Área focal | Integração | Comportamento-chave |
|---|---|---|---|---|---|
| 1 | Plano de produção | Consulta | Manufatura + Planning | Excel (export SAP) | Plano do dia/semana por linha/SKU, toneladas por dia, total semana |
| 2 | Manutenção autônoma | Checklist | Manufatura | — | Roteiro de limpeza/inspeção/lubrificação básica |
| 3 | Sobrepeso, refugo e reprocesso | Escrita | Manufatura + Qualidade | — | Registro **hora a hora** de sobrepeso, refugo, reprocesso |
| 4 | Book de defeitos | Consulta | Qualidade | EQCMS | Catálogo visual (padrão/produto perfeito × fora de padrão) |
| 5 | MTBF | Escrita | Manufatura | — | Operador toca no ícone do tipo de falha (Enrosco, Troca de bobina, Ajuste mordente, Ajuste temperatura, Selagem enrugada, Perda sincronismo); sistema carimba hora; relatório de confiabilidade no fim do turno |
| 6 | Escala | Consulta (calendário) | Manufatura | — | Escala do colaborador em calendário anual colorido por turno |
| 7 | Limpeza semanal | Checklist | Manufatura + Qualidade | — | Checklist semanal com itens obrigatórios |
| 8 | Rastreabilidade de PA | Consulta + Checklist + Foto | Manufatura + Qualidade | — | Inspeção de PA, lote de envoltórios/caixas, foto obrigatória, **retenção 10 anos**; postos embalagem primária/secundária/terciária/caixas |
| 9 | Alertas | Gestão / Notificação | Manufatura | Teams/e-mail | Painel automático por atraso de preenchimento ou NC. **Restrito a Especialista, Supervisor e Gerente** |
| 10 | Hora x Hora | Apontamento + Dashboard | Manufatura | — | Operador aponta caixas; app calcula **ton/h e GE** (hora e acumulado), gráficos, farol de meta |
| 11 | Ferramentas de segurança (HSE) | Checklist + Consulta | HSE | PowerApps | Pré-partida (máquina/turno), fornos PSM3, integridade de ferramentas, talhas, caderno de DDS, nível de risco da linha |
| 12 | Relatório do turno | Consolidação automática | Manufatura | Teams/e-mail | Consolida Hora x Hora, Troca de turno, Alertas, MTBF por linha e turno; envio à liderança |
| 13 | Troca de turno | Escrita (formulário guiado) | Manufatura | — | Perguntas pré-definidas (etiquetas abertas, paradas, pendências, pedidos de ajuda), consulta automática a GE/MTBF/OEE, campo livre |
| 14 | Instrução de trabalho e LPP | Consulta | Qualidade / Segurança / E&T | EQCMS | Biblioteca digital por equipamento no ponto de uso |
| 15 | PPLI e Centerlining | Consulta + Checklist + Escrita | Manufatura | — | Planos de limpeza/lubrificação/centerlining por equipamento; checklist item a item; **NC dispara alerta e exige justificativa** |

Também citado no V2 (rotinas obrigatórias) mas **ausente da grade do mockup**: **Agenda da fábrica e recados** (quadro de avisos digital, alimentado por Gerente/Assistente, lido por todos). A proposta Pitang inclui "Agenda da Fábrica" e acrescenta **Troubleshooting** (manuais e dicas para os principais alertas).

## 5. Dados de exemplo nos mockups (reutilizar no protótipo)

- Linha piloto: **Bis 2**, fábrica de Chocolate, posto **Embalagem**. Equipamentos: Loeschpack 2, 4, 5.
- Pessoas: Alberto Forte (operador, 1º turno), Graziela Felix (operadora).
- Troca de turno 29/07/2026, 1º turno: GE 91,1% · 17,89 t · MTBF 95 min · maior parada "Enrosco de embalagem" · etiqueta aberta "Desalinhamento da correia transportadora" · sugestão "Pedir movimentação da nova embalagem".
- Relatório do turno: BIS 1 (GE 91,1%, 17,89 t, MTBF 95 min), BIS 2 (94,3%, 19,93 t, 110 min), BIS 3 (87,1%, 16,89 t, 87 min), BIS 4 (89,2%, 18,0 t, 89 min), cada um com "pedido de ajuda".
- Alertas: "PPLI da Máquina Loeschpack 5 ainda não preenchido — Alberto Forte"; "PPLI da Loeschpack 2 ainda não preenchido — Graziela Felix"; "OEE da Linha Bis 2 abaixo de 70%"; "Produção da Linha Bis 2 1,3 t abaixo da meta".
- Plano de produção (exemplo é de Crackers 1 / Club Social, semana 27/jul–2/ago): SKU, descrição, UOM Tons, Seg–Dom, total semana.

## 6. Linguagem visual do protótipo de referência (V2)

- Roxo Mondelez (tiles e CTA), fundo branco, logo "Mondelēz International · Snacking Made Right" no canto superior direito, rodapé "Mondelez International".
- Login: card central "Gestão de Rotinas Operacionais / Bem-vindo / Usuário / Senha / ENTRAR".
- Home: breadcrumb de contexto + grade 5×3 de tiles roxos com nome do módulo.
- Telas de módulo: título, "Tipo / Descrição / Área focal / Integração necessária", botão "← Menu Principal", imagem do formulário em papel atual à direita. É um **mapa de conteúdo**, não um design final: há bastante espaço para o design engineering.

## 7. Proposta Pitang (compromissos que o protótipo deve honrar)

- Piloto na **linha-modelo Bis 2**, posto Embalagem, 5 perfis, 15 módulos; base para escalar às demais **12 linhas** (Chocolate e Biscoito).
- **Uma única aplicação React + Ionic**: APK Android nos tablets (via MDM, câmera nativa, sync em segundo plano) e navegador para liderança/PCs de posto. Interface otimizada para **luvas**.
- **Offline-first**: grava no dispositivo (IndexedDB) enquanto preenche; fila de envio com reenvio automático sem duplicar; **estado de sincronização visível em cada registro**.
- Backend Node.js (NestJS) com motor de alertas condicionados e agendamento; PostgreSQL; Docker on-premise; ambientes dev/homol/prod.
- Alertas com **níveis de criticidade** e responsável identificado; envio Teams/e-mail; WhatsApp condicionado ao cybersecurity.
- Rastreabilidade: todo registro carimbado com data, turno e responsável. Histórico e tendências.
- Gamificação (metas, pontuação, reconhecimento de equipes) está **dentro do escopo do piloto** na proposta.
- Cronograma: 13 semanas (2 diagnóstico · 8 dev · 2 piloto · 1 consolidação). Investimento R$ 257.069,13 + tablets R$ 36.600,00 + operação assistida R$ 5.645,79/mês (40 h).
- Equipe: analista de requisitos, líder técnico, UX/UI, 2 fullstack full-time, testador, GP.

## 8. Divergências entre documentos (resolver com o cliente / decidir no protótipo)

| Tema | V2 Mondelez | Proposta Pitang | Sugestão p/ protótipo |
|---|---|---|---|
| Tablets | 20 | 15 | irrelevante p/ protótipo |
| Perfis | 6+ (inclui técnicos de segurança e qualidade) | 5 | usar os 5 da proposta, com Operador / Supervisor / Gerente como personas demo |
| Módulo 8 | "Rastreabilidade de PA" (produto acabado + lotes de envoltório/caixa) | "Inspeção de Matéria-Prima" | manter nome do cliente: Rastreabilidade de PA |
| Agenda da fábrica | rotina obrigatória, fora da grade | incluída | incluir (16º tile ou widget na home) |
| Troubleshooting | não existe | incluído | opcional, pode viver dentro de Alertas |
| Integrações na PoC | nenhuma, offline | Excel + SSO + Teams/e-mail | mock: importar Excel simulado; alerta "enviado por Teams" simulado |
| Gamificação | opcional | no piloto | deixar para depois do núcleo |

## 9. KPIs que o protótipo deve tornar visíveis

Redução de papel; tempo médio de registro; tempo entre ocorrência e ação corretiva; % de usuários recorrentes; % de alertas que viraram ação; pendências fora do prazo; estabilidade em tablet. No protótipo: cada registro mostra **tempo de preenchimento**, cada alerta mostra **idade e status (aberto → em tratamento → resolvido)**.

## 10. Recomendação para o protótipo funcional (design engineering)

**Objetivo:** demonstrar, clicável e com dados vivos, o ciclo completo *registrar → detectar desvio → alertar → tratar → consolidar no turno*, nas três personas, em tablet landscape.

**Stack (decisão em 16/10/2026, detalhada no doc 02):** aplicação **web** publicada na **Vercel**: Next.js 16 (App Router) + React 19 + TypeScript, Tailwind CSS v4 com tokens em `@theme`, shadcn/ui, estado local offline-first (Zustand + IndexedDB) atrás de uma interface de repositório. Sem Ionic e sem backend nesta fase; motor de alertas roda no cliente sobre dados simulados. Ver `02-solucao-e-stack.md`.

**Fluxos demo prioritários (em ordem):**
1. Login por matrícula + seleção de contexto Chocolate → Bis 2 → Embalagem.
2. Home com "Minha rotina do turno" (tarefas por perfil e posto, com prazo e status) + grade dos módulos.
3. PPLI & Centerlining: checklist item a item, NC exige justificativa, gera alerta.
4. Hora x Hora: apontar caixas → ton/h, GE, farol de meta, gráfico.
5. MTBF: ícones de falha com toque, timeline do turno.
6. Alertas (visão Supervisor): criticidade, responsável, idade, tratar/resolver, "enviado via Teams".
7. Troca de turno: formulário guiado pré-preenchido com GE/MTBF/alertas do turno.
8. Relatório do turno (visão Gerente): cards por linha BIS 1–4.
9. Consultas estáticas: Plano de produção (tabela), Book de defeitos, Instrução de trabalho, Escala, Agenda.
10. Restante (Limpeza semanal, Manutenção autônoma, Rastreabilidade de PA com foto, Ferramentas de segurança, Sobrepeso/refugo) como checklists genéricos reutilizando o mesmo motor de formulário.

**Viewport alvo:** tablet 10.9" landscape (≈1180×820 CSS px), com fallback para desktop da liderança.
