import Button from '~components/Button/Button'
import CouponBadge from '~components/CouponBadge/CouponBadge'
import FieldError from '~components/FieldError/FieldError'
import SectionTitle from '~components/SectionTitle/SectionTitle'
import TextInput from '~components/TextInput/TextInput'
import { useDiscountCoupon } from './useDiscountCoupon'
import styles from './DiscountCoupon.module.scss'

function DiscountCoupon() {
  const {
    couponCode,
    setCouponCode,
    activeCoupon,
    couponError,
    loading,
    handleSubmit,
    removeDiscountCoupon,
  } = useDiscountCoupon()

  return (
    <div className={styles.discountCoupon}>
      <SectionTitle>Cupom de Desconto</SectionTitle>

      {!activeCoupon ? (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <TextInput
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Digite o código"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !couponCode.trim()}
              variant="primary"
              loading={loading}
            >
              Aplicar
            </Button>
          </div>
        </form>
      ) : (
        <div className={styles.applied}>
          <CouponBadge
            code={activeCoupon}
            onRemove={removeDiscountCoupon}
            disabled={loading}
          />
          <span className={styles.successMsg}>Cupom ativo com sucesso!</span>
        </div>
      )}

      {couponError && <FieldError>{couponError}</FieldError>}
    </div>
  )
}

export default DiscountCoupon
