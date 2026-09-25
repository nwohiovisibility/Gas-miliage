/*
Filename: NewFillUp.tsx
Last Edit Date: 2026-09-25 EST
Purpose: Three-step manual entry for a new fill-up: odometer, pump amounts, then confirm and save.
*/
import { useState } from 'react'
import OdometerDisplay from './OdometerDisplay'
import RegisterDisplay from './RegisterDisplay'
import GallonsDisplay from './GallonsDisplay'
import CalculatorDisplay from './CalculatorDisplay'
import CalendarDisplay from './CalendarDisplay'
import { addFillUp } from '../storage'

type Step = 'odometer' | 'pump' | 'confirm'

interface Props {
  onDone: () => void
}

export default function NewFillUp({ onDone }: Props) {
  const [step, setStep] = useState<Step>('odometer')

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

  const odometerValid = odometer.trim() !== '' && !isNaN(parseFloat(odometer))
  const pumpValid =
    gallons.trim() !== '' && !isNaN(parseFloat(gallons)) && totalCost.trim() !== '' && !isNaN(parseFloat(totalCost))

  return (
    <div className="new-fillup">
      <StepIndicator step={step} />

      {step === 'odometer' && (
        <EntryPanel backLabel="Cancel" onBack={onDone}>
          <label>
            Odometer reading (miles)
            <OdometerDisplay value={odometer} onChange={setOdometer} autoFocus />
          </label>
          <button className="btn btn-primary" disabled={!odometerValid} onClick={() => setStep('pump')}>
            Next: pump →
          </button>
        </EntryPanel>
      )}

      {step === 'pump' && (
        <EntryPanel backLabel="‹ Back" onBack={() => setStep('odometer')}>
          <label>
            Gallons
            <GallonsDisplay value={gallons} onChange={setGallons} />
          </label>
          <label>
            Total cost ($)
            <RegisterDisplay value={totalCost} onChange={setTotalCost} />
          </label>
          <button className="btn btn-primary" disabled={!pumpValid} onClick={() => setStep('confirm')}>
            Next: confirm →
          </button>
        </EntryPanel>
      )}

      {step === 'confirm' && (
        <div className="card confirm-panel">
          <h3>Confirm fill-up</h3>
          <label>
            Date
            <CalendarDisplay value={date} onChange={setDate} />
          </label>
          <div className="review-fields">
            <label>
              Odometer (miles)
              <OdometerDisplay value={odometer} onChange={setOdometer} />
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
                  gallons && totalCost
                    ? `$${(parseFloat(totalCost) / parseFloat(gallons)).toFixed(3)}`
                    : '—'
                }
              />
            </div>
          </div>
          {saveError && <p className="scan-warning">{saveError}</p>}
          <div className="camera-actions">
            <button className="btn btn-secondary" disabled={saving} onClick={() => setStep('pump')}>
              ‹ Back
            </button>
            <button
              className="btn btn-primary"
              disabled={saving || !odometerValid || !pumpValid}
              onClick={save}
            >
              {saving ? 'Saving…' : 'Save fill-up'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StepIndicator({ step }: { step: Step }) {
  const stepNum = ['odometer', 'pump', 'confirm'].indexOf(step) + 1
  return (
    <div className="step-indicator">
      {[1, 2, 3].map((n) => (
        <div key={n} className={`step-dot ${n <= stepNum ? 'step-dot-active' : ''}`} />
      ))}
    </div>
  )
}

function EntryPanel({
  backLabel,
  onBack,
  children
}: {
  backLabel: string
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <div className="card review-panel">
      <div className="review-fields">{children}</div>
      <div className="camera-actions">
        <button className="btn btn-secondary" onClick={onBack}>
          {backLabel}
        </button>
      </div>
    </div>
  )
}
