import React, { useState } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Label,
} from 'recharts'

// Colour dots by dominant transit mode
function modeColor(d) {
  if (d.hasMetroTrain) return '#4a90d9'
  if (d.hasTram)       return '#2d9b6f'
  if (d.hasVline)      return '#f0c040'
  if (d.hasBus)        return '#e85d2b'
  return '#6b7280'
}

const CustomDot = ({ cx, cy, payload, selectedSuburb }) => {
  const isSelected = payload.suburb === selectedSuburb
  return (
    <circle cx={cx} cy={cy}
      r={isSelected ? 7 : 3.5}
      fill={isSelected ? '#f0c040' : modeColor(payload)}
      fillOpacity={isSelected ? 1 : 0.7}
      stroke={isSelected ? '#f0c040' : 'none'}
      strokeWidth={1.5}
      style={{ cursor: 'pointer' }}
    />
  )
}

const CustomTooltip = ({ active, payload, xMode }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="bg-slate border border-white/10 rounded-lg p-3 text-xs shadow-xl min-w-[170px]">
      <div className="font-semibold text-paper mb-1">{d.suburbDisplay}</div>
      <div className="text-muted mb-1.5">{d.lga}</div>
      <div className="space-y-0.5">
        <div>Total cameras: <span className="text-highlight font-mono">{d.totalCameras ?? '—'}</span></div>
        <div>Transit infra: <span className="text-paper font-mono">{d.totalTransitInfra ?? '—'}</span></div>
        <div className="pt-1 mt-1 border-t border-white/10 grid grid-cols-2 gap-x-3 gap-y-0.5">
          <div>Metro lines: <span className="font-mono text-blue-400">{d.metroTrain ?? 0}</span></div>
          <div>Tram stops: <span className="font-mono text-safe">{d.tramStops ?? 0}</span></div>
          <div>Bus routes: <span className="font-mono text-accent">{d.busRoutes ?? 0}</span></div>
          <div>V/Line: <span className="font-mono text-highlight">{d.vlineTrain ?? 0}</span></div>
        </div>
      </div>
    </div>
  )
}

const X_MODES = [
  { key: 'totalTransitInfra', label: 'All transit',   axisLabel: 'Total transit infrastructure (routes + stops + lines)' },
  { key: 'busRoutes',         label: 'Bus routes',    axisLabel: 'Bus routes' },
  { key: 'tramStops',         label: 'Tram stops',    axisLabel: 'Tram stops' },
  { key: 'metroTrain',        label: 'Metro lines',   axisLabel: 'Metro train lines' },
  { key: 'vlineTrain',        label: 'V/Line',        axisLabel: 'V/Line services' },
]

const MODE_LEGEND = [
  { label: 'Has Metro', color: '#4a90d9' },
  { label: 'Has Tram',  color: '#2d9b6f' },
  { label: 'Has V/Line',color: '#f0c040' },
  { label: 'Bus only',  color: '#e85d2b' },
  { label: 'No transit',color: '#6b7280' },
]

export default function TransitScatter({ data, selectedSuburb, onSuburbClick }) {
  const [xMode, setXMode] = useState('totalTransitInfra')

  const xDef = X_MODES.find(m => m.key === xMode)

  const chartData = data.filter(d =>
    d.totalCameras !== null &&
    d[xMode] !== null
  )

  const meanX = chartData.reduce((s,d) => s + (d[xMode]||0), 0) / (chartData.length||1)
  const meanY = chartData.reduce((s,d) => s + (d.totalCameras||0), 0) / (chartData.length||1)

  return (
    <div className="h-full flex flex-col">
      <div className="mb-2 flex-shrink-0">
        <div className="text-xs font-mono text-muted uppercase tracking-wider">Transit Infrastructure vs Cameras</div>
        <div className="text-xs text-muted mt-0.5">Does transit access correlate with camera deployment?</div>
      </div>

      {/* X-axis mode selector */}
      <div className="flex flex-wrap gap-1.5 mb-2 flex-shrink-0">
        {X_MODES.map(({ key, label }) => (
          <button key={key} onClick={() => setXMode(key)}
            className={`text-xs px-2.5 py-0.5 rounded-full border transition-all ${
              xMode === key
                ? 'border-accent bg-accent/20 text-accent'
                : 'border-white/10 text-muted hover:text-paper'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-2 flex-shrink-0">
        {MODE_LEGEND.map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1 text-xs text-muted">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top:5, right:10, bottom:28, left:10 }}>
            <CartesianGrid stroke="#2a3045" strokeDasharray="3 3" />
            <XAxis dataKey={xMode} type="number" name={xDef.label}
              tick={{ fill:'#6b7280', fontSize:10, fontFamily:'JetBrains Mono' }}
              tickLine={false} axisLine={{ stroke:'#3a4055' }}>
              <Label value={xDef.axisLabel} offset={-12} position="insideBottom" fill="#6b7280" fontSize={9} />
            </XAxis>
            <YAxis dataKey="totalCameras" type="number" name="Total cameras"
              tick={{ fill:'#6b7280', fontSize:10, fontFamily:'JetBrains Mono' }}
              tickLine={false} axisLine={{ stroke:'#3a4055' }} width={35} />
            <Tooltip content={<CustomTooltip xMode={xMode} />} />
            <ReferenceLine x={meanX} stroke="#3a4055" strokeDasharray="4 4" />
            <ReferenceLine y={meanY} stroke="#3a4055" strokeDasharray="4 4" />
            <Scatter data={chartData}
              shape={props => <CustomDot {...props} selectedSuburb={selectedSuburb} />}
              onClick={d => onSuburbClick && onSuburbClick(d.suburb)} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="text-xs text-muted mt-1 flex-shrink-0">
        Top-left = many cameras, little transit. Bottom-right = transit-rich, few cameras.
      </div>
    </div>
  )
}
