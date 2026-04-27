/**
 * Formats a price with automatic currency detection.
 * - Values >= 10  → UYU (Pesos Uruguayos)
 * - Values < 10   → USD (used for products priced in dollars)
 * Pass currency explicitly to override.
 */
export function formatPrice(price: number, currency?: 'UYU' | 'USD'): string {
  const cur = currency ?? (price >= 10 ? 'UYU' : 'USD');
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: cur,
    minimumFractionDigits: 0,
    maximumFractionDigits: cur === 'USD' ? 2 : 0,
  }).format(price);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateOrderNumber(): string {
  const prefix = 'ORD';
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${date}-${random}`;
}
