import { formatCurrency } from '~utils/currency';
import type { ShippingOptionProps } from './ShippingOption.types';
import styles from './ShippingOption.module.scss';

/** Passo (ms) entre o início da animação de um item e o do seguinte (cascata). */
export const SHIPPING_OPTION_STAGGER_MS = 50;

function formatShippingPrice(value: number): string {
  return value === 0 ? 'Grátis' : formatCurrency(value);
}

function ShippingOption({
  name,
  price,
  shippingEstimate,
  selected,
  onSelect,
  pickupStore,
  index = 0,
  staggerMs = SHIPPING_OPTION_STAGGER_MS,
}: ShippingOptionProps) {
  return (
    <label
      className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
      style={{ animationDelay: `${index * staggerMs}ms` }}
    >
      <input type="radio" name="shippingOption" checked={selected} onChange={onSelect} className={styles.radio} />
      <div className={styles.info}>
        <span className={styles.name}>{pickupStore ?? name}</span>
        <span className={styles.estimate}>Prazo: {shippingEstimate}</span>
      </div>
      <div className={styles.price}>{formatShippingPrice(price)}</div>
    </label>
  );
}

export default ShippingOption;
