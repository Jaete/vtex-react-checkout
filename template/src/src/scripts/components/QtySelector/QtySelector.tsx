import { MinusIcon, PlusIcon } from '../Icons';
import type { QtySelectorProps } from './QtySelector.types';
import styles from './QtySelector.module.scss';

function QtySelector({ value, onDecrease, onIncrease, decreaseDisabled, increaseDisabled }: QtySelectorProps) {
  return (
    <div className={styles.selector}>
      <button
        type="button"
        onClick={onDecrease}
        disabled={decreaseDisabled}
        className={styles.btn}
        aria-label="Diminuir quantidade"
      >
        <MinusIcon width={12} height={12} />
      </button>
      <span className={styles.value}>{value}</span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={increaseDisabled}
        className={styles.btn}
        aria-label="Aumentar quantidade"
      >
        <PlusIcon width={12} height={12} />
      </button>
    </div>
  );
}

export default QtySelector;
