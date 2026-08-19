export interface FillUp {
  id: string
  /** ISO date string, e.g. 2026-08-19 */
  date: string
  odometer: number
  gallons: number
  totalCost: number
  notes?: string
}

export interface FillUpWithMpg extends FillUp {
  /** miles since the previous fill-up; undefined for the first record */
  milesSincePrev?: number
  /** miles-per-gallon for the stretch since the previous fill-up */
  mpg?: number
  pricePerGallon: number
}
