/*
Filename: NewFillUp.tsx
Last Edit Date: 2026-09-25 EST
Purpose: Single-page entry for a new fill-up: date, odometer, gallons, and total cost, then save.
*/
import { useState } from 'react'
import OdometerDisplay from './OdometerDisplay'
import RegisterDisplay from './RegisterDisplay'
import GallonsDisplay from './GallonsDisplay'
import CalculatorDisplay from './CalculatorDisplay'
import CalendarDisplay from './CalendarDisplay'
import { addFillUp } from '../storage'

interface Props {
  onDone: () => void
}

export default function NewFillUp({ onDone }: Props) {
  const [odometer, setOdometer] = useState('')
  const [gallons, setGallons] = useState('')
  const [totalCost, setTotalCost] = useState('')

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setSaveError(null)
    try {
      await addFillUp({
        date,
        odometer: parseFloat(odometer),
        gallons: parseFloat(gallons),
        totalCost: parseFloat(totalCost)
      })
      onDone()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save fill-up.')
    } finally {
      setSaving(false)
    }
  }

  const isNumber = (v: string) => v.trim() !== '' && !isNaN(parseFloat(v))
  const valid = isNumber(odometer) && isNumber(gallons) && isNumber(totalCost)

  return (
    <div className="new-fillup">
      <div className="card confirm-panel">
        <h3>New fill-up</h3>
        <label>
          Date
          <CalendarDisplay value={date} onChange={setDate} />
        </label>
        <div className="review-fields">
          <label>
            Odometer (miles)
            <OdometerDisplay value={odometer} onChange={setOdometer} autoFocus />
          </label>
          <label>
            Gallons
            <GallonsDisplay value={gallons} onChange={setGallons} />
          </label>
          <label>
            Total cost ($)
            <RegisterDisplay value={totalCost} onChange={setTotalCost} />
          </label>
          <div className="confirm-price-per-gal">
            <span className="confirm-price-per-gal-label">Price/gal</span>
            <CalculatorDisplay
              value={
                isNumber(gallons) && isNumber(totalCost)
                  ? `$${(parseFloat(totalCost) / parseFloat(gallons)).toFixed(3)}`
                  : '—'
              }
            />
          </div>
        </div>
        {saveError && <p className="scan-warning">{saveError}</p>}
        <div className="camera-actions">
          <button className="btn btn-secondary" disabled={saving} onClick={onDone}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={saving || !valid} onClick={save}>
            {saving ? 'Saving…' : 'Save fill-up'}
          </button>
        </div>
      </div>
    </div>
  )
}
