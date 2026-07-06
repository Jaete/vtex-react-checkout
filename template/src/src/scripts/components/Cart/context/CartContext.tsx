import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import useOrderForm from '../../../../utils/useOrderForm';

export interface CartItem {
  id: string;
  name: string;
  imageUrl: string;
  detailUrl: string;
  price: number;
  listPrice: number;
  quantity: number;
  sellingPrice: number;
}

export interface ShippingOptionData {
  id: string;
  name: string;
  price: number;
  shippingEstimate: string;
}

interface CartContextProps {
  orderForm: any;
  loading: boolean;
  error: string | null;
  shippingOptions: ShippingOptionData[];
  selectedShipping: string | null;
  couponError: string | null;
  updateItemQuantity: (index: number, quantity: number) => Promise<void>;
  removeItem: (index: number) => Promise<void>;
  calculateShipping: (postalCode: string) => Promise<void>;
  selectShippingOption: (optionId: string) => Promise<void>;
  addDiscountCoupon: (couponCode: string) => Promise<void>;
  removeDiscountCoupon: () => Promise<void>;
  clearError: () => void;
  isMock: boolean;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

// Local Storage keys for mock state persistence in dev environment
const MOCK_STORAGE_KEY = 'econverse_mock_cart';

const initialMockOrderForm = {
  value: 275000,
  items: [
    {
      id: "101",
      name: "Cobertora Cover Me 200g - Queen Size",
      imageUrl: "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?q=80&w=200&auto=format&fit=crop",
      detailUrl: "#",
      price: 275000, // in cents (R$ 2.750,00)
      listPrice: 320000, // in cents (R$ 3.200,00)
      quantity: 1,
      sellingPrice: 275000,
    },
    {
      id: "102",
      name: "Travesseiro Pluma Soft Max",
      imageUrl: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=200&auto=format&fit=crop",
      detailUrl: "#",
      price: 25000, // in cents (R$ 250,00)
      listPrice: 25000,
      quantity: 2,
      sellingPrice: 25000,
    }
  ],
  totalizers: [
    { id: "Items", name: "Total dos Itens", value: 325000 },
    { id: "Discounts", name: "Descontos", value: -45000 }, // R$ 450,00 discount (3200 - 2750 = 450)
    { id: "Shipping", name: "Entrega", value: 0 }
  ],
  paymentData: {
    paymentSystems: []
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if VTEX vtexjs global exists
  const isVtexEnv = typeof window !== 'undefined' && !!(window as any).vtexjs;
  const { orderForm: vtexOrderForm, loading: vtexLoading } = isVtexEnv 
    ? useOrderForm() 
    : { orderForm: null, loading: false };

  const isMock = !isVtexEnv;
  const [mockOrderForm, setMockOrderForm] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(MOCK_STORAGE_KEY);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { return initialMockOrderForm; }
      }
    }
    return initialMockOrderForm;
  });

  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOptionData[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const deliveryAddressRef = useRef<any>(null);

  // Sync mock orderForm totals whenever items change
  useEffect(() => {
    if (isMock) {
      const subtotal = mockOrderForm.items.reduce((acc: number, item: CartItem) => acc + (item.price * item.quantity), 0);
      const originalSubtotal = mockOrderForm.items.reduce((acc: number, item: CartItem) => acc + (item.listPrice * item.quantity), 0);
      const itemsDiscount = originalSubtotal - subtotal;
      
      // Simulated Coupon Discount
      let couponDiscountVal = 0;
      if (appliedCoupon === 'ECONVERSE10') {
        couponDiscountVal = Math.round(subtotal * 0.1);
      }

      const shippingVal = selectedShipping 
        ? (shippingOptions.find(o => o.id === selectedShipping)?.price || 0)
        : 0;

      const totalValue = subtotal - couponDiscountVal + shippingVal;

      const updatedForm = {
        ...mockOrderForm,
        value: totalValue,
        totalizers: [
          { id: "Items", name: "Subtotal", value: originalSubtotal },
          { id: "Discounts", name: "Descontos", value: -(itemsDiscount + couponDiscountVal) },
          { id: "Shipping", name: "Entrega", value: shippingVal }
        ]
      };
      
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(updatedForm));
      // Compare values to prevent infinite loops
      if (JSON.stringify(updatedForm) !== JSON.stringify(mockOrderForm)) {
        setMockOrderForm(updatedForm);
      }
    }
  }, [mockOrderForm.items, appliedCoupon, selectedShipping, shippingOptions, isMock]);

  const updateItemQuantity = async (index: number, quantity: number) => {
    if (isMock) {
      setLocalLoading(true);
      setTimeout(() => {
        const newItems = [...mockOrderForm.items];
        if (newItems[index]) {
          newItems[index].quantity = quantity;
        }
        setMockOrderForm({ ...mockOrderForm, items: newItems });
        setLocalLoading(false);
      }, 500);
    } else {
      const vtexjs = (window as any).vtexjs;
      try {
        await vtexjs.checkout.updateItems([{ index, quantity }]);
      } catch (err: any) {
        setError("Erro ao atualizar a quantidade do produto.");
      }
    }
  };

  const removeItem = async (index: number) => {
    if (isMock) {
      setLocalLoading(true);
      setTimeout(() => {
        const newItems = mockOrderForm.items.filter((_: any, idx: number) => idx !== index);
        setMockOrderForm({ ...mockOrderForm, items: newItems });
        setLocalLoading(false);
      }, 500);
    } else {
      const vtexjs = (window as any).vtexjs;
      try {
        await vtexjs.checkout.updateItems([{ index, quantity: 0 }]);
      } catch (err: any) {
        setError("Erro ao remover o produto.");
      }
    }
  };

  const calculateShipping = async (postalCode: string) => {
    const cleanCep = postalCode.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setError("CEP inválido. Digite um CEP com 8 dígitos.");
      return;
    }
    setError(null);

    if (isMock) {
      setLocalLoading(true);
      setTimeout(() => {
        const mockOptions = [
          { id: "normal", name: "Entrega Normal", price: 1500, shippingEstimate: "5 dias úteis" },
          { id: "express", name: "Entrega Expressa", price: 2900, shippingEstimate: "2 dias úteis" },
          { id: "pickup", name: "Retirar na Loja", price: 0, shippingEstimate: "1 dia útil" },
        ];
        setShippingOptions(mockOptions);
        setSelectedShipping("normal");
        setLocalLoading(false);
      }, 800);
    } else {
      const vtexjs = (window as any).vtexjs;
      try {
        setLocalLoading(true);
        const orderForm = await vtexjs.checkout.calculateShipping({ postalCode: cleanCep, country: 'BRA' });
        
        // Convert logisticsInfo into simple format
        if (orderForm?.shippingData?.logisticsInfo) {
          deliveryAddressRef.current = orderForm.shippingData.address;
          // Each item's logisticsInfo carries its own price for a given SLA id,
          // so the option total must sum every item that offers it, not just the first one found.
          const optionsById = new Map<string, ShippingOptionData>();
          orderForm.shippingData.logisticsInfo.forEach((info: any) => {
            info.slas?.forEach((sla: any) => {
              const existing = optionsById.get(sla.id);
              if (existing) {
                existing.price += sla.price;
              } else {
                optionsById.set(sla.id, {
                  id: sla.id,
                  name: sla.name,
                  price: sla.price,
                  shippingEstimate: sla.shippingEstimate,
                });
              }
            });
          });
          const options = Array.from(optionsById.values());
          setShippingOptions(options);
          if (options.length > 0) {
            setSelectedShipping(options[0].id);
          }
        }
      } catch (err: any) {
        setError("Falha ao calcular frete para este CEP.");
      } finally {
        setLocalLoading(false);
      }
    }
  };

  const selectShippingOption = async (optionId: string) => {
    const previousShipping = selectedShipping;
    setSelectedShipping(optionId);

    if (isMock) {
      return;
    }

    const vtexjs = (window as any).vtexjs;
    const option = shippingOptions.find(o => o.id === optionId);
    if (!option) {
      return;
    }

    try {
      setLocalLoading(true);
      await vtexjs.checkout.sendAttachment('shippingData', {
        ...vtexjs.checkout.orderForm.shippingData,
        address: deliveryAddressRef.current || vtexjs.checkout.orderForm.shippingData.address,
        logisticsInfo: vtexjs.checkout.orderForm.shippingData.logisticsInfo.map((info: any) => {
          const sla = info.slas?.find((s: any) => s.id === optionId);
          if (!sla) {
            return info;
          }
          return {
            ...info,
            selectedSla: sla.id,
            selectedDeliveryChannel: sla.deliveryChannel,
          };
        }),
      });
    } catch (err: any) {
      setSelectedShipping(previousShipping);
      setError("Erro ao selecionar a opção de frete.");
    } finally {
      setLocalLoading(false);
    }
  };

  const addDiscountCoupon = async (couponCode: string) => {
    if (!couponCode.trim()) {
      setCouponError("Por favor, digite um cupom.");
      return;
    }
    setCouponError(null);

    if (isMock) {
      setLocalLoading(true);
      setTimeout(() => {
        if (couponCode.toUpperCase() === 'ECONVERSE10') {
          setAppliedCoupon('ECONVERSE10');
        } else {
          setCouponError("Cupom inválido ou expirado.");
        }
        setLocalLoading(false);
      }, 600);
    } else {
      const vtexjs = (window as any).vtexjs;
      try {
        setLocalLoading(true);
        await vtexjs.checkout.addDiscountCoupon(couponCode);
      } catch (err: any) {
        setCouponError("Erro ao aplicar cupom.");
      } finally {
        setLocalLoading(false);
      }
    }
  };

  const removeDiscountCoupon = async () => {
    if (isMock) {
      setLocalLoading(true);
      setTimeout(() => {
        setAppliedCoupon(null);
        setLocalLoading(false);
      }, 400);
    } else {
      const vtexjs = (window as any).vtexjs;
      try {
        setLocalLoading(true);
        await vtexjs.checkout.removeDiscountCoupon();
      } catch (err: any) {
        setError("Erro ao remover o cupom.");
      } finally {
        setLocalLoading(false);
      }
    }
  };

  const clearError = () => {
    setError(null);
    setCouponError(null);
  };

  // Select active values
  const activeOrderForm = isMock ? mockOrderForm : vtexOrderForm;
  const activeLoading = vtexLoading || localLoading;

  return (
    <CartContext.Provider value={{
      orderForm: activeOrderForm,
      loading: activeLoading,
      error,
      shippingOptions,
      selectedShipping,
      couponError,
      updateItemQuantity,
      removeItem,
      calculateShipping,
      selectShippingOption,
      addDiscountCoupon,
      removeDiscountCoupon,
      clearError,
      isMock
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
