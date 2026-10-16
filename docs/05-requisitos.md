# 05 · Requisitos

Identificadores: **RF** funcional transversal · **RM** funcional por módulo · **RN** regra de negócio · **RNF** não funcional · **RS** restrição. Coluna "Prot." indica se entra no protótipo (ver MoSCoW no doc 06).

## 1. Requisitos funcionais transversais

| ID | Requisito | Prot. |
|---|---|---|
| RF-01 | Login no tablet compartilhado por **matrícula + PIN**; liderança por SSO (simulado no protótipo). Troca rápida de usuário sem sair do contexto do posto. | Sim |
| RF-02 | **Contexto de trabalho** Fábrica → Linha → Posto (→ Equipamento quando aplicável), lembrado por dispositivo e exibido permanentemente no header. | Sim |
| RF-03 | **Minha Rotina do turno**: lista de tarefas gerada a partir de templates (módulo, frequência, janela de prazo, posto, perfil), com estados *a fazer · em andamento · feita · atrasada · com NC*, ordenada por prazo e criticidade. | Sim |
| RF-04 | **Motor de formulários**: tipos de item *conforme/NC/N.A.*, numérico com unidade e faixa, seleção, texto, foto, data/hora; obrigatoriedade; **justificativa obrigatória em NC**; autosave por item; resumo de conformes/NC ao concluir. | Sim |
| RF-05 | **Motor de alertas**: regras configuráveis (atraso, NC, KPI abaixo de limiar, produção abaixo da meta, recorrência), criticidade *info · atenção · crítico*, responsável, destinatários por perfil, ciclo de vida *aberto → em tratamento → resolvido* com ação e autor, canais in-app e Teams/e-mail (simulados). | Sim |
| RF-06 | **Rastreabilidade**: todo registro carimba data/hora, turno, posto, equipamento, usuário, dispositivo, versão do formulário; registros imutáveis, correção gera nova versão com motivo. | Sim |
| RF-07 | **Offline-first**: registro gravado localmente a cada item; fila de envio com reenvio idempotente; indicador de sync por registro e global; nenhum bloqueio de UI por falta de rede. | Sim (simulado no navegador) |
| RF-08 | **Perfis e permissões** conforme matriz da seção 4. | Sim |
| RF-09 | **Histórico**: consulta de registros e alertas por linha, posto, equipamento, turno, período, módulo, autor; exportação CSV. | Parcial |
| RF-10 | **Relatório do turno** gerado automaticamente por linha × turno, com envio à liderança (simulado). | Sim |
| RF-11 | **Agenda da fábrica e recados**: avisos com período de exibição, autor e público-alvo; visíveis na home. | Sim (leitura) |
| RF-12 | **Administração de conteúdo**: planos PPLI/centerlining, checklists, documentos (IT, LPP, book), escala, plano de produção (importação de Excel), usuários, postos, equipamentos, limiares de alerta. | Parcial (seed + import de plano) |
| RF-13 | **Painel de demonstração**: trocar persona, avançar relógio, simular queda de rede, resetar dados. | Sim (só protótipo) |
| RF-14 | Pedido de ajuda a partir de qualquer tela, com contexto automático (posto, equipamento, tarefa). | Should |
| RF-15 | Dashboard gerencial por seção/turno com GE, toneladas, MTBF, alertas, pendências. | Should |
| RF-16 | Análise de tendências e recorrência (por equipamento, turno, tipo de falha, item de checklist). | Could |
| RF-17 | Gamificação: metas por equipe, pontuação por rotina completa no prazo, reconhecimento. | Could |

## 2. Requisitos por módulo

| ID | Módulo | Tipo | Campos / comportamento essencial | Gera | Prot. |
|---|---|---|---|---|---|
| RM-01 | Plano de produção | Consulta | Tabela linha × SKU × dia (Seg–Dom) em toneladas, total semana; destaque do dia e do SKU em produção; importação de planilha Excel (modelo do SAP) com pré-visualização e validação | Meta hora para Hora x Hora | Sim |
| RM-02 | Manutenção autônoma | Checklist | Roteiro por equipamento: limpeza, inspeção, lubrificação básica; frequência por item; C/NC/NA; foto opcional | Registro, Alerta em NC | Genérico |
| RM-03 | Sobrepeso, refugo e reprocesso | Apontamento horário | Por hora: sobrepeso (g ou %), refugo (kg), reprocesso (kg), motivo (lista) e observação; acumulado do turno | Registro; Alerta se acima do limite | Genérico |
| RM-04 | Book de defeitos | Consulta | Catálogo por equipamento/produto: nome do defeito, foto padrão × fora de padrão, o que monitorar, ação sugerida; busca | — | Sim (estático) |
| RM-05 | MTBF | Apontamento por toque | Grade de tipos de falha por equipamento (Enrosco, Troca de bobina, Ajuste mordente, Ajuste temperatura, Selagem enrugada, Perda de sincronismo, …); toque = início; segundo toque ou "resolvido" = fim; hora automática; timeline do turno; Pareto; MTBF do turno | EventoFalha; Alerta por recorrência | Sim |
| RM-06 | Escala | Consulta | Calendário mensal/anual por colaborador com cor por turno/folga; "minha escala" e "escala do posto" | — | Sim (estático) |
| RM-07 | Limpeza semanal | Checklist | Itens obrigatórios por equipamento, janela semanal, assinatura do executor | Registro; Alerta em atraso/NC | Genérico |
| RM-08 | Rastreabilidade de PA | Checklist + foto | Posto (primária/secundária/terciária/caixas), lote PA, lote envoltório, lote caixa, itens de inspeção, **foto obrigatória**, retenção 10 anos (modelada) | Registro | Should |
| RM-09 | Alertas | Gestão | Lista por criticidade/idade/posto/responsável; detalhe com origem (link para registro/tarefa), ações (assumir, registrar ação, resolver, escalar); log de envio Teams/e-mail; acesso restrito a Especialista, Supervisão e Gerência | AcaoAlerta | Sim |
| RM-10 | Hora x Hora | Apontamento + dashboard | Por hora: caixas produzidas → toneladas (peso por caixa do SKU), ton/h, meta hora, GE hora e acumulado, farol; motivo quando abaixo; gráfico hora a hora e acumulado | ApontamentoHora; Alerta GE/meta | Sim |
| RM-11 | Ferramentas de segurança (HSE) | Checklist + consulta | Pré-partida por máquina/turno; checklist dos fornos (PSM3); integridade de ferramentas; talhas; caderno de DDS (tema, participantes); nível de risco da linha (semáforo por linha/turno) | Registro; Alerta crítico em NC | Pré-partida + nível de risco; restante genérico |
| RM-12 | Relatório do turno | Consolidação | Por linha e turno: GE, toneladas, MTBF, maior parada, alertas abertos/tratados, pedidos de ajuda, NCs, pendências; comparação com turno anterior; envio simulado | — | Sim |
| RM-13 | Troca de turno | Formulário guiado | Pré-preenchido com KPIs do turno; perguntas: etiquetas abertas (quantas, onde), paradas, pendências, pedidos de ajuda; campo livre; aceite de quem recebe o turno | Registro | Sim |
| RM-14 | Instrução de trabalho e LPP | Consulta | Biblioteca por equipamento: IT, LPP, documentos técnicos; versão vigente; busca; visualização de PDF/imagem | — | Sim (estático) |
| RM-15 | PPLI & Centerlining | Checklist com padrão | Plano por equipamento: itens de limpeza, lubrificação e centerline (parâmetro, valor padrão, faixa, valor medido); C/NC/NA; NC exige justificativa; resumo; alerta | Registro; Alerta em NC | Sim |
| RM-16 | Agenda da fábrica e recados | Consulta / publicação | Compromissos, paradas programadas, visitas, eventos; publicado por Gerente/Assistente; filtro por linha | — | Sim (leitura) |
| RM-17 | Troubleshooting | Consulta | Dicas e manuais ligados a tipos de falha e alertas recorrentes | — | Could |

"Genérico" = atendido pelo motor de formulários com um checklist de exemplo, sem tela própria.

## 3. Regras de negócio

| ID | Regra |
|---|---|
| RN-01 | Tarefa obrigatória não concluída até o fim da janela vira **atrasada** e gera alerta A-ATRASO (atenção); após 30 min sem tratamento, **crítico**. |
| RN-02 | Item **não conforme** exige justificativa (texto ≥ 10 caracteres ou motivo de lista) e gera alerta A-NC com criticidade do item (itens de segurança e qualidade crítica = crítico). |
| RN-03 | **Toneladas** = caixas × peso líquido por caixa do SKU em produção (plano de produção). |
| RN-04 | **GE** = toneladas produzidas ÷ (capacidade nominal t/h × horas programadas). Parametrizável; rótulo "definição a validar" até confirmação da Mondelez. OEE exibido apenas se informado. |
| RN-05 | **Meta hora** = plano do dia da linha ÷ horas programadas, salvo meta fixa por SKU. Farol: verde ≥ 100 %, amarelo ≥ 90 %, vermelho < 90 % da meta acumulada. |
| RN-06 | **MTBF** = tempo operacional do turno ÷ número de falhas. Falha sem fim registrado conta até o fim do turno. |
| RN-07 | A-GE: GE acumulado < 70 % após 3 h de turno. A-META: acumulado < meta − 1,3 t (configurável). A-REPET: ≥ 3 falhas do mesmo tipo no turno. |
| RN-08 | Alerta é **resolvido** apenas com ação registrada (texto + autor + hora). Alertas de KPI fecham automaticamente quando o indicador recupera, com nota automática. |
| RN-09 | Registro é imutável. Correção cria nova versão vinculada com motivo; histórico mostra ambas. |
| RN-10 | **Troca de turno** só é concluída com aceite do operador que recebe (matrícula + PIN) ou, na ausência, do supervisor. |
| RN-11 | Relatório do turno é gerado automaticamente ao fechar o turno (relógio) ou ao concluir a troca de turno, o que vier primeiro, e atualizado se chegarem registros sincronizados depois. |
| RN-12 | Rotinas são atribuídas por **posto × perfil × frequência**: por hora, por turno, diária, semanal, mensal, sob demanda. |
| RN-13 | Um dispositivo tem um contexto (posto) e muitos usuários ao longo do dia; sessão expira após 10 min sem interação, mantendo o rascunho local. |
| RN-14 | Acesso ao painel de alertas e ao relatório do turno é restrito a Especialista, Supervisão e Gerência; operador vê apenas seus próprios alertas como "pendências". |

## 4. Matriz de permissões

L = leitura · E = escrita (criar registro) · T = tratar · A = administrar conteúdo · — = sem acesso

| Módulo / função | Operação | Supervisão | Gerência | Especialista | Assistência |
|---|---|---|---|---|---|
| Minha Rotina (tarefas do posto) | L E | L | L | L | — |
| Checklists (PPLI, Limpeza, Man. autônoma, HSE, Rastreabilidade) | L E | L E | L | L A | — |
| Hora x Hora, Sobrepeso/refugo, MTBF | L E | L E | L | L | — |
| Troca de turno | L E | L E T | L | L | — |
| Alertas | pendências próprias | L T | L T | L T (domínio) | — |
| Relatório do turno | — | L | L | L | L |
| Plano de produção | L | L | L | L | L A |
| Book, IT/LPP, Troubleshooting | L | L | L | L A | — |
| Escala | L (própria) | L | L | L | L A |
| Agenda e recados | L | L | L A | L | L A |
| Histórico | próprio | linha | seção | domínio | — |
| Admin (usuários, postos, equipamentos, limiares) | — | — | A | A (padrões) | A (cadastros) |

## 5. Requisitos não funcionais

| ID | Requisito | Alvo |
|---|---|---|
| RNF-01 | **Toque de luva**: alvos ≥ 56 × 56 px, espaçamento ≥ 12 px, sem gestos de precisão (sem drag, sem long-press obrigatório), sem dependência de hover | Todo o app |
| RNF-02 | **Legibilidade**: corpo ≥ 16 px, rótulos de campo ≥ 18 px, títulos ≥ 24 px; contraste ≥ 4,5:1 (texto) e ≥ 3:1 (ícones/estados) | WCAG 2.1 AA |
| RNF-03 | **Viewport**: tablet 10.9" landscape (≈1180 × 820) e portrait (≈820 × 1180); desktop ≥ 1280 para liderança | Layout adaptativo |
| RNF-04 | **Desempenho**: interação < 100 ms; troca de tela < 300 ms; app shell carregado < 2 s em rede fraca | Core Web Vitals verdes |
| RNF-05 | **Offline**: um turno inteiro sem rede, sem perda; sincronização idempotente ao voltar | Simulado no protótipo |
| RNF-06 | **Segurança**: perfis, sessão curta no tablet compartilhado, trilha de auditoria; sem dados sensíveis além de matrícula e nome | LGPD mínimo |
| RNF-07 | **Retenção**: fotos e registros de rastreabilidade de PA por 10 anos (modelado; não implementado no protótipo) | Piloto |
| RNF-08 | **Observabilidade de uso**: tempo de preenchimento por registro, tempo de tratamento por alerta, uso por perfil, para alimentar os KPIs do briefing | Protótipo registra localmente |
| RNF-09 | **Idioma**: PT-BR; números e datas no formato brasileiro | — |
| RNF-10 | **Portabilidade**: nada da lógica de negócio acoplado à Vercel; build `standalone` + Docker possível | — |
| RNF-11 | **Acessibilidade de teclado e leitor de tela** nas telas da liderança (desktop) | WCAG 2.1 AA |
| RNF-12 | **Resiliência a erro humano**: autosave, confirmação visível, desfazer em ações simples, correção versionada | — |

## 6. Restrições

| ID | Restrição |
|---|---|
| RS-01 | PoC/piloto integralmente on-premise, sem integrações (V2). O protótipo web na Vercel é instrumento de validação de produto, não de infraestrutura. |
| RS-02 | Sem substituir sistemas corporativos nem redesenhar processo produtivo. |
| RS-03 | Nomes e conceitos dos formulários atuais devem ser preservados (PPLI, centerlining, LPP, PSM3, DDS, GE, MTBF). |
| RS-04 | Marca Mondelez (roxo, logotipo "Snacking Made Right") conforme identidade a ser fornecida no kick-off; até lá, tokens aproximados. |
| RS-05 | WhatsApp fora; Teams e e-mail são os canais. |

## 7. Glossário

| Termo | Significado |
|---|---|
| PPLI | Plano de limpeza, lubrificação e inspeção |
| Centerlining | Padronização dos parâmetros de ajuste da máquina em valores-alvo |
| LPP | Lição Ponto a Ponto: instrução curta, visual, de um ponto do processo |
| IT | Instrução de trabalho |
| PA | Produto acabado |
| GE | Eficiência global da linha (definição Mondelez a validar) |
| OEE | Overall Equipment Effectiveness |
| MTBF | Tempo médio entre falhas |
| PSM3 | Checklist de segurança dos fornos |
| DDS | Diálogo diário de segurança |
| HSE | Saúde, segurança e meio ambiente |
| NC | Não conformidade |
| EQCMS | Sistema de gestão de documentos de qualidade da Mondelez |
| Etiqueta aberta | Anomalia identificada e sinalizada na máquina aguardando tratamento |
