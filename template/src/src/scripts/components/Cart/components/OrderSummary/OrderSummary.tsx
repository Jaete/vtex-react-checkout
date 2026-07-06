import { SecurityIcon, SpinnerIcon } from '../../../Icons';
import { formatCurrency } from '../../../../../utils/currency';
import { useOrderSummary } from './useOrderSummary';
import styles from './OrderSummary.module.scss';

function OrderSummary() {
  const { loading, itemsTotal, discountVal, shippingVal, total, hasItems, handleCheckout } = useOrderSummary();

  return (
    <div className={styles.summary}>
      <h3 className={styles.title}>Resumo da Sacola</h3>

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
          <span>{shippingVal > 0 ? formatCurrency(shippingVal) : 'A calcular'}</span>
        </div>

        <div className={styles.divider} />

        <div className={`${styles.row} ${styles.rowTotal}`}>
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <button type="button" onClick={handleCheckout} disabled={loading || !hasItems} className={styles.cta}>
        {loading ? (
          <span className={styles.loading}>
            <SpinnerIcon className={styles.spinner} pathClassName={styles.spinnerPath} />
            Processando...
          </span>
        ) : (
          'Finalizar Compra'
        )}
      </button>

      <div className={styles.security}>
        <div className={styles.securityBadge}>
          <SecurityIcon width={12} height={12} className={styles.securityIcon} />
          <span>Ambiente seguro e criptografado</span>
        </div>
      </div>
    </div>
  );
}

export default OrderSummary;
