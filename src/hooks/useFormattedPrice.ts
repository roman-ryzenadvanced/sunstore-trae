import { useCurrency } from '@/contexts/CurrencyContext';

export function useFormattedPrice() {
  const { convertPrice, formatPrice } = useCurrency();

  return {
    formatPrice,
    convertPrice
  };
}