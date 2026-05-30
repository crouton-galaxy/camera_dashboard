import React, { useState, useMemo } from 'react'

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden w-16">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

const SORT_OPTIONS = [
  { key: 'crashesPerCapita', label: 'Crashes / 1k' },
  { key: 'crashes',          label: 'Total crashes' },
  { key: 'camerasPer1000',   label: 'Cameras / 1k' },
  { key: 'cameraToCrash',    label: 'Cameras / crash' },
]

export default function HotspotTable({ data, selectedSuburb, onSuburbClick, cameraType }) {
  const [sortKey, setSortKey] = useState('crashesPerCapita')
  const [showCount, setShowCount] = useState(20)

  // Determine which camera count field to show based on active type
  const cameraCountKey = {
    all: 'totalCameras', mobile: 'mobile', dds: 'dds', fixed: 'fixed',
  }[cameraType] || 'totalCameras'

  const cameraRateKey = {
    all: 'camerasPer1000', mobile: 'mobilePer1k', dds: 'ddsPer1k', fixed: 'fixedPer1k',
  }[cameraType] || 'camerasPer1000'

  const sorted = useMemo(() => {
    return [...data]
      .filter((d) => d[sortKey] !== null && !isNaN(d[sortKey]))
      .sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0))
      .slice(0, showCount)
  }, [data, sortKey, showCount])

  const maxCrashRate = Math.max(...sorted.map((d) => d.crashesPerCapita ?? 0))
  const maxCameraRate = Math.max(...sorted.map((d) => d[cameraRateKey] ?? 0))

  const riskColor = (val) => {
    if (val > 15) return '#c93030'
    if (val > 7)  return '#e8852b'
    return '#2d9b6f'
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <div className="text-xs font-mono text-muted uppercase tracking-wider">Crash Hotspot Ranking</div>
          <div className="text-xs text-muted mt-0.5">Suburbs ranked by selected metric</div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={showCount}
            onChange={(e) => setShowCount(Number(e.target.value))}
            className="text-xs bg-ink/50 border border-white/10 text-muted rounded px-2 py-1 outline-none"
          >
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
          </select>
        </div>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-1 mb-3 flex-shrink-0 flex-wrap">
        {SORT_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSortKey(key)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              sortKey === key
                ? 'border-accent bg-accent/20 text-accent'
                : 'border-white/10 text-muted hover:text-paper'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1.5rem_1fr_auto_auto] gap-2 px-2 mb-1 flex-shrink-0">
        <span className="text-xs font-mono text-muted">#</span>
        <span className="text-xs font-mono text-muted">Suburb</span>
        <span className="text-xs font-mono text-muted text-right">Crashes/1k</span>
        <span className="text-xs font-mono text-muted text-right">Cams/1k</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
        {sorted.map((d, i) => {
          const isSelected = d.suburb === selectedSuburb
          return (
            <div
              key={d.suburb}
              onClick={() => onSuburbClick && onSuburbClick(d.suburb)}
              className={`grid grid-cols-[1.5rem_1fr_auto_auto] gap-2 items-center px-2 py-2 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? 'bg-highlight/10 border border-highlight/30'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="text-xs font-mono text-muted">{i + 1}</span>
              <div className="min-w-0">
                <div className={`text-xs font-medium truncate ${isSelected ? 'text-highlight' : 'text-paper'}`}>
                  {d.suburbDisplay}
                </div>
                <div className="text-xs text-muted truncate">{d.lga}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className="font-mono text-xs"
                  style={{ color: riskColor(d.crashesPerCapita ?? 0) }}
                >
                  {d.crashesPerCapita?.toFixed(1) ?? '—'}
                </span>
                <MiniBar value={d.crashesPerCapita ?? 0} max={maxCrashRate} color={riskColor(d.crashesPerCapita ?? 0)} />
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-mono text-xs text-highlight">
                  {d[cameraRateKey]?.toFixed(2) ?? '—'}
                </span>
                <MiniBar value={d[cameraRateKey] ?? 0} max={maxCameraRate} color="#f0c040" />
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-xs text-muted pt-2 border-t border-white/10 mt-1 flex-shrink-0">
        Click a row to select that suburb on the map
      </div>
    </div>
  )
}
