/*
Filename: StatDetail.tsx
Last Edit Date: 2026-08-30 EST
Version: 1.0
*/
interface Row {
  date: string
  value: string
}

interface Props {
  title: string
  rows: Row[]
  onBack: () => void
}

export default function StatDetail({ title, rows, onBack }: Props) {
  return (
    <div className="stat-detail">
      <button className="btn-link" onClick={onBack}>
        ‹ Back to Dashboard
      </button>
      <h3 className="stat-detail-title">{title}</h3>
      {rows.length === 0 ? (
        <p className="chart-empty">No data yet.</p>
      ) : (
        <div className="card stat-detail-list">
          {rows.map((row, i) => (
            <div key={i} className="stat-detail-row">
              <span className="stat-detail-date">{row.date}</span>
              <span className="stat-detail-value">{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
