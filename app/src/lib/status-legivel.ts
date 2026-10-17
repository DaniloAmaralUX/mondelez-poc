/**
 * Cor de texto legível para o `Status` do template (src/components/ui/status.tsx, que não se edita), aplicada no ponto
 * de uso (docs/12 §3.3, critério 9). O template pinta success e warning com o tom 600 e error com `text-destructive`
 * (o mesmo vermelho 600) sobre o fundo 500/10: 2,9 a 4,0:1 no texto de 12–14 px, abaixo de 4,5:1. Info usa o azul 600,
 * que passa raspando sobre o fundo branco (4,66:1) e cai para 4,42:1 num card com fundo (o selo "Em tratamento" do
 * alerta). Um tom acima no claro (700); no escuro, o 400, que já passa. Default fica como no template.
 *
 * Pelas variantes `data-[variant=…]` (o `Status` grava `data-variant`): a classe vale para qualquer variante escolhida
 * em tempo de execução, sem mapear cor por estado em cada tela.
 */
export const STATUS_LEGIVEL =
  "data-[variant=success]:text-green-700 data-[variant=warning]:text-orange-700 data-[variant=error]:text-red-700 data-[variant=info]:text-blue-700 dark:data-[variant=success]:text-green-400 dark:data-[variant=warning]:text-orange-400 dark:data-[variant=error]:text-red-400 dark:data-[variant=info]:text-blue-400";
