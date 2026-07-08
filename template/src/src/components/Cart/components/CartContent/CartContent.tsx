import { useCart } from '../../context/CartContext'
import CartEmptyState from '../CartEmptyState/CartEmptyState'
import CartItemsList from '../CartItemsList/CartItemsList'
import ShippingCalculator from '../ShippingCalculator/ShippingCalculator'
import DiscountCoupon from '../DiscountCoupon/DiscountCoupon'
import SellerCode from '../SellerCode/SellerCode'
import OrderSummary from '../OrderSummary/OrderSummary'
import styles from './CartContent.module.scss'

function CartContent() {
  const { orderForm, loading } = useCart()
  const itemsCount = orderForm?.items?.length || 0

  if (itemsCount === 0 && !loading) {
    return <CartEmptyState />
  }

  return (
    <div className={styles.content}>
      <h1 className={styles.title}>Meu carrinho</h1>

      <div className={styles.grid}>
        <div className={styles.gridMain}>
          <div className={styles.card}>
            <CartItemsList />
          </div>

          <div className={styles.card}>
            <ShippingCalculator />
          </div>
        </div>

        <div className={styles.gridSidebar}>
          <div className={styles.card}>
            <DiscountCoupon />
            <SellerCode />
          </div>

          <OrderSummary />
        </div>
      </div>
    </div>
  )
}

export default CartContent
