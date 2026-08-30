/*
Filename: RegisterDisplay.tsx
Last Edit Date: 2026-08-30 EST
Version: 1.1
*/
interface Props {
  value: string
  onChange: (value: string) => void
}

export default function RegisterDisplay({ value, onChange }: Props) {
  const amount = parseFloat(value)
  const isEmpty = value.trim() === '' || isNaN(amount)
  const chars = (isEmpty ? 0 : amount).toFixed(2).split('')

  return (
    <div className="register-field">
      <div className={`register-display${isEmpty ? ' register-placeholder' : ''}`} aria-hidden="true">
        <span className="register-digit register-dollar">$</span>
        {chars.map((c, i) =>
          c === '.' ? (
            <span key={i} className="register-dot">
              .
            </span>
          ) : (
            <span key={i} className="register-digit">
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
        aria-label="Total cost in dollars"
      />
    </div>
  )
}
