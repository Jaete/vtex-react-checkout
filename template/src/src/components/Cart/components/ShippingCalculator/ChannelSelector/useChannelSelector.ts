import { useState } from 'react';

import { isPickup } from '~hooks/useShippingData';
import type { ShippingOptionData } from '~hooks/useShippingData';
import type { ShippingChannel } from './ChannelSelector.types';

interface UseChannelSelectorParams {
  options: ShippingOptionData[];
  selectedShipping: string | null;
}

function channelOf(option: ShippingOptionData): ShippingChannel {
  return isPickup(option.deliveryChannel) ? 'pickup' : 'delivery';
}

function groupByChannel(options: ShippingOptionData[]): Record<ShippingChannel, ShippingOptionData[]> {
  return {
    delivery: options.filter((o) => channelOf(o) === 'delivery'),
    pickup: options.filter((o) => channelOf(o) === 'pickup'),
  };
}

/**
 * Deriva o canal inicial: o do SLA já selecionado quando existir, senão o
 * primeiro canal (na ordem entrega → retirada) que tiver opções.
 */
function initialChannel(
  grouped: Record<ShippingChannel, ShippingOptionData[]>,
  options: ShippingOptionData[],
  selectedShipping: string | null,
): ShippingChannel {
  const selected = options.find((o) => o.id === selectedShipping);
  if (selected) {
    return channelOf(selected);
  }
  return grouped.delivery.length ? 'delivery' : 'pickup';
}

export function useChannelSelector({ options, selectedShipping }: UseChannelSelectorParams) {
  const grouped = groupByChannel(options);
  const availableChannels = (['delivery', 'pickup'] as ShippingChannel[]).filter((c) => grouped[c].length > 0);

  const [activeChannel, setActiveChannel] = useState<ShippingChannel>(() =>
    initialChannel(grouped, options, selectedShipping),
  );

  // Se o canal ativo deixou de existir (novo cálculo de CEP mudou os canais),
  // cai no primeiro canal disponível em vez de mostrar uma lista vazia.
  const effectiveChannel = availableChannels.includes(activeChannel)
    ? activeChannel
    : availableChannels[0] ?? 'delivery';

  return {
    availableChannels,
    activeChannel: effectiveChannel,
    setActiveChannel,
    visibleOptions: grouped[effectiveChannel] ?? [],
  };
}
