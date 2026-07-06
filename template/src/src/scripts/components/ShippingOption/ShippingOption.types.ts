export interface ShippingOptionProps {
  name: string;
  price: number;
  shippingEstimate: string;
  selected: boolean;
  onSelect: () => void;
}
