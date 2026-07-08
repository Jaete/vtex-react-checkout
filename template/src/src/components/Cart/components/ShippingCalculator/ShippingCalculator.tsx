import Button from '~components/Button/Button'
import FieldError from '~components/FieldError/FieldError'
import SectionTitle from '~components/SectionTitle/SectionTitle'
import ShippingOption from '~components/ShippingOption/ShippingOption'
import TextInput from '~components/TextInput/TextInput'
import { useShippingCalculator } from './useShippingCalculator'
import styles from './ShippingCalculator.module.scss'

function ShippingCalculator() {
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

      {shippingOptions.length > 0 && (
        <div className={styles.options}>
          <h4 className={styles.optionsTitle}>Opções de entrega:</h4>
          <div className={styles.optionsList}>
            {shippingOptions.map((option) => (
              <ShippingOption
                key={option.id}
                name={option.name}
                price={option.price}
                shippingEstimate={option.shippingEstimate}
                selected={selectedShipping === option.id}
                onSelect={() => selectShippingOption(option.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ShippingCalculator
