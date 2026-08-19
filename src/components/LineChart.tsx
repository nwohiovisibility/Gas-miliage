interface Point {
  x: string
  y: number
}

interface Props {
  points: Point[]
  color: string
  unit?: string
  height?: number
}

export default function LineChart({ points, color, unit = '', height = 160 }: Props) {
  if (points.length === 0) {
    return <p className="chart-empty">Not enough data yet</p>
  }
  if (points.length === 1) {
    return (
      <p className="chart-empty">
        {points[0].y.toFixed(1)}
        {unit} — add another fill-up to see a trend
      </p>
    )
  }

  const width = 320
  const padding = 24
  const values = points.map((p) => p.y)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const stepX = (width - padding * 2) / (points.length - 1)
  const coords = points.map((p, i) => {
    const x = padding + i * stepX
    const y = padding + (1 - (p.y - min) / range) * (height - padding * 2)
    return { x, y, value: p.y, label: p.x }
  })

  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')

  return (
    <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
      <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={3} fill={color} />
      ))}
      <text x={padding} y={height - 4} className="chart-axis-label">
        {coords[0].label}
      </text>
      <text x={width - padding} y={height - 4} textAnchor="end" className="chart-axis-label">
        {coords[coords.length - 1].label}
      </text>
      <text x={width - padding} y={padding} textAnchor="end" className="chart-axis-label">
        max {max.toFixed(1)}
        {unit}
      </text>
    </svg>
  )
}
