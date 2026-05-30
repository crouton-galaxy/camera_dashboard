import React from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Legend,
} from 'recharts'

const COMPARE_METRICS = [
  { key: 'crashes',       label: 'Total Crashes',    format: v => v?.toLocaleString() ?? '—', color: '#e85d2b' },
  { key: 'totalCameras',  label: 'Total Cameras',    format: v => v?.toFixed(0) ?? '—',       color: '#f0c040' },
  { key: 'camerasPer1000',label: 'Cameras / 1k',     format: v => v?.toFixed(2) ?? '—',       color: '#4a90d9' },
  { key: 'crashGapScore', label: 'Crashes / Camera', format: v => v?.toFixed(1) ?? '—',       color: '#c93030' },
  { key: 'incomeWeekly',  label: 'Med. Income /wk',  format: v => v ? `$${Math.round(v)}` : '—', color: '#2d9b6f' },
  { key: 'pctNoVehicle',  label: 'No Vehicle %',     format: v => v?.toFixed(1) + '%' ?? '—', color: '#9b59b6' },
  { key: 'totalTransitInfra', label: 'Transit Infra',format: v => v?.toFixed(0) ?? '—',       color: '#1abc9c' },
  { key: 'population',    label: 'Population',       format: v => v?.toLocaleString() ?? '—', color: '#95a5a6' },
]

const RADAR_METRICS = [
  { key: 'crashes',       label: 'Crashes',   invert: false },
  { key: 'totalCameras',  label: 'Cameras',   invert: false },
  { key: 'camerasPer1000',label: 'Cams/1k',   invert: false },
  { key: 'incomeWeekly',  label: 'Income',    invert: false },
  { key: 'pctNoVehicle',  label: 'No Car%',   invert: false },
  { key: 'totalTransitInfra', label: 'Transit', invert: false },
]

const SUBURB_COLOURS = ['#e85d2b', '#4a90d9', '#2d9b6f']

function norm(val, allData, key) {
  const vals = allData.map(d => d[key]).filter(v => v !== null && !isNaN(v))
  const min = Math.min(...vals), max = Math.max(...vals)
  if (max === min) return 50
  return Math.round(((val - min) / (max - min)) * 100)
}

export default function ComparePanel({ pinnedSuburbs, allData, onUnpin, onClose }) {
  if (!pinnedSuburbs.length) return null

  const radarData = RADAR_METRICS.map(({ key, label }) => {
    const entry = { metric: label }
    pinnedSuburbs.forEach((d, i) => {
      entry[`s${i}`] = norm(d[key] ?? 0, allData, key)
    })
    return entry
  })

  return (
    <div className="detail-panel h-full flex flex-col bg-slate border-l border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="text-xs font-mono text-accent uppercase tracking-widest mb-1">Compare Suburbs</div>
          <div className="flex items-center gap-2 flex-wrap">
            {pinnedSuburbs.map((d, i) => (
              <span key={d.suburb}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: SUBURB_COLOURS[i] + '22', color: SUBURB_COLOURS[i], border: `1px solid ${SUBURB_COLOURS[i]}44` }}>
                {d.suburbDisplay}
                <button onClick={() => onUnpin(d.suburb)} className="opacity-60 hover:opacity-100 text-xs leading-none">✕</button>
              </span>
            ))}
          </div>
        </div>
        <button onClick={onClose} className="text-muted hover:text-paper transition-colors text-lg ml-3">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Radar */}
        <div>
          <div className="text-xs font-mono text-muted uppercase tracking-wider mb-2">Radar Profile</div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
                <PolarGrid stroke="#3a4055" />
                <PolarAngleAxis dataKey="metric"
                  tick={{ fill:'#9ca3af', fontSize:9, fontFamily:'DM Sans' }} />
                {pinnedSuburbs.map((d, i) => (
                  <Radar key={d.suburb}
                    name={d.suburbDisplay}
                    dataKey={`s${i}`}
                    stroke={SUBURB_COLOURS[i]}
                    fill={SUBURB_COLOURS[i]}
                    fillOpacity={0.15}
                    strokeWidth={1.5}
                  />
                ))}
                <Legend
                  wrapperStyle={{ fontSize: 10, color: '#9ca3af' }}
                  iconSize={8}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side-by-side stat table */}
        <div>
          <div className="text-xs font-mono text-muted uppercase tracking-wider mb-2">Head-to-Head</div>

          {/* Column headers */}
          <div className="grid gap-1 mb-1"
            style={{ gridTemplateColumns: `1fr ${pinnedSuburbs.map(() => 'auto').join(' ')}` }}>
            <div />
            {pinnedSuburbs.map((d, i) => (
              <div key={d.suburb} className="text-xs font-medium text-right"
                style={{ color: SUBURB_COLOURS[i] }}>
                {d.suburbDisplay.split(' ')[0]}
              </div>
            ))}
          </div>

          {/* Rows */}
          {COMPARE_METRICS.map(({ key, label, format }) => {
            // Find which suburb has the best (highest or lowest) value
            const vals = pinnedSuburbs.map(d => d[key])
            const validVals = vals.filter(v => v !== null && !isNaN(v))
            const maxVal = validVals.length ? Math.max(...validVals) : null

            return (
              <div key={key}
                className="grid gap-1 py-1.5 border-b border-white/5"
                style={{ gridTemplateColumns: `1fr ${pinnedSuburbs.map(() => 'auto').join(' ')}` }}>
                <span className="text-xs text-muted">{label}</span>
                {pinnedSuburbs.map((d, i) => {
                  const val = d[key]
                  const isBest = val !== null && val === maxVal && validVals.length > 1
                  return (
                    <span key={d.suburb}
                      className={`font-mono text-xs text-right ${isBest ? 'font-bold' : ''}`}
                      style={{ color: isBest ? SUBURB_COLOURS[i] : '#9ca3af' }}>
                      {format(val)}
                    </span>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* LGA & transport */}
        <div>
          <div className="text-xs font-mono text-muted uppercase tracking-wider mb-2">Transport Access</div>
          {[
            { key: 'metroTrain', label: 'Metro lines' },
            { key: 'vlineTrain', label: 'V/Line' },
            { key: 'tramStops',  label: 'Tram stops' },
            { key: 'busRoutes',  label: 'Bus routes' },
          ].map(({ key, label }) => (
            <div key={key}
              className="grid gap-1 py-1.5 border-b border-white/5"
              style={{ gridTemplateColumns: `1fr ${pinnedSuburbs.map(() => 'auto').join(' ')}` }}>
              <span className="text-xs text-muted">{label}</span>
              {pinnedSuburbs.map((d, i) => (
                <span key={d.suburb} className="font-mono text-xs text-right"
                  style={{ color: (d[key] || 0) > 0 ? SUBURB_COLOURS[i] : '#4b5563' }}>
                  {d[key] ?? 0}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* LGA */}
        <div className="grid gap-1"
          style={{ gridTemplateColumns: `1fr ${pinnedSuburbs.map(() => 'auto').join(' ')}` }}>
          <span className="text-xs text-muted">LGA</span>
          {pinnedSuburbs.map((d, i) => (
            <span key={d.suburb} className="text-xs text-right" style={{ color: SUBURB_COLOURS[i] }}>
              {d.lga || '—'}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
