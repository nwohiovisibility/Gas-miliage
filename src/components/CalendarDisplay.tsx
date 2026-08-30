/*
Filename: CalendarDisplay.tsx
Last Edit Date: 2026-08-30 EST
Version: 1.3
*/
import { useRef } from 'react'
interface Props {
  value: string
  onChange: (value: string) => void
}

const MONTH_NAMES = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC'
]

export default function CalendarDisplay({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [y, m, d] = value.split('-').map(Number)
  const valid = Boolean(y && m && d)

  // Clicking most of a native date input's own text area just moves the
  // caret rather than opening the picker in some browsers — showPicker()
  // guarantees it opens no matter where on our overlay was tapped.
  function openPicker() {
    inputRef.current?.showPicker?.()
  }

  return (
    <div className="calendar-field" onClick={openPicker}>
      <div className="calendar-display" aria-hidden="true">
        {valid ? (
          <>
            <div className="calendar-page">
              <div className="calendar-page-header">{MONTH_NAMES[m - 1]}</div>
              <div className="calendar-page-body">{m}</div>
            </div>
            <div className="calendar-page">
              <div className="calendar-page-header">DAY</div>
              <div className="calendar-page-body">{d}</div>
            </div>
            <div className="calendar-page calendar-page-year">
              <div className="calendar-page-header">YEAR</div>
              <div className="calendar-page-body">{y}</div>
            </div>
          </>
        ) : (
          <div className="calendar-page calendar-page-placeholder">
            <div className="calendar-page-header">DATE</div>
            <div className="calendar-page-body">?</div>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="calendar-field-input"
        aria-label="Fill-up date"
      />
    </div>
  )
}
