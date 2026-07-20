export interface StoreConfig {
  id: string;
  storeId: string;
  baseCurrency: string;
  enabledCurrencies: string[];
  conversionRates: Record<string, number>;
  paymentMethods: string[];
  tbankEnabled: boolean;
  tbankTerminalKey?: string;
  tbankSecret?: string;
  tbankTestMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CurrencyConversion {
  from: string;
  to: string;
  amount: number;
  rate: number;
  converted: number;
}