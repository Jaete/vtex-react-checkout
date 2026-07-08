import React, { createContext, useContext, useState } from 'react'
import useOrderForm from '~hooks/useOrderForm'
import useShippingData from '~hooks/useShippingData'
import type { ShippingOptionData } from '~hooks/useShippingData'

export type { ShippingOptionData }

export interface CartItem {
  id: string
  name: string
  imageUrl: string
  detailUrl: string
  price: number
  listPrice: number
  quantity: number
  sellingPrice: number
}

interface CartContextProps {
  orderForm: any
  loading: boolean
  error: string | null
  shippingOptions: ShippingOptionData[]
  selectedShipping: string | null
  couponError: string | null
  sellerCodeError: string | null
  updateItemQuantity: (index: number, quantity: number) => Promise<void>
  removeItem: (index: number) => Promise<void>
  calculateShipping: (postalCode: string) => Promise<void>
  selectShippingOption: (optionId: string) => Promise<void>
  addDiscountCoupon: (couponCode: string) => Promise<void>
  removeDiscountCoupon: () => Promise<void>
  setSellerCode: (code: string, alsoSetOpenTextField?: boolean) => Promise<void>
  clearError: () => void
}

const CartContext = createContext<CartContextProps | undefined>(undefined)

interface CartProviderProps {
  children: React.ReactNode
  /** Repassado a `useShippingData` — pré-seleciona a 1ª opção de frete (padrão `true`). */
  autoSelectShipping?: boolean
}

export const CartProvider: React.FC<CartProviderProps> = ({ children, autoSelectShipping }) => {
  const { orderForm, loading: vtexLoading } = useOrderForm()
  const shipping = useShippingData({ autoSelectShipping })

  const [localLoading, setLocalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [sellerCodeError, setSellerCodeError] = useState<string | null>(null)

  const updateItemQuantity = async (index: number, quantity: number) => {
    const vtexjs = (window as any).vtexjs
    try {
      await vtexjs.checkout.updateItems([{ index, quantity }])
    } catch (err: any) {
      setError('Erro ao atualizar a quantidade do produto.')
    }
  }

  const removeItem = async (index: number) => {
    const vtexjs = (window as any).vtexjs
    try {
      await vtexjs.checkout.updateItems([{ index, quantity: 0 }])
    } catch (err: any) {
      setError('Erro ao remover o produto.')
    }
  }

  const addDiscountCoupon = async (couponCode: string) => {
    if (!couponCode.trim()) {
      setCouponError('Por favor, digite um cupom.')
      return
    }
    setCouponError(null)

    const vtexjs = (window as any).vtexjs
    try {
      setLocalLoading(true)
      await vtexjs.checkout.addDiscountCoupon(couponCode)
    } catch (err: any) {
      setCouponError('Erro ao aplicar cupom.')
    } finally {
      setLocalLoading(false)
    }
  }

  const removeDiscountCoupon = async () => {
    const vtexjs = (window as any).vtexjs
    try {
      setLocalLoading(true)
      await vtexjs.checkout.removeDiscountCoupon()
    } catch (err: any) {
      setCouponError('Erro ao remover o cupom.')
    } finally {
      setLocalLoading(false)
    }
  }

  const setSellerCode = async (code: string, alsoSetOpenTextField = false) => {
    const trimmed = code.trim()
    if (!trimmed) {
      setSellerCodeError('Por favor, digite um código de vendedor.')
      return
    }
    setSellerCodeError(null)

    const vtexjs = (window as any).vtexjs
    try {
      setLocalLoading(true)
      const marketingData = {
        ...(orderForm?.marketingData || {}),
        utmiCampaign: trimmed,
        utmSource: trimmed,
      }
      if (alsoSetOpenTextField) {
        marketingData.openTextField = { value: trimmed }
      }
      await vtexjs.checkout.sendAttachment('marketingData', marketingData)
    } catch (err: any) {
      setSellerCodeError('Erro ao aplicar o código de vendedor.')
    } finally {
      setLocalLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
    setCouponError(null)
    setSellerCodeError(null)
    shipping.clearShippingError()
  }

  const activeLoading = vtexLoading || localLoading || shipping.loading

  return (
    <CartContext.Provider
      value={{
        orderForm,
        loading: activeLoading,
        error: error || shipping.error,
        shippingOptions: shipping.shippingOptions,
        selectedShipping: shipping.selectedShipping,
        couponError,
        sellerCodeError,
        updateItemQuantity,
        removeItem,
        calculateShipping: shipping.calculateShipping,
        selectShippingOption: shipping.selectShippingOption,
        addDiscountCoupon,
        removeDiscountCoupon,
        setSellerCode,
        clearError,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
