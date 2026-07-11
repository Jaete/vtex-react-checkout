import Button from '~components/Button/Button'
import SectionTitle from '~components/SectionTitle/SectionTitle'
import { SecurityIcon } from '~components/Icons'
import { formatCurrency } from '~utils/currency'
import { useOrderSummary } from './useOrderSummary'
import styles from './OrderSummary.module.scss'

function OrderSummary() {
  const {
    loading,
    itemsTotal,
    discountVal,
    shippingVal,
    total,
    hasItems,
    handleCheckout,
  } = useOrderSummary()

  return (
    <div className={styles.summary}>
      <SectionTitle>Resumo da Sacola</SectionTitle>

      <div className={styles.rows}>
        <div className={styles.row}>
          <span>Subtotal</span>
          <span>{formatCurrency(itemsTotal)}</span>
        </div>

        {discountVal > 0 && (
          <div className={`${styles.row} ${styles.rowDiscount}`}>
            <span>Descontos</span>
            <span>-{formatCurrency(discountVal)}</span>
          </div>
        )}

        <div className={styles.row}>
          <span>Entrega</span>
          <span>
            {shippingVal > 0 ? formatCurrency(shippingVal) : 'A calcular'}
          </span>
        </div>

        <div className={styles.divider} />

        <div className={`${styles.row} ${styles.rowTotal}`}>
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <Button
        variant="primary"
        size="xl"
        fullWidth
        loading={loading}
        disabled={!hasItems}
        onClick={handleCheckout}
        className={styles.cta}
      >
        {loading ? 'Processando...' : 'Finalizar Compra'}
      </Button>

      <div className={styles.security}>
        <div className={styles.securityBadge}>
          <SecurityIcon
            width={12}
            height={12}
            className={styles.securityIcon}
          />
          <span>Ambiente seguro e criptografado</span>
        </div>
      </div>
    </div>
  )
}

export default OrderSummary
