import { useId, useRef, useState } from 'react'

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
  const gradientId = useId()
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)

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

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${height - padding} L ${coords[0].x.toFixed(1)} ${height - padding} Z`

  function pointerToIndex(clientX: number) {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const relX = ((clientX - rect.left) / rect.width) * width
    let closest = 0
    let closestDist = Infinity
    coords.forEach((c, i) => {
      const dist = Math.abs(c.x - relX)
      if (dist < closestDist) {
        closestDist = dist
        closest = i
      }
    })
    return closest
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    setHover(pointerToIndex(e.clientX))
  }

  const active = hover !== null ? coords[hover] : null
  const tooltipRight = active ? active.x > width - 70 : false

  return (
    <svg
      ref={svgRef}
      className="line-chart"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerMove}
      onPointerLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        className="chart-baseline"
      />

      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={hover === i ? 5 : 4} fill={color} className="chart-point" />
      ))}

      {active && (
        <g pointerEvents="none">
          <line x1={active.x} y1={padding} x2={active.x} y2={height - padding} className="chart-crosshair" />
          <circle cx={active.x} cy={active.y} r={6.5} fill="none" stroke={color} strokeWidth={1.5} />
        </g>
      )}

      <text x={padding} y={height - 4} className="chart-axis-label">
        {coords[0].label}
      </text>
      <text x={width - padding} y={height - 4} textAnchor="end" className="chart-axis-label">
        {coords[coords.length - 1].label}
      </text>

      {!active && (
        <text x={width - padding} y={padding} textAnchor="end" className="chart-axis-label">
          max {max.toFixed(1)}
          {unit}
        </text>
      )}

      {active && (
        <g pointerEvents="none" transform={`translate(${tooltipRight ? active.x - 8 : active.x + 8}, ${padding + 2})`}>
          <text textAnchor={tooltipRight ? 'end' : 'start'} className="chart-tooltip-label">
            {active.label}
          </text>
          <text textAnchor={tooltipRight ? 'end' : 'start'} y={13} className="chart-tooltip-value">
            {active.value.toFixed(1)}
            {unit}
          </text>
        </g>
      )}
    </svg>
  )
}
