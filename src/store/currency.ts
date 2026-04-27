import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Currency = 'UYU' | 'USD';

interface CurrencyStore {
    currency: Currency;
    setCurrency: (c: Currency) => void;
    format: (price: number) => string;
}

const USD_TO_UYU = 42; // approximate exchange rate for display only

function formatByCurrency(price: number, currency: Currency): string {
    if (currency === 'USD') {
        return new Intl.NumberFormat('es-UY', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(price);
    }
    // Convert USD prices to UYU for display when currency is UYU
    // Prices >= 100 are already in UYU (pesos), prices < 100 are in USD
    const isAlreadyUYU = price >= 100;
    const uyuPrice = isAlreadyUYU ? price : price * USD_TO_UYU;
    return new Intl.NumberFormat('es-UY', {
        style: 'currency',
        currency: 'UYU',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(uyuPrice);
}

export const useCurrency = create<CurrencyStore>()(
    persist(
        (set, get) => ({
            currency: 'UYU',
            setCurrency: (c) => set({ currency: c }),
            format: (price) => formatByCurrency(price, get().currency),
        }),
        { name: 'currency-preference' }
    )
);
