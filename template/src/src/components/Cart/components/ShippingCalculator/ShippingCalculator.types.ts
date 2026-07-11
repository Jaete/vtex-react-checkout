export type ShippingCalculatorVariant = 'auto' | 'list' | 'channel'

export interface ShippingCalculatorProps {
  /**
   * Pele do seletor de frete:
   * - `list`: lista plana de todas as opções (comportamento clássico);
   * - `channel`: seletor primário Retirada/Entrega com SLAs filtrados por canal;
   * - `auto` (padrão): usa `channel` quando há SLAs de retirada E entrega, senão `list`.
   */
  variant?: ShippingCalculatorVariant
}
