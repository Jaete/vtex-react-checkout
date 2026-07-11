import type { ShippingOptionData } from '~hooks/useShippingData'

export interface OptionsListProps {
  options: ShippingOptionData[]
  selectedShipping: string | null
  onSelect: (optionId: string) => void
}
