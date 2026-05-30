import React, { useState } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Label,
} from 'recharts'

const CustomDot = ({ cx, cy, payload, selectedSuburb }) => {
  const isSelected = payload.suburb === selectedSuburb
  return (
    <circle cx={cx} cy={cy}
      r={isSelected ? 6 : 3}
      fill={isSelected ? '#f0c040' : payload.isMetro ? '#e85d2b' : '#4a90d9'}
      fillOpacity={isSelected ? 1 : 0.65}
      stroke={isSelected ? '#f0c040' : 'none'}
      strokeWidth={1}
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
      <div className="text-muted mb-1">{d.lga}</div>
      <div className="space-y-0.5">
        <div>Total cameras: <span className="text-highlight font-mono">{d.totalCameras ?? '—'}</span></div>
        <div>Total crashes: <span className="text-accent font-mono">{d.crashes ?? '—'}</span></div>
        <div>Population: <span className="text-paper font-mono">{d.population?.toLocaleString() ?? '—'}</span></div>
        <div>Crashes/camera: <span className="text-warn font-mono">
          {d.totalCameras > 0 ? (d.crashes / d.totalCameras).toFixed(1) : '—'}
        </span></div>
      </div>
    </div>
  )
}

export default function EffectivenessScatter({ data, selectedSuburb, onSuburbClick }) {
  const [showMetroOnly, setShowMetroOnly] = useState(false)

  const chartData = data.filter(d =>
    d.totalCameras !== null && d.totalCameras > 0 &&
    d.crashes !== null &&
    (!showMetroOnly || d.isMetro)
  )

  const meanX = chartData.reduce((s,d) => s + (d.totalCameras||0), 0) / (chartData.length||1)
  const meanY = chartData.reduce((s,d) => s + (d.crashes||0), 0) / (chartData.length||1)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <div className="text-xs font-mono text-muted uppercase tracking-wider">Camera Effectiveness</div>
          <div className="text-xs text-muted mt-0.5">Total cameras vs. total crashes per suburb</div>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
          <input type="checkbox" checked={showMetroOnly}
            onChange={e => setShowMetroOnly(e.target.checked)} className="accent-accent" />
          Metro only
        </label>
      </div>
      <div className="flex gap-3 mb-2 flex-shrink-0">
        <span className="metric-pill bg-accent/20 text-accent">● Metro</span>
        <span className="metric-pill bg-blue-500/20 text-blue-400">● Regional</span>
        <span className="metric-pill bg-highlight/20 text-highlight">● Selected</span>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top:5, right:10, bottom:25, left:10 }}>
            <CartesianGrid stroke="#2a3045" strokeDasharray="3 3" />
            <XAxis dataKey="totalCameras" type="number" name="Total Cameras"
              tick={{ fill:'#6b7280', fontSize:10, fontFamily:'JetBrains Mono' }}
              tickLine={false} axisLine={{ stroke:'#3a4055' }}>
              <Label value="Total cameras" offset={-10} position="insideBottom" fill="#6b7280" fontSize={10} />
            </XAxis>
            <YAxis dataKey="crashes" type="number" name="Total Crashes"
              tick={{ fill:'#6b7280', fontSize:10, fontFamily:'JetBrains Mono' }}
              tickLine={false} axisLine={{ stroke:'#3a4055' }} width={40} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={meanX} stroke="#3a4055" strokeDasharray="4 4" />
            <ReferenceLine y={meanY} stroke="#3a4055" strokeDasharray="4 4" />
            <Scatter data={chartData}
              shape={props => <CustomDot {...props} selectedSuburb={selectedSuburb} />}
              onClick={d => onSuburbClick && onSuburbClick(d.suburb)} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="text-xs text-muted mt-1 flex-shrink-0">
        Top-left = many crashes, few cameras — deployment priority. Dashed lines = averages.
      </div>
    </div>
  )
}
