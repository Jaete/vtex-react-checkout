import { formatCurrency } from '../../../utils/currency';
import type { ShippingOptionProps } from './ShippingOption.types';
import styles from './ShippingOption.module.scss';

function formatShippingPrice(value: number): string {
  return value === 0 ? 'Grátis' : formatCurrency(value);
}

function ShippingOption({ name, price, shippingEstimate, selected, onSelect }: ShippingOptionProps) {
  return (
    <label className={`${styles.option} ${selected ? styles.optionSelected : ''}`}>
      <input type="radio" name="shippingOption" checked={selected} onChange={onSelect} className={styles.radio} />
      <div className={styles.info}>
        <span className={styles.name}>{name}</span>
        <span className={styles.estimate}>Prazo: {shippingEstimate}</span>
      </div>
      <div className={styles.price}>{formatShippingPrice(price)}</div>
    </label>
  );
}

export default ShippingOption;
