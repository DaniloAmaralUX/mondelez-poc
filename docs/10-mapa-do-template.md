# 10 · Mapa do escopo sobre o template

O protótipo usa o template **Studio Admin** 1:1: mesmo shell (sidebar, header, controles de layout e tema), mesmas telas e mesmos componentes de `components/ui`. Só o conteúdo e o escopo mudam. O único ajuste visual é o tema **Linear** (preset `linear` em `src/styles/presets/`, padrão do app; fonte Inter).

Cada parte do nosso escopo reaproveita a tela do template com a função mais próxima. A tela original continua no código como referência e sai do menu.

## Shell

| Escopo | Peça do template | Uso |
|---|---|---|
| Navegação por módulos | `navigation/sidebar/sidebar-items.ts` + `NavMain` | Grupos Turno, Registros, Consultas, Administração; itens fora da versão atual com o selo "soon" do template |
| Novo registro rápido | Botão "Quick Create" do `NavMain` | Atalhos para os registros do posto |
| Alertas não lidos | Botão "Inbox" do `NavMain` | Abre Alertas |
| Trocar pessoa no tablet | `AccountSwitcher` (header) | Lista as pessoas da demonstração; sair volta ao login |
| Painel de demonstração | Menu do header (antes: repositórios GitHub) | Relógio (+15 min, +1 h, fim do turno), resetar dados |
| Busca | `SearchDialog` (⌘J) | Módulos e tarefas do turno |
| Pedido de ajuda | `SupportCard` da sidebar | Contexto do posto e turno |
| Usuário atual | `NavUser` da sidebar | Pessoa, cargo, matrícula, sair |
| Layout e tema | `LayoutControls`, `ThemeSwitcher` | Sem mudança |

## Telas

| Escopo (doc 05) | Tela do template | Rota | Versão |
|---|---|---|---|
| Login por matrícula + PIN e posto; SSO simulado da liderança | Auth · Login v2 | `/auth/login` | v0 |
| Minha Rotina do turno (RF-03) | Productivity | `/dashboard/rotina` | v0 |
| Execução de checklist: PPLI e Centerlining, pré-partida, manutenção autônoma, limpeza semanal, rastreabilidade (RF-04, RN-02) | Invoice (formulário com itens + prévia do documento) | `/dashboard/checklist/[formulario]` | v0 |
| Alertas (RM-09, RN-01, RN-02) | Logistics (lista + detalhe) | `/dashboard/alertas` | v0 |
| Tarefas do posto no turno (visão da liderança) | Tasks (tabela com filtros) | `/dashboard/tarefas` | v0 |
| Hora x Hora (RM-10) | Analytics | `/dashboard/hora-x-hora` | próxima |
| MTBF (RM-05) | Infrastructure | `/dashboard/mtbf` | próxima |
| Troca de turno (RM-13) | Invoice | `/dashboard/troca-de-turno` | próxima |
| Relatório do turno (RM-12) | Default | `/dashboard/relatorio-turno` | próxima |
| Agenda e escala (RM-06, RM-16) | Calendar | `/dashboard/agenda` | próxima |
| IT, LPP e book de defeitos (RM-04, RM-14) | File Manager | `/dashboard/documentos` | próxima |
| Usuários e perfis (RF-12) | Users, Roles | `/dashboard/usuarios`, `/dashboard/perfis` | próxima |

## Conflitos com os docs anteriores

- O doc 09 §8 fixa alvos de toque de 56 px e tipografia própria. O template usa a densidade dele (botões de 28 a 36 px). Mantido o template; o tamanho de toque para uso com luva fica como ponto a validar no teste em tablet.
- O doc 02 §4 propõe rotas em `(app)/`. O template usa `(main)/dashboard/<tela>` com componentes colocados em `_components/`; mantida a estrutura do template.
