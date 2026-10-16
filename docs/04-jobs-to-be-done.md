# 04 · Jobs to be Done

Formato: **Quando** [situação], **quero** [motivação], **para** [resultado]. Prioridade: **P0** núcleo do protótipo · **P1** deve aparecer · **P2** depois.

## Jobs principais

| Nível | Job principal |
|---|---|
| Operação | Conduzir o turno da minha linha dentro do padrão, registrando o que aconteceu no momento em que acontece, sem papel e sem retrabalho. |
| Liderança | Saber agora o que está fora do padrão na minha área, quem é o responsável, e agir antes que vire perda. |
| Padrões | Garantir que o padrão certo esteja no ponto de uso e que todo desvio dele seja visto e tratado. |

## Mapa do job: o turno

| Etapa | O que a pessoa precisa | Módulos que servem | Persona |
|---|---|---|---|
| 1. Assumir | Saber estado da linha, pendências herdadas, plano do dia, riscos | Troca de turno (leitura), Plano de produção, Agenda, Nível de risco | Operador, Supervisor |
| 2. Preparar | Liberar a máquina com segurança e no padrão | Pré-partida (HSE), PPLI & Centerlining, Manutenção autônoma | Operador |
| 3. Produzir e apontar | Registrar produção e qualidade hora a hora, saber se está na meta | Hora x Hora, Sobrepeso/refugo/reprocesso, Rastreabilidade de PA | Operador |
| 4. Desviar | Registrar falha ou NC na hora, pedir ajuda | MTBF, qualquer checklist com NC, Book de defeitos, IT/LPP | Operador |
| 5. Tratar | Ser avisado, priorizar, agir e registrar a ação | Alertas | Supervisor, Especialista |
| 6. Encerrar | Fechar o turno com dados prontos e passar o bastão | Troca de turno (escrita), Relatório do turno | Operador, Supervisor |
| 7. Analisar | Comparar linhas e turnos, achar recorrência, responder auditoria | Relatório do turno, Histórico, Tendências | Gerente, Especialista |
| Contínuo | Saber escala, avisos, padrões vigentes | Escala, Agenda, IT, Book | Todos |

## Jobs por persona

### Operador (P1 Alberto / P2 Graziela)

| Pri | Job |
|---|---|
| P0 | Quando começo o turno, quero ver exatamente o que preciso fazer e em que ordem, para não esquecer nenhum registro obrigatório. |
| P0 | Quando faço um checklist na linha, de luva, quero marcar cada item em um toque e só escrever quando for exceção, para não parar a produção. |
| P0 | Quando encontro um item não conforme, quero registrar e justificar ali mesmo, para que quem decide fique sabendo na hora e eu não seja cobrado depois. |
| P0 | Quando a máquina falha, quero apontar o tipo de falha num toque, para que o MTBF saia certo sem eu calcular nem anotar depois. |
| P0 | Quando fecha a hora, quero apontar as caixas e ver se estou na meta, para corrigir o ritmo ou pedir ajuda. |
| P0 | Quando termino o turno, quero que a passagem de turno já venha preenchida com meus números, para só completar o que a máquina não sabe. |
| P0 | Quando a rede cai, quero continuar registrando normalmente, para não perder o que já fiz nem repetir. |
| P1 | Quando tenho dúvida de como ajustar ou o que é defeito, quero a instrução e o book do meu equipamento ali no tablet, para resolver sem chamar ninguém. |
| P1 | Quando peço ajuda, quero saber que alguém viu, para não precisar repetir no WhatsApp. |
| P1 | Quando inspeciono produto acabado, quero tirar a foto e ligar ao lote em um fluxo só, para a evidência não ficar no meu celular. |
| P2 | Quando quero saber minha escala ou um aviso da fábrica, quero consultar no tablet, para não depender do mural. |
| P2 | Quando faço tudo certo no turno, quero que isso apareça, para que o esforço seja reconhecido. |

### Supervisor (P3 Renata)

| Pri | Job |
|---|---|
| P0 | Quando um registro obrigatório atrasa ou sai não conforme, quero ser avisada na hora com posto, responsável e criticidade, para agir antes do fim do turno. |
| P0 | Quando trato um alerta, quero registrar o que fiz e fechá-lo, para ter rastro do tratamento em auditoria. |
| P0 | Quando passo o turno, quero o consolidado da linha (GE, toneladas, MTBF, maior parada, pendências) pronto, para a reunião de passagem ser sobre decisões. |
| P0 | Quando ando pela linha, quero ver o status de cada posto (feito, pendente, atrasado), para decidir onde ir primeiro. |
| P1 | Quando um operador pede ajuda, quero ver o pedido junto do contexto (hora, equipamento, falha), para responder certo. |
| P1 | Quando o GE do turno cai, quero ver as paradas e falhas da hora, para atacar a causa e não o sintoma. |
| P2 | Quando o mesmo alerta se repete, quero ver o histórico, para escalar à manutenção ou ao especialista com evidência. |

### Gerente de Seção (P4 Marcos)

| Pri | Job |
|---|---|
| P0 | Quando o turno termina, quero o relatório por linha chegar pronto, para comparar e decidir no mesmo dia. |
| P0 | Quando há um desvio crítico, quero ser notificado no canal que já uso (Teams, e-mail), para não precisar entrar no sistema para descobrir. |
| P1 | Quando preparo a reunião diária, quero comparar linhas e turnos lado a lado, para priorizar recursos. |
| P1 | Quando programo parada, visita ou evento, quero publicar na agenda da fábrica, para que a linha veja no tablet. |
| P2 | Quando há auditoria, quero achar qualquer registro, de qualquer data, com evidência e autor, em minutos. |
| P2 | Quando uma falha se repete entre turnos, quero que o sistema me mostre o padrão, para investir onde dói. |

### Especialista de Seção (P5 Juliana)

| Pri | Job |
|---|---|
| P1 | Quando atualizo um padrão (PPLI, centerlining, checklist, IT), quero publicar e ter certeza de que a versão antiga sumiu do posto. |
| P1 | Quando sai uma NC do meu domínio, quero vê-la com foto e contexto no mesmo momento, para orientar a correção. |
| P2 | Quando analiso a semana, quero NCs e falhas por equipamento e turno, para atacar recorrências. |

### Assistente (P6 Carlos)

| Pri | Job |
|---|---|
| P1 | Quando chega a planilha do plano de produção, quero importar e publicar em um passo, para o operador ver a meta do dia. |
| P1 | Quando a escala muda, quero editar uma vez e todos verem no tablet. |
| P2 | Quando entra um operador novo, quero cadastrá-lo e ligá-lo ao posto sem chamar TI. |

## Forças de progresso (por que adotar, por que resistir)

| Força | Operação | Liderança |
|---|---|---|
| **Empurra** (dor atual) | Cobrança tardia, papel que some, retrabalho, não saber o que falta | Descobrir tarde, consolidar à mão, auditoria frágil |
| **Puxa** (atração) | Lista clara, 2 toques, "já está registrado" | Ver em tempo real, agir em minutos, relatório pronto |
| **Ansiedade** | "Mais uma tela", vigilância, tablet quebrar, rede cair, errar e não poder corrigir | Dados crus expostos, volume de alertas, dependência de Wi-Fi |
| **Hábito** | Caderno, formulário conhecido, WhatsApp | Planilha própria, reunião presencial |

Implicações de design: autosave e correção com versão (reduz ansiedade de errar); indicador de sync (tablet pode funcionar sem rede); alertas com criticidade e agrupamento (evita enxurrada); linguagem dos formulários atuais preservada (respeita o hábito); confirmação visível ao registrar (reforça o "já está feito").

## Resultados desejados (para medir o protótipo em teste com usuários)

| Resultado | Métrica no protótipo |
|---|---|
| Minimizar o tempo para saber o que fazer | Tempo até abrir a primeira tarefa após login < 10 s |
| Minimizar o tempo de registro de um checklist de 10 itens | < 60 s, de luva |
| Minimizar o tempo entre NC e alerta visível ao supervisor | Imediato, com o sistema online; ao sincronizar, offline |
| Maximizar a chance de o operador saber que foi registrado | 100 % dos registros com confirmação e estado de sync |
| Minimizar o tempo de fechar o turno | Troca de turno com ≥ 80 % dos campos pré-preenchidos |
| Minimizar o esforço de consolidação | Relatório do turno gerado sem digitação |
| Maximizar a rastreabilidade | 100 % dos registros com autor, turno, posto, versão e hora |
