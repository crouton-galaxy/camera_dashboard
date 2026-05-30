import React from 'react'
import { METRICS, CAMERA_TYPES, POP_PRESETS } from '../data/config'
import clsx from 'clsx'

export default function FiltersBar({
  metricKey, onMetricChange,
  selectedLga, onLgaChange, lgas,
  metroFilter, onMetroFilterChange,
  cameraType, onCameraTypeChange,
  minPop, onMinPopChange,
  searchQuery, onSearchChange,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-white/10 bg-ink/60 backdrop-blur-sm flex-shrink-0">

      {/* Camera type */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted uppercase tracking-wider whitespace-nowrap">Camera</span>
        <div className="flex items-center gap-0.5 bg-slate rounded-lg p-0.5 border border-white/10">
          {CAMERA_TYPES.map(({ key, label }) => (
            <button key={key} onClick={() => onCameraTypeChange(key)}
              className={clsx(
                'text-xs px-2.5 py-1 rounded-md transition-all duration-150 font-medium whitespace-nowrap',
                cameraType === key ? 'bg-accent text-white' : 'text-muted hover:text-paper'
              )}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-5 bg-white/10" />

      {/* Map metric */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted uppercase tracking-wider whitespace-nowrap">Map</span>
        <select value={metricKey} onChange={e => onMetricChange(e.target.value)}
          className="text-xs bg-slate border border-white/10 text-paper rounded px-2.5 py-1.5 outline-none cursor-pointer hover:border-accent/50 transition-colors min-w-[200px]">
          {METRICS.map(m => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="w-px h-5 bg-white/10" />

      {/* Population filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted uppercase tracking-wider whitespace-nowrap">Pop.</span>
        <div className="flex items-center gap-0.5 bg-slate rounded-lg p-0.5 border border-white/10">
          {POP_PRESETS.map(({ label, min }) => (
            <button key={min} onClick={() => onMinPopChange(min)}
              className={clsx(
                'text-xs px-2 py-1 rounded-md transition-all duration-150 font-medium whitespace-nowrap',
                minPop === min ? 'bg-accent text-white' : 'text-muted hover:text-paper'
              )}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-5 bg-white/10" />

      {/* LGA */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted uppercase tracking-wider">LGA</span>
        <select value={selectedLga} onChange={e => onLgaChange(e.target.value)}
          className="text-xs bg-slate border border-white/10 text-paper rounded px-2.5 py-1.5 outline-none cursor-pointer hover:border-accent/50 transition-colors min-w-[140px]">
          {lgas.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      <div className="w-px h-5 bg-white/10" />

      {/* Metro/Regional */}
      <div className="flex items-center gap-0.5 bg-slate rounded-lg p-0.5 border border-white/10">
        {['All','Metro','Regional'].map(opt => (
          <button key={opt} onClick={() => onMetroFilterChange(opt)}
            className={clsx(
              'text-xs px-3 py-1 rounded-md transition-all duration-150 font-medium',
              metroFilter === opt ? 'bg-accent text-white' : 'text-muted hover:text-paper'
            )}>
            {opt}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="ml-auto">
        <div className="relative">
          <input type="text" placeholder="Search suburb…"
            value={searchQuery} onChange={e => onSearchChange(e.target.value)}
            className="text-xs bg-slate border border-white/10 text-paper rounded px-3 py-1.5 pl-7 outline-none focus:border-accent/50 transition-colors w-40 placeholder:text-muted/50" />
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted text-xs">⌕</span>
        </div>
      </div>
    </div>
  )
}
