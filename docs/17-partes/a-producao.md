# 17 · Parte A: produção (Hora x Hora e Sobrepeso)

Frente A da v0.5 (doc 16a). Duas telas novas, só nos caminhos da frente: `app/src/app/(main)/dashboard/hora-x-hora/**` e `app/src/app/(main)/dashboard/sobrepeso/**`. Nada fora delas foi editado; tudo consome o contrato do commit `9c73a3b`.

## 1. Telas e rotas

| Tela | Rota | Template de referência | Quem |
| --- | --- | --- | --- |
| Hora x Hora (RM-10, RN-03 a RN-05) | `/dashboard/hora-x-hora` | Analytics (faixa de KPIs, gráfico `ComposedChart`, cards 8/4) | Operação e Supervisão apontam; Gerência e Especialista leem |
| Sobrepeso, refugo e reprocesso (RM-03) | `/dashboard/sobrepeso` | Analytics (card + faixa de KPIs + lista) | Idem |

As duas páginas são Server Components com `<SoComPermissao recurso="apontamentos">`; a escrita é decidida na tela por `pode(perfil, "apontamentos", "escrever")`.

### Hora x Hora

Componentes em `hora-x-hora/_components/`:

| Arquivo | O que faz |
| --- | --- |
| `hora-x-hora.tsx` | Composição por largura, escolha da hora do card, rascunho compartilhado, `key={usuarioId}` |
| `cabecalho-da-producao.tsx` | Large Title (linha · posto, título, SKU, meta por hora em t e caixas, turno). Usado também pelo Sobrepeso |
| `apontar-hora.tsx` | Card "Apontar a hora das HH:00": caixas, prévia de toneladas, GE e farol, motivo abaixo da meta, correção |
| `indicadores-do-turno.tsx` | Toneladas × meta acumulada com farol, GE acumulado, meta do turno, horas apontadas e pendentes (NumberFlow) |
| `grafico-hora-a-hora.tsx` | Dois painéis: barras por hora com a meta tracejada; realizado acumulado × trajetória da meta |
| `horas-do-turno.tsx` | As 8 horas: tabela no notebook, lista tocável no iPad; falhas da hora com link ao MTBF |
| `farol-status.tsx`, `formato.ts` | Farol no `Status` do template; formatos pt-BR, motivos |

### Sobrepeso

Componentes em `sobrepeso/_components/`: `sobrepeso.tsx` (composição, acumulado do turno), `apontar-perdas.tsx` (card do bloco), `blocos-do-turno.tsx` (lista dos blocos) e `formato.ts`.

## 2. Composição por largura

<!-- preenchido após a verificação -->

## 3. Decisões

<!-- preenchido após a verificação -->

## 4. Jobs resolvidos

<!-- preenchido após a verificação -->

## 5. Verificação

<!-- preenchido após a verificação -->

## 6. O que faltou no contrato

<!-- preenchido após a verificação -->
