import ShippingOption from '~components/ShippingOption/ShippingOption'
import { StoreIcon, TruckIcon } from '~components/Icons'
import { useChannelSelector } from './useChannelSelector'
import type {
  ChannelSelectorProps,
  ShippingChannel,
} from './ChannelSelector.types'
import styles from './ChannelSelector.module.scss'

const CHANNEL_LABELS: Record<ShippingChannel, string> = {
  delivery: 'Entrega',
  pickup: 'Retirada',
}

function pickupSubtitle(
  pickupStoreName?: string,
  pickupAddress?: string
): string | undefined {
  return (
    [pickupStoreName, pickupAddress].filter(Boolean).join(' — ') || undefined
  )
}

function ChannelSelector({
  options,
  selectedShipping,
  onSelect,
}: ChannelSelectorProps) {
  const { availableChannels, activeChannel, setActiveChannel, visibleOptions } =
    useChannelSelector({
      options,
      selectedShipping,
    })

  return (
    <div className={styles.channelSelector}>
      <div className={styles.tabs} role="tablist">
        {availableChannels.map((channel) => {
          const Icon = channel === 'pickup' ? StoreIcon : TruckIcon
          const isActive = channel === activeChannel
          return (
            <button
              key={channel}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
              onClick={() => setActiveChannel(channel)}
            >
              <Icon className={styles.tabIcon} />
              {CHANNEL_LABELS[channel]}
            </button>
          )
        })}
      </div>

      <div className={styles.optionsList}>
        {visibleOptions.map((option, index) => (
          <ShippingOption
            key={option.id}
            index={index}
            name={option.name}
            price={option.price}
            shippingEstimate={option.shippingEstimate}
            selected={selectedShipping === option.id}
            onSelect={() => onSelect(option.id)}
            staggerMs={75}
            pickupStore={
              activeChannel === 'pickup'
                ? pickupSubtitle(option.pickupStoreName, option.pickupAddress)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  )
}

export default ChannelSelector
