import { useState } from 'react';
import type { FormEvent } from 'react';

import { useCart } from '../../context/CartContext';

export function useDiscountCoupon() {
  const { addDiscountCoupon, removeDiscountCoupon, orderForm, couponError, loading } = useCart();
  const [couponCode, setCouponCode] = useState('');

  const activeCoupon = orderForm?.marketingData?.coupon || null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (couponCode.trim()) {
      addDiscountCoupon(couponCode);
      setCouponCode('');
    }
  };

  return {
    couponCode,
    setCouponCode,
    activeCoupon,
    couponError,
    loading,
    handleSubmit,
    removeDiscountCoupon,
  };
}
