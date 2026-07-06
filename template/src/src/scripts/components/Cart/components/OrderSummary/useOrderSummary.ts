import { useCart } from '../../context/CartContext';

function sumItemDiscounts(items: any[]): number {
  return items.reduce((acc: number, item) => {
    const diff = (item.listPrice - item.price) * item.quantity;
    return acc + (diff > 0 ? diff : 0);
  }, 0);
}

export function useOrderSummary() {
  const { orderForm, loading, isMock } = useCart();

  const totalizers = orderForm?.totalizers || [];
  const itemsTotalObj = totalizers.find((t: any) => t.id === 'Items');
  const discountsTotalObj = totalizers.find((t: any) => t.id === 'Discounts');
  const shippingTotalObj = totalizers.find((t: any) => t.id === 'Shipping');

  const items = orderForm?.items || [];
  const itemsTotal = itemsTotalObj
    ? itemsTotalObj.value
    : items.reduce((acc: number, item: any) => acc + item.listPrice * item.quantity, 0);

  const discountVal = discountsTotalObj ? Math.abs(discountsTotalObj.value) : sumItemDiscounts(items);
  const shippingVal = shippingTotalObj ? shippingTotalObj.value : 0;
  const total = orderForm?.value !== undefined ? orderForm.value : itemsTotal - discountVal + shippingVal;

  const handleCheckout = () => {
    if (loading) return;

    if (isMock) {
      alert('Checkout Finalizado! (Simulação em ambiente Mock)');
      return;
    }

    const vtexjs = (window as any).vtexjs;
    if (vtexjs?.checkout?.goToPayment) {
      vtexjs.checkout.goToPayment();
    } else {
      window.location.hash = '#/email';
    }
  };

  return {
    loading,
    itemsTotal,
    discountVal,
    shippingVal,
    total,
    hasItems: items.length > 0,
    handleCheckout,
  };
}
