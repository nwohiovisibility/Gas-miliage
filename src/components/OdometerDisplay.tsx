/*
Filename: OdometerDisplay.tsx
Last Edit Date: 2026-08-30 EST
Version: 1.1
*/
interface Props {
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
}

export default function OdometerDisplay({ value, onChange, autoFocus }: Props) {
  const digits = value.replace(/[^0-9]/g, '').split('')

  return (
    <div className="odometer-field">
      <div className="odometer-display" aria-hidden="true">
        {digits.length === 0 ? (
          <span className="odometer-digit odometer-placeholder">0</span>
        ) : (
          digits.map((digit, i) => (
            <span key={i} className="odometer-digit">
              {digit}
            </span>
          ))
        )}
      </div>
      <input
        type="number"
        inputMode="decimal"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="digit-field-input"
        aria-label="Odometer reading in miles"
      />
    </div>
  )
}
