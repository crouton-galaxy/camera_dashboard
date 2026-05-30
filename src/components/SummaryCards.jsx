import React from 'react'
import clsx from 'clsx'

function StatCard({ label, value, sub, trend, color = 'text-paper' }) {
  return (
    <div className="stat-card bg-slate/60 border border-white/10 rounded-xl p-4 flex flex-col gap-1">
      <div className="text-xs font-mono text-muted uppercase tracking-wider">{label}</div>
      <div className={clsx('font-display text-2xl leading-none', color)}>{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
      {trend && (
        <div className={clsx('text-xs font-mono mt-1', trend > 0 ? 'text-danger' : 'text-safe')}>
          {trend > 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  )
}

export default function SummaryCards({ data, filteredData }) {
  const d = filteredData.length > 0 ? filteredData : data
  const valid = (key) => d.filter((r) => r[key] !== null && !isNaN(r[key]))
  const sum = (key) => valid(key).reduce((s, r) => s + r[key], 0)
  const avg = (key) => {
    const v = valid(key)
    return v.length ? sum(key) / v.length : null
  }
  const med = (key) => {
    const vals = valid(key).map((r) => r[key]).sort((a, b) => a - b)
    if (!vals.length) return null
    const mid = Math.floor(vals.length / 2)
    return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2
  }

  const totalCrashes = sum('crashes')
  const totalCameras = sum('totalCameras')
  const avgCamerasPer1k = avg('camerasPer1000')
  const avgIncome = avg('incomeWeekly')
  const medCrashPerCapita = med('crashesPerCapita')
  const suburbCount = d.length

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 px-5 py-3 flex-shrink-0">
      <StatCard
        label="Suburbs"
        value={suburbCount.toLocaleString()}
        sub="in selection"
      />
      <StatCard
        label="Total Crashes"
        value={totalCrashes.toLocaleString()}
        sub="since 2020"
        color="text-danger"
      />
      <StatCard
        label="Total Cameras"
        value={totalCameras.toLocaleString()}
        sub="all types"
        color="text-highlight"
      />
      <StatCard
        label="Avg Cameras/1k"
        value={avgCamerasPer1k?.toFixed(2) ?? '—'}
        sub="residents"
        color="text-safe"
      />
      <StatCard
        label="Median Income"
        value={avgIncome ? `$${Math.round(avgIncome)}` : '—'}
        sub="weekly"
        color="text-paper"
      />
      <StatCard
        label="Med. Crashes/1k"
        value={medCrashPerCapita?.toFixed(1) ?? '—'}
        sub="residents"
        color="text-warn"
      />
    </div>
  )
}
