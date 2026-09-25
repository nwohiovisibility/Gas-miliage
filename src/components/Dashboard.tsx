/*
Filename: Dashboard.tsx
Last Edit Date: 2026-09-25 EST
Purpose: Summary stat cards and MPG/cost charts, with drill-down detail per stat.
*/
import { useState } from 'react'
import type { FillUp } from '../types'
import { computeTotals, withMpg } from '../stats'
import { formatCurrency } from '../format'
import LineChart from './LineChart'
import StatDetail from './StatDetail'

interface Props {
  fillUps: FillUp[]
}

interface Detail {
  title: string
  rows: { date: string; value: string }[]
}

export default function Dashboard({ fillUps }: Props) {
  const [detail, setDetail] = useState<Detail | null>(null)
  const totals = computeTotals(fillUps)
  const rows = withMpg(fillUps)
  const rowsNewestFirst = rows.slice().reverse()

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

  if (detail) {
    return <StatDetail title={detail.title} rows={detail.rows} onBack={() => setDetail(null)} />
  }

  return (
    <div className="dashboard">
      <div className="stat-grid">
        <StatCard
          icon="💰"
          label="Total Spent"
          value={formatCurrency(totals.totalSpent)}
          onClick={() =>
            setDetail({
              title: 'Total Spent — per fill-up',
              rows: rowsNewestFirst.map((r) => ({ date: r.date, value: formatCurrency(r.totalCost) }))
            })
          }
        />
        <StatCard
          icon="⛽"
          label="Total Gallons"
          value={totals.totalGallons.toFixed(1)}
          onClick={() =>
            setDetail({
              title: 'Total Gallons — per fill-up',
              rows: rowsNewestFirst.map((r) => ({ date: r.date, value: `${r.gallons.toFixed(3)} gal` }))
            })
          }
        />
        <StatCard
          icon="📈"
          label="Average MPG"
          value={totals.averageMpg ? totals.averageMpg.toFixed(1) : '—'}
          accent="mpg"
          onClick={() =>
            setDetail({
              title: 'MPG — per fill-up',
              rows: rowsNewestFirst
                .filter((r) => r.mpg !== undefined)
                .map((r) => ({ date: r.date, value: `${(r.mpg as number).toFixed(1)} mpg` }))
            })
          }
        />
        <StatCard
          icon="💵"
          label="Cost / Mile"
          value={totals.costPerMile ? `$${totals.costPerMile.toFixed(3)}` : '—'}
          accent="cost"
          onClick={() =>
            setDetail({
              title: 'Cost / Mile — per fill-up',
              rows: rowsNewestFirst
                .filter((r) => r.milesSincePrev && r.milesSincePrev > 0)
                .map((r) => ({
                  date: r.date,
                  value: `$${(r.totalCost / (r.milesSincePrev as number)).toFixed(3)}/mi`
                }))
            })
          }
        />
        <StatCard
          icon="🛣️"
          label="Miles Tracked"
          value={totals.totalMiles.toLocaleString()}
          onClick={() =>
            setDetail({
              title: 'Odometer — per fill-up',
              rows: rowsNewestFirst.map((r) => ({ date: r.date, value: `${r.odometer.toLocaleString()} mi` }))
            })
          }
        />
        <StatCard
          icon="🧾"
          label="Fill-Ups"
          value={String(totals.fillUpCount)}
          onClick={() =>
            setDetail({
              title: 'Fill-Ups',
              rows: rowsNewestFirst.map((r) => ({
                date: r.date,
                value: `${r.gallons.toFixed(3)} gal · ${formatCurrency(r.totalCost)}`
              }))
            })
          }
        />
      </div>

      <section className="card">
        <h3>MPG over time</h3>
        <LineChart points={mpgPoints} color="var(--mpg-color)" formatValue={(v) => `${v.toFixed(1)} mpg`} />
      </section>

      <section className="card">
        <h3>Cost per fill-up</h3>
        <LineChart points={costPoints} color="var(--cost-color)" formatValue={formatCurrency} />
      </section>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
  onClick
}: {
  icon: string
  label: string
  value: string
  accent?: 'mpg' | 'cost'
  onClick: () => void
}) {
  return (
    <button className={`stat-card${accent ? ` stat-card-${accent}` : ''}`} onClick={onClick}>
      <span className="stat-icon">{icon}</span>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </button>
  )
}

function shortDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
