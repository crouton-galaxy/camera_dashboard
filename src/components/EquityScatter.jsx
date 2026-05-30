import React from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Label,
} from 'recharts'

const CustomDot = (props) => {
  const { cx, cy, payload, selectedSuburb } = props
  const isSelected = payload.suburb === selectedSuburb
  // colour by income quintile
  const norm = Math.min(1, Math.max(0, (payload.incomeWeekly - 400) / 1100))
  const r = Math.round(45 + norm * (232 - 45))
  const g = Math.round(156 + norm * (90 - 156))
  const b = Math.round(111 + norm * (43 - 111))
  const color = `rgb(${r},${g},${b})`

  return (
    <circle
      cx={cx}
      cy={cy}
      r={isSelected ? 7 : 3.5}
      fill={isSelected ? '#f0c040' : color}
      fillOpacity={isSelected ? 1 : 0.7}
      stroke={isSelected ? '#f0c040' : 'none'}
      strokeWidth={1.5}
      style={{ cursor: 'pointer' }}
    />
  )
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="bg-slate border border-white/10 rounded-lg p-3 text-xs shadow-xl">
      <div className="font-semibold text-paper mb-1">{d.suburbDisplay}</div>
      <div className="text-muted">{d.lga}</div>
      <div className="mt-1.5 space-y-0.5">
        <div>Median income: <span className="text-safe font-mono">${d.incomeWeekly?.toFixed(0)}/wk</span></div>
        <div>Cameras/1k: <span className="text-highlight font-mono">{d.camerasPer1000?.toFixed(2)}</span></div>
        <div>No vehicle: <span className="text-warn font-mono">{d.pctNoVehicle?.toFixed(1)}%</span></div>
      </div>
    </div>
  )
}

export default function EquityScatter({ data, selectedSuburb, onSuburbClick }) {
  const chartData = data.filter(
    (d) =>
      d.incomeWeekly !== null &&
      d.camerasPer1000 !== null &&
      d.incomeWeekly > 0 &&
      d.camerasPer1000 < 20 &&
      d.incomeWeekly < 2500
  )

  const meanX = chartData.reduce((s, d) => s + d.incomeWeekly, 0) / (chartData.length || 1)
  const meanY = chartData.reduce((s, d) => s + d.camerasPer1000, 0) / (chartData.length || 1)

  return (
    <div className="h-full flex flex-col">
      <div className="mb-3 flex-shrink-0">
        <div className="text-xs font-mono text-muted uppercase tracking-wider">Equity Analysis</div>
        <div className="text-xs text-muted mt-0.5">Income vs. camera density — colour = income</div>
      </div>
      <div className="flex gap-3 mb-2 flex-shrink-0 text-xs text-muted items-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ background: 'rgb(45,155,111)' }} />
          Low income
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ background: 'rgb(232,90,43)' }} />
          High income
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 10, bottom: 25, left: 10 }}>
            <CartesianGrid stroke="#2a3045" strokeDasharray="3 3" />
            <XAxis
              dataKey="incomeWeekly"
              type="number"
              name="Income"
              tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: '#3a4055' }}
              tickFormatter={(v) => `$${v}`}
            >
              <Label value="Median weekly income" offset={-10} position="insideBottom" fill="#6b7280" fontSize={10} />
            </XAxis>
            <YAxis
              dataKey="camerasPer1000"
              type="number"
              name="Cameras/1k"
              tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: '#3a4055' }}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={meanX} stroke="#3a4055" strokeDasharray="4 4" />
            <ReferenceLine y={meanY} stroke="#3a4055" strokeDasharray="4 4" />
            <Scatter
              data={chartData}
              shape={(props) => <CustomDot {...props} selectedSuburb={selectedSuburb} />}
              onClick={(d) => onSuburbClick && onSuburbClick(d.suburb)}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="text-xs text-muted mt-1 flex-shrink-0">
        Top-left = low income, high camera density. Policy equity concern if pattern appears.
      </div>
    </div>
  )
}
