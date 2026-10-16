# 06 · Priorização MoSCoW

Duas lentes: **Protótipo** (app web na Vercel, esta fase) e **Piloto** (proposta Pitang). Prioridade do protótipo decide o que construímos agora.

## Must · sem isso a demo não prova a tese

| Item | Por quê é must | Piloto |
|---|---|---|
| Login por matrícula + PIN e seleção de contexto (Chocolate → Bis 2 → Embalagem) | Tablet compartilhado por posto é a realidade; define o que aparece | Must (com SSO) |
| **Minha Rotina do turno** com tarefas, prazos, estados e ordem por criticidade | É o "direcionamento claro por perfil", requisito obrigatório do briefing | Must |
| Motor de formulários com C/NC/NA, numérico, texto, **NC exige justificativa**, autosave | Base de 9 dos 15 módulos | Must |
| **PPLI & Centerlining** completo (plano por equipamento, parâmetros, NC → alerta) | Módulo mais citado nos mockups e exemplo canônico de alerta | Must |
| **Hora x Hora** com toneladas, ton/h, GE, meta, farol e gráfico | KPI central da operação; alimenta troca de turno e relatório | Must |
| **MTBF** por toque com timeline e Pareto | Mostra registro em 1 toque e dado que hoje não existe | Must |
| **Alertas** (painel do supervisor): criticidade, responsável, idade, origem, tratar/resolver, log "enviado via Teams" | É o "alertar"; fecha o ciclo registrar → agir | Must (Teams/e-mail reais) |
| **Troca de turno** guiada e pré-preenchida com aceite | Mostra consolidação automática no nível do operador | Must |
| **Relatório do turno** por linha (BIS 1–4) para o gerente | Mostra consolidação no nível da liderança | Must |
| Três personas demonstráveis (Operador, Supervisor, Gerente) com permissões | Prova "por nível hierárquico" | Must (5 perfis) |
| Rastreabilidade: carimbo completo em cada registro, visível no detalhe | Requisito de auditoria; barato de mostrar | Must |
| Indicador de sincronização + simulação de queda de rede | Offline é a maior ansiedade do chão de fábrica | Must (offline real) |
| Painel de demonstração (persona, relógio, rede, reset) | Sem ele a demo não dispara alertas de atraso nem fecha turno | Só protótipo |
| Design para luva: alvos ≥ 56 px, tipografia grande, contraste alto, landscape e portrait | Requisito do dispositivo; precisa ser sentido na mão | Must |
| Deploy na Vercel com preview por PR e seed de dados da Bis 2 | Link para o cliente a cada iteração | — |

## Should · entra assim que o núcleo estiver sólido

| Item | Observação | Piloto |
|---|---|---|
| Plano de produção: tabela do dia/semana + importação de Excel com pré-visualização | Dá origem à meta hora; import é diferencial visível | Must |
| Book de defeitos e Instrução de trabalho/LPP (consulta por equipamento, versão vigente) | Conteúdo estático de exemplo; mostra "padrão no ponto de uso" | Must (EQCMS) |
| Escala (calendário) e Agenda da fábrica/recados (leitura na home) | Baixo custo, alto reconhecimento pelos usuários | Must |
| Rastreabilidade de PA com câmera do navegador e lotes | Foto obrigatória é requisito forte do V2 | Must (retenção 10 anos) |
| Ferramentas de segurança: pré-partida por máquina/turno + nível de risco da linha | HSE é obrigatório; os demais checklists viram genéricos | Must (PowerApps) |
| Sobrepeso/refugo/reprocesso, Limpeza semanal, Manutenção autônoma via motor genérico | Prova que o motor cobre o catálogo | Must |
| Pedido de ajuda contextual de qualquer tela | Aparece nos mockups de troca de turno e relatório | Should |
| Dashboard gerencial por linha/turno com tendência da semana | Desejável no briefing | Should |
| Histórico com filtros e export CSV | Auditoria | Must |
| Status por posto para o supervisor (feito/pendente/atrasado) | Complementa alertas | Should |
| Estado compartilhado (Postgres gerenciado) para demo em dois dispositivos ao mesmo tempo | Quando a demo for presencial com tablet + notebook | — |

## Could · se sobrar tempo ou se a demo pedir

| Item | Observação |
|---|---|
| Tendências e recorrência (NC por item, falhas por equipamento × turno) | Opcional no briefing; impressiona gerência |
| Troubleshooting ligado a tipos de falha | Só na proposta Pitang |
| Gamificação (metas por equipe, selo de rotina completa) | Na proposta Pitang entra no piloto; no protótipo, no máximo um indicador de "turno 100 %" |
| PWA instalável com service worker real | Offline já é demonstrado via fila local |
| Exportar relatório do turno em PDF | Teams/e-mail simulados bastam |
| Modo escuro / alto contraste alternativo | Chão de fábrica é claro; avaliar com usuários |
| Admin completo de rotinas e limiares pela UI | Seed em código resolve o protótipo |

## Won't · fora do protótipo, explicitamente

| Item | Motivo |
|---|---|
| SSO real, integração Teams/e-mail real, EQCMS, PowerApps, SAP | PoC sem integrações (V2); simulados |
| APK Android, MDM, Ionic/Capacitor | Objeto do piloto |
| Backend NestJS on-premise | Objeto do piloto; protótipo usa estado local |
| Retenção de 10 anos, backups, certificações de segurança | Infra do piloto |
| WhatsApp | Vetado pelo cybersecurity |
| Multi-idioma | Piloto é PT-BR |
| Redesenho de processo, módulos fora de rotina/ocorrência/controle | Fora do escopo do desafio |

## Definição de pronto do protótipo

1. Fluxo demo completo roda sem intervenção técnica: login → contexto → Minha Rotina → PPLI com NC → alerta no supervisor → tratamento → Hora x Hora → MTBF → troca de turno → relatório do turno do gerente.
2. Funciona em tablet 10.9" (landscape e portrait) com luva, e em desktop.
3. Todos os registros exibem carimbo de rastreabilidade e estado de sync.
4. Painel de demo permite avançar o relógio e simular rede.
5. Publicado na Vercel com URL estável e seed resetável.
6. Testes do domínio (alertas, GE, MTBF) passando.

## Ordem de construção sugerida

| Incremento | Conteúdo | Resultado visível |
|---|---|---|
| I1 | Scaffold Next.js + tokens + shell tablet + seed + login + contexto + Minha Rotina (estática) | Link na Vercel com a home viva |
| I2 | Motor de formulários + PPLI + motor de alertas + painel de alertas + painel de demo (relógio) | NC vira alerta; atraso vira alerta ao avançar relógio |
| I3 | Hora x Hora + MTBF + KPIs do turno | Gráficos e farol funcionando |
| I4 | Troca de turno + Relatório do turno + persona Gerente | Ciclo completo fechado |
| I5 | Should: plano de produção com import, book, IT, escala, agenda, rastreabilidade com foto, pré-partida, genéricos | Catálogo completo navegável |
| I6 | Polimento: luva, contraste, estados vazios, offline simulado, testes, Playwright do fluxo | Pronto para teste com usuários |
