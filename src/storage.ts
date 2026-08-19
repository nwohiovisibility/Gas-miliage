import type { FillUp } from './types'
import { supabase } from './supabaseClient'

const TABLE = 'fill_ups'

interface FillUpRow {
  id: string
  date: string
  odometer: number
  gallons: number
  total_cost: number
  notes: string | null
}

function fromRow(row: FillUpRow): FillUp {
  return {
    id: row.id,
    date: row.date,
    odometer: row.odometer,
    gallons: row.gallons,
    totalCost: row.total_cost,
    notes: row.notes ?? undefined
  }
}

export async function getAllFillUps(): Promise<FillUp[]> {
  const { data, error } = await supabase.from(TABLE).select('*').order('odometer', { ascending: true })
  if (error) throw error
  return (data as FillUpRow[]).map(fromRow)
}

export async function addFillUp(fillUp: Omit<FillUp, 'id'>): Promise<FillUp> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      date: fillUp.date,
      odometer: fillUp.odometer,
      gallons: fillUp.gallons,
      total_cost: fillUp.totalCost,
      notes: fillUp.notes ?? null
    })
    .select()
    .single()
  if (error) throw error
  return fromRow(data as FillUpRow)
}

export async function updateFillUp(id: string, updates: Partial<Omit<FillUp, 'id'>>): Promise<void> {
  const patch: Partial<FillUpRow> = {}
  if (updates.date !== undefined) patch.date = updates.date
  if (updates.odometer !== undefined) patch.odometer = updates.odometer
  if (updates.gallons !== undefined) patch.gallons = updates.gallons
  if (updates.totalCost !== undefined) patch.total_cost = updates.totalCost
  if (updates.notes !== undefined) patch.notes = updates.notes ?? null

  const { error } = await supabase.from(TABLE).update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteFillUp(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

export function exportAsCsv(fillUps: FillUp[]): string {
  const rows = fillUps.slice().sort((a, b) => a.odometer - b.odometer)
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
