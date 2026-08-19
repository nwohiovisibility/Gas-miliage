import { useState } from 'react'
import CameraCapture from './CameraCapture'
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

  function save() {
    addFillUp({
      date,
      odometer: parseFloat(odometer),
      gallons: parseFloat(gallons),
      totalCost: parseFloat(totalCost)
    })
    onDone()
  }

  const odometerValid = odometer.trim() !== '' && !isNaN(parseFloat(odometer))
  const pumpValid =
    gallons.trim() !== '' && !isNaN(parseFloat(gallons)) && totalCost.trim() !== '' && !isNaN(parseFloat(totalCost))

  return (
    <div className="new-fillup">
      <StepIndicator step={step} />

      {step === 'odometer' && (
        <CameraCapture label="Step 1 — Scan your odometer" onCapture={handleOdometerCapture} />
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
            <input
              type="number"
              inputMode="decimal"
              autoFocus
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              placeholder="e.g. 45231"
            />
          </label>
          <button className="btn btn-primary" disabled={!odometerValid} onClick={() => setStep('pump')}>
            Next: scan pump →
          </button>
        </ReviewPanel>
      )}

      {step === 'pump' && <CameraCapture label="Step 2 — Scan the pump display" onCapture={handlePumpCapture} />}

      {step === 'pump-review' && (
        <ReviewPanel photo={pumpPhoto} scanning={scanning} error={scanError} onRetake={() => setStep('pump')}>
          <label>
            Gallons
            <input
              type="number"
              inputMode="decimal"
              value={gallons}
              onChange={(e) => setGallons(e.target.value)}
              placeholder="e.g. 12.4"
            />
          </label>
          <label>
            Total cost ($)
            <input
              type="number"
              inputMode="decimal"
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
              placeholder="e.g. 41.63"
            />
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
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <dl className="confirm-summary">
            <dt>Odometer</dt>
            <dd>{odometer} mi</dd>
            <dt>Gallons</dt>
            <dd>{gallons}</dd>
            <dt>Total cost</dt>
            <dd>${parseFloat(totalCost || '0').toFixed(2)}</dd>
            <dt>Price/gal</dt>
            <dd>
              {gallons && totalCost
                ? `$${(parseFloat(totalCost) / parseFloat(gallons)).toFixed(3)}`
                : '—'}
            </dd>
          </dl>
          <button className="btn btn-primary" onClick={save}>
            Save fill-up
          </button>
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
          <button className="btn-link" onClick={onRetake}>
            Retake photo
          </button>
        </>
      )}
    </div>
  )
}
