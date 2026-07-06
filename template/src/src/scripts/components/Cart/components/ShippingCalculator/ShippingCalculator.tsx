import { AlertCircleIcon } from '../../../Icons';
import ShippingOption from '../../../ShippingOption/ShippingOption';
import { useShippingCalculator } from './useShippingCalculator';
import styles from './ShippingCalculator.module.scss';

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
  } = useShippingCalculator();

  return (
    <div className={styles.shippingCalculator}>
      <h3 className={styles.title}>Calcular Frete</h3>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="cep-input" className={styles.label}>
            CEP*
          </label>
          <div className={styles.fieldWrapper}>
            <input
              id="cep-input"
              type="text"
              value={cep}
              onChange={handleCepChange}
              placeholder="00000-000"
              className={styles.input}
              required
              disabled={loading}
            />
            <button type="submit" className={styles.btn} disabled={isSubmitDisabled}>
              {loading ? 'Calculando...' : 'Calcular'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className={styles.error}>
          <AlertCircleIcon width={14} height={14} />
          <span>{error}</span>
        </div>
      )}

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
  );
}

export default ShippingCalculator;
