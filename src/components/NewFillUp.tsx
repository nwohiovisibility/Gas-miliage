/*
Filename: NewFillUp.tsx
Last Edit Date: 2026-08-30 EST
Version: 1.15
*/
import { useState } from 'react'
import CameraCapture from './CameraCapture'
import OdometerDisplay from './OdometerDisplay'
import RegisterDisplay from './RegisterDisplay'
import GallonsDisplay from './GallonsDisplay'
import CalculatorDisplay from './CalculatorDisplay'
import CalendarDisplay from './CalendarDisplay'
import { parseOdometerGuess, parsePumpGuess, recognizeText } from '../ocr'
import { addFillUp } from '../storage'

type Step = 'odometer' | 'odometer-review' | 'pump' | 'pump-review' | 'confirm'

interface Props {
  onDone: () => void
}

export default function NewFillUp({ onDone }: Props) {
  const [step, setStep] = useState<Step>('odometer')
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  const [odometerPhoto, setOdometerPhoto] = useState<string | null>(null)
  const [odometer, setOdometer] = useState('')

  const [pumpPhoto, setPumpPhoto] = useState<string | null>(null)
  const [gallons, setGallons] = useState('')
  const [totalCost, setTotalCost] = useState('')

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleOdometerCapture(dataUrl: string) {
    setOdometerPhoto(dataUrl)
    setScanning(true)
    setScanError(null)
    try {
      const text = await recognizeText(dataUrl)
      const guess = parseOdometerGuess(text)
      setOdometer(guess ?? '')
      if (!guess) setScanError("Couldn't read a number automatically — enter it manually below.")
    } catch {
      setScanError('OCR failed — enter the reading manually below.')
    } finally {
      setScanning(false)
      setStep('odometer-review')
    }
  }

  function handleSkipOdometer() {
    setOdometerPhoto(null)
    setScanError(null)
    setStep('odometer-review')
  }

  function handleSkipPump() {
    setPumpPhoto(null)
    setScanError(null)
    setStep('pump-review')
  }

  async function handlePumpCapture(dataUrl: string) {
    setPumpPhoto(dataUrl)
    setScanning(true)
    setScanError(null)
    try {
      const text = await recognizeText(dataUrl)
      const guess = parsePumpGuess(text)
      setGallons(guess.gallons ?? '')
      setTotalCost(guess.totalCost ?? '')
      if (!guess.gallons && !guess.totalCost) {
        setScanError("Couldn't read the pump display automatically — enter values manually below.")
      }
    } catch {
      setScanError('OCR failed — enter values manually below.')
    } finally {
      setScanning(false)
      setStep('pump-review')
    }
  }

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
        <CameraCapture
          label="Step 1 — Scan your odometer"
          onCapture={handleOdometerCapture}
          onSkip={handleSkipOdometer}
          onBack={onDone}
        />
      )}

      {step === 'odometer-review' && (
        <ReviewPanel
          photo={odometerPhoto}
          scanning={scanning}
          error={scanError}
          onRetake={() => setStep('odometer')}
        >
          <label>
            Odometer reading (miles)
            <OdometerDisplay value={odometer} onChange={setOdometer} autoFocus />
          </label>
          <button className="btn btn-primary" disabled={!odometerValid} onClick={() => setStep('pump')}>
            Next: scan pump →
          </button>
        </ReviewPanel>
      )}

      {step === 'pump' && (
        <CameraCapture
          label="Step 2 — Scan the pump display"
          onCapture={handlePumpCapture}
          onSkip={handleSkipPump}
          onBack={() => setStep('odometer-review')}
        />
      )}

      {step === 'pump-review' && (
        <ReviewPanel photo={pumpPhoto} scanning={scanning} error={scanError} onRetake={() => setStep('pump')}>
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
        </ReviewPanel>
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
            <button className="btn btn-secondary" disabled={saving} onClick={() => setStep('pump-review')}>
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
  const index = ['odometer', 'odometer-review', 'pump', 'pump-review', 'confirm'].indexOf(step)
  const stepNum = index < 2 ? 1 : index < 4 ? 2 : 3
  return (
    <div className="step-indicator">
      {[1, 2, 3].map((n) => (
        <div key={n} className={`step-dot ${n <= stepNum ? 'step-dot-active' : ''}`} />
      ))}
    </div>
  )
}

function ReviewPanel({
  photo,
  scanning,
  error,
  onRetake,
  children
}: {
  photo: string | null
  scanning: boolean
  error: string | null
  onRetake: () => void
  children: React.ReactNode
}) {
  return (
    <div className="card review-panel">
      {photo && <img src={photo} alt="captured" className="review-photo" />}
      {scanning && <p className="scanning-indicator">🔎 Reading text from photo…</p>}
      {!scanning && error && <p className="scan-warning">{error}</p>}
      {!scanning && (
        <>
          <div className="review-fields">{children}</div>
          <div className="camera-actions">
            <button className="btn btn-secondary" onClick={onRetake}>
              {photo ? 'Retake photo' : '‹ Back'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
