/*
Filename: Dashboard.tsx
Last Edit Date: 2026-08-30 EST
Version: 1.3
*/
import type { FillUp } from '../types'
import { computeTotals, withMpg } from '../stats'
import { formatCurrency } from '../format'
import LineChart from './LineChart'

interface Props {
  fillUps: FillUp[]
}

export default function Dashboard({ fillUps }: Props) {
  const totals = computeTotals(fillUps)
  const rows = withMpg(fillUps)

  const mpgPoints = rows
    .filter((r) => r.mpg !== undefined)
    .map((r) => ({ x: shortDate(r.date), y: r.mpg as number }))

  const costPoints = rows.map((r) => ({ x: shortDate(r.date), y: r.totalCost }))

  if (fillUps.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">📊</span>
        <p>No fill-ups yet.</p>
        <p>Tap "New Fill-Up" to scan your odometer and pump, and your stats will show up here.</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="stat-grid">
        <StatCard icon="💰" label="Total Spent" value={formatCurrency(totals.totalSpent)} />
        <StatCard icon="⛽" label="Total Gallons" value={totals.totalGallons.toFixed(1)} />
        <StatCard
          icon="📈"
          label="Average MPG"
          value={totals.averageMpg ? totals.averageMpg.toFixed(1) : '—'}
          accent="mpg"
        />
        <StatCard
          icon="💵"
          label="Cost / Mile"
          value={totals.costPerMile ? `$${totals.costPerMile.toFixed(3)}` : '—'}
          accent="cost"
        />
        <StatCard
          icon="⛽"
          label="Cost / Gallon"
          value={totals.costPerGallon ? formatCurrency(totals.costPerGallon) : '—'}
        />
        <StatCard icon="🛣️" label="Miles Tracked" value={totals.totalMiles.toLocaleString()} />
        <StatCard icon="🧾" label="Fill-Ups" value={String(totals.fillUpCount)} />
      </div>

      {mpgPoints.length > 1 && (
        <section className="card">
          <h3>MPG over time</h3>
          <LineChart points={mpgPoints} color="var(--mpg-color)" formatValue={(v) => `${v.toFixed(1)} mpg`} />
        </section>
      )}

      {costPoints.length > 1 && (
        <section className="card">
          <h3>Cost per fill-up</h3>
          <LineChart points={costPoints} color="var(--cost-color)" formatValue={formatCurrency} />
        </section>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent
}: {
  icon: string
  label: string
  value: string
  accent?: 'mpg' | 'cost'
}) {
  return (
    <div className={`stat-card${accent ? ` stat-card-${accent}` : ''}`}>
      <span className="stat-icon">{icon}</span>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function shortDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
