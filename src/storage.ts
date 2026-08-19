import type { FillUp } from './types'

const STORAGE_KEY = 'gas-tracker.fillups.v1'

function read(): FillUp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(fillUps: FillUp[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fillUps))
}

export function getAllFillUps(): FillUp[] {
  return read().sort((a, b) => a.odometer - b.odometer)
}

export function addFillUp(fillUp: Omit<FillUp, 'id'>): FillUp {
  const record: FillUp = { ...fillUp, id: crypto.randomUUID() }
  const all = read()
  all.push(record)
  write(all)
  return record
}

export function updateFillUp(id: string, updates: Partial<Omit<FillUp, 'id'>>) {
  const all = read()
  const idx = all.findIndex((f) => f.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], ...updates }
  write(all)
}

export function deleteFillUp(id: string) {
  write(read().filter((f) => f.id !== id))
}

export function exportAsCsv(): string {
  const rows = getAllFillUps()
  const header = 'date,odometer,gallons,totalCost,pricePerGallon,notes'
  const lines = rows.map((r) =>
    [
      r.date,
      r.odometer,
      r.gallons,
      r.totalCost.toFixed(2),
      (r.totalCost / r.gallons).toFixed(3),
      JSON.stringify(r.notes ?? '')
    ].join(',')
  )
  return [header, ...lines].join('\n')
}
