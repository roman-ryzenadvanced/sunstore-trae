'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Currency, CurrencyContextType, CurrencyRate, CURRENCIES } from '@/types/currency';

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('RUB');
  const [rates, setRates] = useState<Record<Currency, CurrencyRate>>(CURRENCIES);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('sunstore-currency') as Currency;
    if (saved && rates[saved]) {
      setCurrency(saved);
    }
  }, []);

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('sunstore-currency', currency);
  }, [currency]);

  const convertPrice = (rubPrice: number): number => {
    const rateData = rates[currency];
    return rubPrice * rateData.rate;
  };

  const formatPrice = (rubPrice: number): string => {
    const converted = convertPrice(rubPrice);
    const rateData = rates[currency];
    const symbol = rateData.symbol;
    
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'RUB' ? 0 : 2,
      maximumFractionDigits: currency === 'RUB' ? 0 : 2
    }).format(converted).replace(currency, symbol);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        convertPrice,
        formatPrice,
        availableCurrencies: Object.keys(rates) as Currency[]
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}