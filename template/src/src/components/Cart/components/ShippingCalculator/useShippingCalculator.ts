import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import { useCart } from '../../context/CartContext'

function formatCep(value: string): string {
  const clean = value.replace(/\D/g, '')

  if (clean.length <= 5) {
    return clean
  }
  return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`
}

export function useShippingCalculator() {
  const {
    calculateShipping,
    shippingOptions,
    selectedShipping,
    selectShippingOption,
    loading,
    error,
  } = useCart()
  const [cep, setCep] = useState('')

  const handleCepChange = (event: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(event.target.value)
    if (formatted.length <= 9) {
      setCep(formatted)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (cep.replace(/\D/g, '').length === 8) {
      calculateShipping(cep)
    }
  }

  return {
    cep,
    loading,
    error,
    shippingOptions,
    selectedShipping,
    selectShippingOption,
    handleCepChange,
    handleSubmit,
    isSubmitDisabled: loading || cep.replace(/\D/g, '').length !== 8,
  }
}
