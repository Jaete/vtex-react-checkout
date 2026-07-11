import { useState } from 'react'
import type { FormEvent } from 'react'

import { useCart } from '../../context/CartContext'

interface UseSellerCodeParams {
  setOpenTextField: boolean
}

export function useSellerCode({ setOpenTextField }: UseSellerCodeParams) {
  const { orderForm, setSellerCode, sellerCodeError, loading } = useCart()
  const [code, setCode] = useState('')
  const [editing, setEditing] = useState(false)

  const activeCode = orderForm?.marketingData?.utmiCampaign || null
  const showInput = !activeCode || editing

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!code.trim()) return
    await setSellerCode(code, setOpenTextField)
    setCode('')
    setEditing(false)
  }

  const handleAlter = () => {
    setCode(activeCode || '')
    setEditing(true)
  }

  return {
    code,
    setCode,
    activeCode,
    sellerCodeError,
    loading,
    showInput,
    handleSubmit,
    handleAlter,
  }
}
