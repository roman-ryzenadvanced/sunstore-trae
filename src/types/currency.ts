export type Currency = 'RUB' | 'USD' | 'EUR';

export interface CurrencyRate {
  code: Currency;
  symbol: string;
  rate: number;
  name: string;
}

export const CURRENCIES: Record<Currency, CurrencyRate> = {
  RUB: { code: 'RUB', symbol: '₽', rate: 1, name: 'Russian Ruble' },
  USD: { code: 'USD', symbol: '$', rate: 0.0105, name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', rate: 0.0098, name: 'Euro' }
};

export interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (rubPrice: number) => number;
  formatPrice: (rubPrice: number) => string;
  availableCurrencies: Currency[];
}