/*
Filename: format.ts
Last Edit Date: 2026-08-29 EST
*/
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
})

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount)
}
