import Button from '~components/Button/Button'
import FieldError from '~components/FieldError/FieldError'
import SectionTitle from '~components/SectionTitle/SectionTitle'
import TextInput from '~components/TextInput/TextInput'
import { isPickup } from '~hooks/useShippingData'
import { useShippingCalculator } from './useShippingCalculator'
import OptionsList from './OptionsList/OptionsList'
import ChannelSelector from './ChannelSelector/ChannelSelector'
import type { ShippingCalculatorProps } from './ShippingCalculator.types'
import styles from './ShippingCalculator.module.scss'

function ShippingCalculator({ variant = 'auto' }: ShippingCalculatorProps) {
  const {
    cep,
    loading,
    error,
    shippingOptions,
    selectedShipping,
    selectShippingOption,
    handleCepChange,
    handleSubmit,
    isSubmitDisabled,
  } = useShippingCalculator()

  const hasPickup = shippingOptions.some((option) => isPickup(option.deliveryChannel))
  const hasDelivery = shippingOptions.some((option) => !isPickup(option.deliveryChannel))
  const effectiveVariant = variant === 'auto' ? (hasPickup && hasDelivery ? 'channel' : 'list') : variant

  return (
    <div className={styles.shippingCalculator}>
      <SectionTitle>Calcular Frete</SectionTitle>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="cep-input" className={styles.label}>
            CEP*
          </label>
          <div className={styles.fieldWrapper}>
            <TextInput
              id="cep-input"
              value={cep}
              onChange={handleCepChange}
              placeholder="00000-000"
              required
              disabled={loading}
            />
            <Button type="submit" disabled={isSubmitDisabled} variant="primary" loading={loading}>
              Calcular
            </Button>
          </div>
        </div>
      </form>

      {error && <FieldError>{error}</FieldError>}

      {shippingOptions.length > 0 &&
        (effectiveVariant === 'channel' ? (
          <ChannelSelector
            options={shippingOptions}
            selectedShipping={selectedShipping}
            onSelect={selectShippingOption}
          />
        ) : (
          <OptionsList
            options={shippingOptions}
            selectedShipping={selectedShipping}
            onSelect={selectShippingOption}
          />
        ))}
    </div>
  )
}

export default ShippingCalculator
