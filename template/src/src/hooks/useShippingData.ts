import { useRef, useState } from 'react';

export interface ShippingOptionData {
  id: string;
  name: string;
  price: number;
  shippingEstimate: string;
}

const PICKUP_DELIVERY_CHANNEL = 'pickup-in-point';

/**
 * Resolve o endereço de entrega a ser vinculado ao frete.
 *
 * Após `calculateShipping`, `shippingData.address` vem `null` — o endereço do
 * CEP fica apenas em `availableAddresses` como um endereço do tipo `search`. É
 * esse endereço que precisa ser vinculado (via `address`) para o frete de
 * delivery ser aplicado. Preferimos o `address` explícito quando existir e
 * caímos no `search` mais recente que bate com o CEP.
 *
 * @param shippingData - `shippingData` do orderForm retornado pela VTEX.
 * @param postalCode - CEP já limpo (somente dígitos).
 * @returns O endereço a vincular, ou `null` se nenhum bater com o CEP.
 */
function findDeliveryAddress(shippingData: any, postalCode: string) {
  if (shippingData?.address?.addressId) {
    return shippingData.address;
  }
  const available: any[] = shippingData?.availableAddresses || [];
  const matches = available.filter((a) => a?.postalCode?.replace(/\D/g, '') === postalCode);
  const searchMatches = matches.filter((a) => a.addressType === 'search');
  const pool = searchMatches.length ? searchMatches : matches;
  return pool.length ? pool[pool.length - 1] : null;
}

/**
 * Retorna o endereço que o item deve referenciar para o SLA escolhido:
 * retirada usa o endereço da loja em `pickupStoreInfo.address`; delivery usa o
 * endereço do shopper (capturado no `calculateShipping`).
 *
 * @param sla - SLA selecionado.
 * @param deliveryAddress - Endereço de entrega (usado quando não é retirada).
 * @returns O endereço correspondente ao canal de entrega do SLA.
 */
function resolveAddressForSla(sla: any, deliveryAddress: any) {
  return sla?.deliveryChannel === PICKUP_DELIVERY_CHANNEL
    ? sla.pickupStoreInfo?.address
    : deliveryAddress;
}

/**
 * Monta o `logisticsInfo` enxuto que o attachment `shippingData` espera —
 * apenas `{ itemIndex, selectedSla, selectedDeliveryChannel, addressId }` por
 * item. Reenviar o shippingData inteiro (com campos read-only computados pelo
 * servidor: `availableAddresses`, `pickupPoints`, endereço de perfil, etc.)
 * faz a VTEX negar o acesso (CHK003), então só o essencial vai no corpo.
 *
 * A VTEX também rejeita um item cujo `addressId` não bate com o canal do SLA
 * selecionado (CHK0119). Ao alternar retirada → entrega o `addressId` precisa
 * ser reescrito para o endereço do canal escolhido — senão herda o endereço do
 * ponto de retirada e a validação falha.
 *
 * @param logisticsInfo - `logisticsInfo` de origem (precisa conter os `slas`).
 * @param optionId - Id do SLA selecionado.
 * @param deliveryAddress - Endereço de entrega para os itens de delivery.
 * @returns Novo `logisticsInfo` com o SLA e o `addressId` corretos por item.
 */
function buildLogisticsInfoForSla(logisticsInfo: any[], optionId: string, deliveryAddress: any) {
  return logisticsInfo.map((info: any, itemIndex: number) => {
    const sla = info.slas?.find((s: any) => s.id === optionId);
    if (!sla) {
      return {
        itemIndex,
        selectedSla: info.selectedSla,
        selectedDeliveryChannel: info.selectedDeliveryChannel,
        addressId: info.addressId,
      };
    }
    return {
      itemIndex,
      selectedSla: sla.id,
      selectedDeliveryChannel: sla.deliveryChannel,
      addressId: resolveAddressForSla(sla, deliveryAddress)?.addressId ?? info.addressId,
    };
  });
}

/**
 * Agrega os SLAs de todos os itens em opções de frete únicas por id, somando o
 * preço — cada item do `logisticsInfo` carrega o preço dele para um mesmo SLA,
 * então o total da opção soma todos os itens que a oferecem, não só o primeiro.
 *
 * @param logisticsInfo - `logisticsInfo` do orderForm.
 * @returns Opções de frete deduplicadas por id, com o preço total somado.
 */
function buildShippingOptions(logisticsInfo: any[]): ShippingOptionData[] {
  const optionsById = new Map<string, ShippingOptionData>();
  logisticsInfo.forEach((info: any) => {
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
  return Array.from(optionsById.values());
}

export interface UseShippingDataOptions {
  /**
   * Se `true` (padrão), a primeira opção retornada pelo cálculo de frete é
   * pré-selecionada (apenas no estado da UI — não é aplicada ao orderForm até
   * o usuário confirmar via `selectShippingOption`). Passe `false` para não
   * pré-selecionar nenhuma opção.
   */
  autoSelectShipping?: boolean;
}

/**
 * Hook genérico que concentra toda a manipulação de `shippingData` via
 * `window.vtexjs` — cálculo de frete por CEP e seleção de SLA. Mantém seu
 * próprio loading/erro de frete; o `CartContext` apenas compõe e reexpõe.
 *
 * @param options - `autoSelectShipping` controla a pré-seleção da 1ª opção.
 * @returns Estado do frete (`loading`, `error`, `shippingOptions`,
 * `selectedShipping`) e ações (`calculateShipping`, `selectShippingOption`,
 * `clearShippingError`).
 */
export function useShippingData({ autoSelectShipping = true }: UseShippingDataOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOptionData[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string | null>(null);
  const deliveryAddressRef = useRef<any>(null);
  // A lista de SLAs por item é fixa para um CEP; guardamos o logisticsInfo do
  // calculateShipping (que traz os `slas`) porque cada sendAttachment de
  // seleção pode zerar os `slas` do orderForm atual.
  const logisticsInfoRef = useRef<any[]>([]);

  const calculateShipping = async (postalCode: string) => {
    const cleanCep = postalCode.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setError('CEP inválido. Digite um CEP com 8 dígitos.');
      return;
    }
    setError(null);

    const vtexjs = (window as any).vtexjs;
    try {
      setLoading(true);
      const orderForm = await vtexjs.checkout.calculateShipping({ postalCode: cleanCep, country: 'BRA' });

      if (orderForm?.shippingData?.logisticsInfo) {
        logisticsInfoRef.current = orderForm.shippingData.logisticsInfo;
        deliveryAddressRef.current = findDeliveryAddress(orderForm.shippingData, cleanCep);
        const options = buildShippingOptions(orderForm.shippingData.logisticsInfo);
        setShippingOptions(options);
        if (autoSelectShipping && options.length > 0) {
          setSelectedShipping(options[0].id);
        }
      }
    } catch (err: any) {
      setError('Falha ao calcular frete para este CEP.');
    } finally {
      setLoading(false);
    }
  };

  const selectShippingOption = async (optionId: string) => {
    const previousShipping = selectedShipping;
    setSelectedShipping(optionId);

    const vtexjs = (window as any).vtexjs;
    const option = shippingOptions.find((o) => o.id === optionId);
    if (!option) {
      return;
    }

    const sourceLogistics = logisticsInfoRef.current.length
      ? logisticsInfoRef.current
      : vtexjs.checkout.orderForm.shippingData.logisticsInfo;
    const deliveryAddress = deliveryAddressRef.current;

    try {
      setLoading(true);
      const logisticsInfo = buildLogisticsInfoForSla(sourceLogistics, optionId, deliveryAddress);

      // Enviamos o `address` (singular) + logisticsInfo. O `address` vincula o
      // endereço de entrega e faz a VTEX calcular o frete (sem ele o
      // shippingData fica com address null e os SLAs zeram → "a calcular").
      // NÃO enviamos `selectedAddresses` nem o shippingData inteiro: mexer na
      // coleção de endereços pelo endpoint público retorna acesso negado
      // (CHK003). O `address` singular é o campo legado que o próprio checkout
      // já usava e é aceito.
      await vtexjs.checkout.sendAttachment('shippingData', {
        address: deliveryAddress,
        logisticsInfo,
      });
    } catch (err: any) {
      setSelectedShipping(previousShipping);
      setError('Erro ao selecionar a opção de frete.');
    } finally {
      setLoading(false);
    }
  };

  const clearShippingError = () => setError(null);

  return {
    loading,
    error,
    shippingOptions,
    selectedShipping,
    calculateShipping,
    selectShippingOption,
    clearShippingError,
  };
}

export default useShippingData;
