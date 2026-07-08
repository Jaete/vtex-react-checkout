import { useState, useEffect } from 'react';

// `$` (jQuery) é global no checkout nativo — webpack o resolve via
// `externals: { jquery: 'jQuery' }`, então não importamos, só declaramos o
// global para o TypeScript. O orderForm da VTEX não é tipado (mesmo escape
// hatch de `(window as any).vtexjs` usado no resto do projeto), então fica `any`.
declare const $: any;

export interface UseOrderFormResult {
  loading: boolean;
  orderForm: any;
  shippingData: any;
}

function useOrderForm(): UseOrderFormResult {
  const initialOrderForm = (window as any)?.API?.orderForm;

  const [loading, setLoading] = useState(false);
  const [orderForm, setOrderForm] = useState<any>(initialOrderForm);
  const [shippingData, setShippingData] = useState<any>(initialOrderForm?.shippingData);

  const orderFormUpdatedCb = (_: any, updatedOrderForm: any) => {
    setOrderForm(updatedOrderForm);
    setShippingData(updatedOrderForm?.shippingData);
  };

  const checkoutRequestBeginCb = () => {
    setLoading(true);
  };

  const checkoutRequestEndCb = () => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    $(window).on('orderFormUpdated.vtex', orderFormUpdatedCb);
    $(window).on('checkoutRequestBegin.vtex', checkoutRequestBeginCb);
    $(window).on('checkoutRequestEnd.vtex', checkoutRequestEndCb);

    return () => {
      $(window).off('orderFormUpdated.vtex', orderFormUpdatedCb);
      $(window).off('checkoutRequestBegin.vtex', checkoutRequestBeginCb);
      $(window).off('checkoutRequestEnd.vtex', checkoutRequestEndCb);
    };
  }, []);

  return { loading, orderForm, shippingData };
}

export default useOrderForm;
