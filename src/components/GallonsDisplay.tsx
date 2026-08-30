/*
Filename: GallonsDisplay.tsx
Last Edit Date: 2026-08-30 EST
Version: 1.1
*/
interface Props {
  value: string
  onChange: (value: string) => void
}

export default function GallonsDisplay({ value, onChange }: Props) {
  const amount = parseFloat(value)
  const isEmpty = value.trim() === '' || isNaN(amount)
  const chars = (isEmpty ? 0 : amount).toFixed(2).split('')

  return (
    <div className="gallons-field">
      <div className={`gallons-display${isEmpty ? ' gallons-placeholder' : ''}`} aria-hidden="true">
        <span className="gallons-digit gallons-unit">💧</span>
        {chars.map((c, i) =>
          c === '.' ? (
            <span key={i} className="gallons-dot">
              .
            </span>
          ) : (
            <span key={i} className="gallons-digit">
              {c}
            </span>
          )
        )}
      </div>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="digit-field-input"
        aria-label="Gallons"
      />
    </div>
  )
}
