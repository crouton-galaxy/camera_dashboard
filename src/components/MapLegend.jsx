import React from 'react'
import { METRICS, buildDivergingStops } from '../data/config'

export default function MapLegend({ metricKey, data }) {
  const metric = METRICS.find(m => m.key === metricKey)
  if (!metric) return null

  const vals = data.map(d => d[metricKey]).filter(v => v !== null && !isNaN(v))
  const stops = buildDivergingStops(vals, metric.colorScale)
  if (!stops.length) return null

  const [lo, mid, hi] = metric.colorScale
  const median = stops[2]  // middle stop is always the median

  return (
    <div className="absolute bottom-8 left-4 z-[1000] bg-ink/90 backdrop-blur-sm border border-white/10 rounded-xl p-3 min-w-[180px] shadow-2xl">
      <div className="text-xs font-mono text-muted uppercase tracking-wider mb-1.5">
        {metric.shortLabel}
      </div>

      {metric.isGap && (
        <div className="text-xs text-warn mb-2 leading-tight">⚠ High = under-surveilled</div>
      )}
      {metric.invertScale && !metric.isGap && (
        <div className="text-xs text-muted mb-1.5 leading-tight italic">Higher = worse</div>
      )}

      {/* Three-colour gradient bar */}
      <div className="h-3 rounded-full mb-2"
        style={{ background: `linear-gradient(to right, ${lo}, ${mid}, ${hi})` }} />

      {/* Min / Median / Max labels */}
      <div className="flex justify-between text-xs font-mono text-muted mb-2">
        <span>{metric.format(stops[0].value)}</span>
        <span className="text-paper">mid</span>
        <span>{metric.format(stops[4].value)}</span>
      </div>

      {/* Key stop values */}
      <div className="space-y-1 pt-2 border-t border-white/10">
        {[
          { label: 'Min',    value: stops[0].value,  color: lo  },
          { label: 'Median', value: median?.value,   color: mid },
          { label: 'Max',    value: stops[4].value,  color: hi  },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
              <span className="text-muted">{label}</span>
            </div>
            <span className="font-mono text-paper">{metric.format(value)}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-muted pt-1">
          <div className="w-3 h-3 rounded-sm bg-[#2a2f3e] flex-shrink-0" />
          No data
        </div>
      </div>
    </div>
  )
}
