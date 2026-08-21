import { useEffect, useState } from 'react'
import { getExchangeRates, type CurrencyCode } from '../lib/currency'

const STORAGE_KEY = 'game-deals-currency'

export function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyCode>(
    () => (localStorage.getItem(STORAGE_KEY) as CurrencyCode) || 'USD',
  )
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 })
  const [ratesLoading, setRatesLoading] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currency)
  }, [currency])

  useEffect(() => {
    if (currency === 'USD') return
    setRatesLoading(true)
    getExchangeRates()
      .then(setRates)
      .catch(() => setRates({ USD: 1 }))
      .finally(() => setRatesLoading(false))
  }, [currency])

  return { currency, setCurrency, rates, ratesLoading }
}
