import type { FillUp } from '../types'
import { computeTotals, withMpg } from '../stats'
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
        <p>No fill-ups yet.</p>
        <p>Tap "New Fill-Up" to scan your odometer and pump, and your stats will show up here.</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="stat-grid">
        <StatCard label="Total Spent" value={`$${totals.totalSpent.toFixed(2)}`} />
        <StatCard label="Total Gallons" value={totals.totalGallons.toFixed(1)} />
        <StatCard
          label="Average MPG"
          value={totals.averageMpg ? totals.averageMpg.toFixed(1) : '—'}
        />
        <StatCard
          label="Cost / Mile"
          value={totals.costPerMile ? `$${totals.costPerMile.toFixed(3)}` : '—'}
        />
        <StatCard label="Miles Tracked" value={totals.totalMiles.toLocaleString()} />
        <StatCard label="Fill-Ups" value={String(totals.fillUpCount)} />
      </div>

      <section className="card">
        <h3>MPG over time</h3>
        <LineChart points={mpgPoints} color="#22c55e" unit=" mpg" />
      </section>

      <section className="card">
        <h3>Cost per fill-up</h3>
        <LineChart points={costPoints} color="#f59e0b" unit="$" />
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function shortDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
