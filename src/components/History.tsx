/*
Filename: History.tsx
Last Edit Date: 2026-08-29 EST
Version: 1.0
*/
import { useState } from 'react'
import type { FillUp } from '../types'
import { withMpg } from '../stats'
import { deleteFillUp, updateFillUp } from '../storage'
import { formatCurrency } from '../format'

interface Props {
  fillUps: FillUp[]
  onChange: () => void
}

export default function History({ fillUps, onChange }: Props) {
  const rows = withMpg(fillUps).slice().reverse()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (fillUps.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">📋</span>
        <p>No fill-ups recorded yet.</p>
      </div>
    )
  }

  async function handleSave(id: string, updates: Partial<Omit<FillUp, 'id'>>) {
    setBusyId(id)
    setError(null)
    try {
      await updateFillUp(id, updates)
      setEditingId(null)
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this fill-up?')) return
    setBusyId(id)
    setError(null)
    try {
      await deleteFillUp(id)
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="history-list">
      {error && <p className="scan-warning">{error}</p>}
      {rows.map((row) =>
        editingId === row.id ? (
          <EditRow
            key={row.id}
            fillUp={row}
            saving={busyId === row.id}
            onCancel={() => setEditingId(null)}
            onSave={(updates) => handleSave(row.id, updates)}
          />
        ) : (
          <div key={row.id} className="history-row card">
            <div className="history-main">
              <div className="history-date">{row.date}</div>
              <div className="history-odo">{row.odometer.toLocaleString()} mi</div>
            </div>
            <div className="history-details">
              <span>{row.gallons.toFixed(2)} gal</span>
              <span>{formatCurrency(row.totalCost)}</span>
              <span>${row.pricePerGallon.toFixed(3)}/gal</span>
              {row.mpg !== undefined && <span className="history-mpg">{row.mpg.toFixed(1)} mpg</span>}
            </div>
            <div className="history-actions">
              <button className="btn-link" disabled={busyId === row.id} onClick={() => setEditingId(row.id)}>
                Edit
              </button>
              <button
                className="btn-link btn-link-danger"
                disabled={busyId === row.id}
                onClick={() => handleDelete(row.id)}
              >
                {busyId === row.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        )
      )}
    </div>
  )
}

function EditRow({
  fillUp,
  saving,
  onSave,
  onCancel
}: {
  fillUp: FillUp
  saving: boolean
  onSave: (updates: Partial<Omit<FillUp, 'id'>>) => void
  onCancel: () => void
}) {
  const [date, setDate] = useState(fillUp.date)
  const [odometer, setOdometer] = useState(String(fillUp.odometer))
  const [gallons, setGallons] = useState(String(fillUp.gallons))
  const [totalCost, setTotalCost] = useState(String(fillUp.totalCost))

  return (
    <div className="card history-edit">
      <label>
        Date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label>
        Odometer
        <input type="number" inputMode="decimal" value={odometer} onChange={(e) => setOdometer(e.target.value)} />
      </label>
      <label>
        Gallons
        <input type="number" inputMode="decimal" value={gallons} onChange={(e) => setGallons(e.target.value)} />
      </label>
      <label>
        Total cost ($)
        <input type="number" inputMode="decimal" value={totalCost} onChange={(e) => setTotalCost(e.target.value)} />
      </label>
      <div className="camera-actions">
        <button
          className="btn btn-primary"
          disabled={saving}
          onClick={() =>
            onSave({
              date,
              odometer: parseFloat(odometer),
              gallons: parseFloat(gallons),
              totalCost: parseFloat(totalCost)
            })
          }
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button className="btn btn-secondary" disabled={saving} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
