export interface ShippingOptionProps {
  name: string
  price: number
  shippingEstimate: string
  selected: boolean
  onSelect: () => void
  /** Subtítulo opcional (ex.: nome/endereço da loja de retirada). */
  pickupStore?: string
  /** Posição do item na lista — usada para escalonar a animação de entrada (cascata). */
  index?: number
  /** Passo (ms) entre itens na cascata; sobrescreve o padrão `SHIPPING_OPTION_STAGGER_MS`. */
  staggerMs?: number
}
