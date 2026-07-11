import { useState, useEffect, useRef } from 'react'

// `$` (jQuery) é global no checkout nativo — webpack o resolve via
// `externals: { jquery: 'jQuery' }`, então não importamos, só declaramos o
// global para o TypeScript. O orderForm da VTEX não é tipado, então fica `any`.
declare const $: any

export interface UseOrderFormResult {
  loading: boolean
  orderForm: any
  shippingData: any
}

/**
 * @param vtexjs - `window.vtexjs` já resolvido pelo `CartProvider` (única
 * fonte da checagem de existência do global — ver `~utils/vtexjs`). Usado
 * apenas para ler o `orderForm` inicial; as atualizações depois vêm dos
 * eventos jQuery abaixo.
 */
function useOrderForm(vtexjs: any): UseOrderFormResult {
  const initialOrderForm = vtexjs?.checkout?.orderForm

  const [loading, setLoading] = useState(false)
  const [orderForm, setOrderForm] = useState<any>(initialOrderForm)
  const [shippingData, setShippingData] = useState<any>(
    initialOrderForm?.shippingData
  )
  // Guarda o timer do "fim de request" para poder cancelá-lo se um novo
  // request começar antes dele disparar (senão ele limpa `loading` de um
  // request mais novo ainda em andamento) ou se o hook desmontar antes disso.
  const endTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const orderFormUpdatedCb = (_: any, updatedOrderForm: any) => {
    setOrderForm(updatedOrderForm)
    setShippingData(updatedOrderForm?.shippingData)
  }

  const checkoutRequestBeginCb = () => {
    if (endTimeoutRef.current) {
      clearTimeout(endTimeoutRef.current)
      endTimeoutRef.current = null
    }
    setLoading(true)
  }

  const checkoutRequestEndCb = () => {
    endTimeoutRef.current = setTimeout(() => {
      endTimeoutRef.current = null
      setLoading(false)
    }, 1000)
  }

  useEffect(() => {
    $(window).on('orderFormUpdated.vtex', orderFormUpdatedCb)
    $(window).on('checkoutRequestBegin.vtex', checkoutRequestBeginCb)
    $(window).on('checkoutRequestEnd.vtex', checkoutRequestEndCb)

    return () => {
      $(window).off('orderFormUpdated.vtex', orderFormUpdatedCb)
      $(window).off('checkoutRequestBegin.vtex', checkoutRequestBeginCb)
      $(window).off('checkoutRequestEnd.vtex', checkoutRequestEndCb)
      if (endTimeoutRef.current) {
        clearTimeout(endTimeoutRef.current)
      }
    }
  }, [])

  return { loading, orderForm, shippingData }
}

export default useOrderForm
