import React from 'react'
import { METRICS, buildQuantileStops } from '../data/config'

export default function MapLegend({ metricKey, data }) {
  const metric = METRICS.find(m => m.key === metricKey)
  if (!metric) return null

  const vals = data.map(d => d[metricKey]).filter(v => v !== null && !isNaN(v))
  const stops = buildQuantileStops(vals, metric.colorScale)
  if (!stops.length) return null

  const isGap = metric.isGap

  return (
    <div className="absolute bottom-8 left-4 z-[1000] bg-ink/85 backdrop-blur-sm border border-white/10 rounded-xl p-3 min-w-[170px] shadow-2xl">
      <div className="text-xs font-mono text-muted uppercase tracking-wider mb-1.5">
        {metric.shortLabel}
      </div>
      {isGap && (
        <div className="text-xs text-warn mb-2 leading-tight">
          ⚠ High = under-surveilled
        </div>
      )}
      {/* Quantile gradient */}
      <div className="h-2.5 rounded-full mb-1.5"
        style={{ background: `linear-gradient(to right, ${metric.colorScale.join(', ')})` }} />
      <div className="flex justify-between text-xs font-mono text-muted">
        <span>{metric.format(stops[0].value)}</span>
        <span>{metric.format(stops[stops.length-1].value)}</span>
      </div>
      {/* Quartile tick marks */}
      <div className="mt-2 pt-2 border-t border-white/10 space-y-0.5">
        {stops.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-muted">
            <span className="w-3 h-2 rounded-sm flex-shrink-0" style={{ background: s.color }} />
            <span className="font-mono">{metric.format(s.value)}</span>
            {i === 0 && <span className="text-muted/50 text-xs">min</span>}
            {i === stops.length-1 && <span className="text-muted/50 text-xs">max</span>}
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-white/10">
        <div className="flex items-center gap-2 text-xs text-muted">
          <div className="w-3 h-2 rounded-sm bg-[#2a2f3e] flex-shrink-0" />
          No data
        </div>
      </div>
    </div>
  )
}
