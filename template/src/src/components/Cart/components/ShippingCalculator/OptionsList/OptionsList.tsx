import ShippingOption from '~components/ShippingOption/ShippingOption'
import { isPickup } from '~hooks/useShippingData'
import type { OptionsListProps } from './OptionsList.types'
import styles from './OptionsList.module.scss'

function OptionsList({
  options,
  selectedShipping,
  onSelect,
}: OptionsListProps) {
  return (
    <div className={styles.options}>
      <h4 className={styles.optionsTitle}>Opções de entrega:</h4>
      <div className={styles.optionsList}>
        {options.map((option, index) => {
          const pickup = isPickup(option.deliveryChannel)
          // Em SLAs de retirada, o `name` nativo vem como "Retirar em Loja (uuid)";
          // trocamos pelo endereço da loja, caindo no nome amigável/nome original
          // só quando o endereço não veio no `pickupStoreInfo`.
          const displayName = pickup
            ? (option.pickupAddress ?? option.pickupStoreName ?? option.name)
            : option.name
          return (
            <ShippingOption
              key={option.id}
              index={index}
              name={displayName}
              price={option.price}
              shippingEstimate={option.shippingEstimate}
              selected={selectedShipping === option.id}
              onSelect={() => onSelect(option.id)}
              pickupStore={
                pickup && option.pickupAddress
                  ? option.pickupStoreName
                  : undefined
              }
            />
          )
        })}
      </div>
    </div>
  )
}

export default OptionsList
