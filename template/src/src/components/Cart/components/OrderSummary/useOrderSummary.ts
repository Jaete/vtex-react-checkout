import { useCart } from '../../context/CartContext'

export function useOrderSummary() {
  const { orderForm, loading, vtexjs } = useCart()

  const totalizers = orderForm?.totalizers || []
  const itemsTotalObj = totalizers.find((t: any) => t.id === 'Items')
  const discountsTotalObj = totalizers.find((t: any) => t.id === 'Discounts')
  const shippingTotalObj = totalizers.find((t: any) => t.id === 'Shipping')

  const items = orderForm?.items || []
  const itemsTotal = itemsTotalObj
    ? itemsTotalObj.value
    : items.reduce(
        (acc: number, item: any) => acc + item.listPrice * item.quantity,
        0
      )

  const discountVal = Math.abs(discountsTotalObj?.value ?? 0)
  const shippingVal = shippingTotalObj ? shippingTotalObj.value : 0
  const total =
    orderForm?.value !== undefined
      ? orderForm.value
      : itemsTotal - discountVal + shippingVal

  const handleCheckout = () => {
    if (loading) return

    if (vtexjs?.checkout?.goToPayment) {
      vtexjs.checkout.goToPayment()
    } else {
      window.location.hash = '#/email'
    }
  }

  return {
    loading,
    itemsTotal,
    discountVal,
    shippingVal,
    total,
    hasItems: items.length > 0,
    handleCheckout,
  }
}
