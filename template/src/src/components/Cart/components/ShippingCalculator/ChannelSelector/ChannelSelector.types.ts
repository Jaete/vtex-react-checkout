import type { ShippingOptionData } from '~hooks/useShippingData'

export type ShippingChannel = 'delivery' | 'pickup'

export interface ChannelSelectorProps {
  options: ShippingOptionData[]
  selectedShipping: string | null
  onSelect: (optionId: string) => void
}
