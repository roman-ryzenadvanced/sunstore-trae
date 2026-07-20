"use client"

import { useState, useEffect } from 'react'

export function useCurrency() {
  const [currency, setCurrency] = useState('RUB')
  const [exchangeRates, setExchangeRates] = useState({
    RUB: 1,
    USD: 90,
    EUR: 98
  })

  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency')
    if (savedCurrency) {
      setCurrency(savedCurrency)
    }

    // Mock exchange rates - in real app would fetch from API
    setExchangeRates({
      RUB: 1,
      USD: 90,
      EUR: 98
    })
  }, [])

  const convertPrice = (price: number) => {
    return price / exchangeRates[currency]
  }

  const currencyConfig = {
    symbol: currency === 'RUB' ? '₽' : currency === 'USD' ? '$' : '€',
    code: currency
  }

  return {
    currency,
    setCurrency,
    convertPrice,
    currencyConfig,
    exchangeRates
  }
}