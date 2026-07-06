import { AlertCircleIcon } from '../../../Icons';
import CouponBadge from '../../../CouponBadge/CouponBadge';
import { useDiscountCoupon } from './useDiscountCoupon';
import styles from './DiscountCoupon.module.scss';

function DiscountCoupon() {
  const { couponCode, setCouponCode, activeCoupon, couponError, loading, handleSubmit, removeDiscountCoupon } =
    useDiscountCoupon();

  return (
    <div className={styles.discountCoupon}>
      <h3 className={styles.title}>Cupom de Desconto</h3>

      {!activeCoupon ? (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Digite o código"
              className={styles.input}
              disabled={loading}
            />
            <button type="submit" className={styles.btn} disabled={loading || !couponCode.trim()}>
              Aplicar
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.applied}>
          <CouponBadge code={activeCoupon} onRemove={removeDiscountCoupon} disabled={loading} />
          <span className={styles.successMsg}>Cupom ativo com sucesso!</span>
        </div>
      )}

      {couponError && (
        <div className={styles.error}>
          <AlertCircleIcon width={12} height={12} />
          <span>{couponError}</span>
        </div>
      )}
    </div>
  );
}

export default DiscountCoupon;
