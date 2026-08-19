import type { FillUp, FillUpWithMpg } from './types'

export function withMpg(fillUpsAscByOdometer: FillUp[]): FillUpWithMpg[] {
  return fillUpsAscByOdometer.map((f, i) => {
    const prev = i > 0 ? fillUpsAscByOdometer[i - 1] : undefined
    const milesSincePrev = prev ? f.odometer - prev.odometer : undefined
    const mpg = milesSincePrev && milesSincePrev > 0 ? milesSincePrev / f.gallons : undefined
    return {
      ...f,
      milesSincePrev,
      mpg,
      pricePerGallon: f.gallons > 0 ? f.totalCost / f.gallons : 0
    }
  })
}

export interface Totals {
  totalSpent: number
  totalGallons: number
  totalMiles: number
  averageMpg: number | undefined
  costPerMile: number | undefined
  fillUpCount: number
}

export function computeTotals(fillUpsAscByOdometer: FillUp[]): Totals {
  const totalSpent = fillUpsAscByOdometer.reduce((sum, f) => sum + f.totalCost, 0)
  const totalGallons = fillUpsAscByOdometer.reduce((sum, f) => sum + f.gallons, 0)

  const first = fillUpsAscByOdometer[0]
  const last = fillUpsAscByOdometer[fillUpsAscByOdometer.length - 1]
  const totalMiles = first && last ? last.odometer - first.odometer : 0

  // Gallons burned to cover totalMiles excludes the very first fill-up,
  // since that tank's fuel isn't attributable to any tracked distance.
  const gallonsForMpg = fillUpsAscByOdometer.slice(1).reduce((sum, f) => sum + f.gallons, 0)
  const averageMpg = totalMiles > 0 && gallonsForMpg > 0 ? totalMiles / gallonsForMpg : undefined
  const costPerMile = totalMiles > 0 ? totalSpent / totalMiles : undefined

  return {
    totalSpent,
    totalGallons,
    totalMiles,
    averageMpg,
    costPerMile,
    fillUpCount: fillUpsAscByOdometer.length
  }
}
