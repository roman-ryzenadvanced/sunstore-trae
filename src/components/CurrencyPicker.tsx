'use client';

import { useCurrency } from '@/contexts/CurrencyContext';
import { Currency } from '@/types/currency';

export default function CurrencyPicker() {
  const { currency, setCurrency, availableCurrencies } = useCurrency();

  return (
    <div className="flex items-center gap-2">
      {availableCurrencies.map((curr) => (
        <button
          key={curr}
          onClick={() => setCurrency(curr)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
            currency === curr
              ? 'bg-amber-500 text-white'
              : 'bg-solar-200 text-ink hover:bg-amber-100'
          }`}
        >
          {curr}
        </button>
      ))}
    </div>
  );
}