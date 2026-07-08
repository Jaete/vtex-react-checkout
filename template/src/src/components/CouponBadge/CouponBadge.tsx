import { CloseIcon, CouponIcon } from '../Icons';
import type { CouponBadgeProps } from './CouponBadge.types';
import styles from './CouponBadge.module.scss';

function CouponBadge({ code, onRemove, disabled }: CouponBadgeProps) {
  return (
    <div className={styles.badge}>
      <CouponIcon width={14} height={14} className={styles.icon} />
      <span className={styles.code}>{code}</span>
      <button type="button" onClick={onRemove} className={styles.remove} title="Remover cupom" disabled={disabled}>
        <CloseIcon width={12} height={12} />
      </button>
    </div>
  );
}

export default CouponBadge;
