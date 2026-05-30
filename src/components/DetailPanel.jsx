import React, { useMemo } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts'

function StatRow({ label, value, sub, highlight }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-slate/50">
      <span className="text-xs text-muted leading-tight">{label}</span>
      <div className="text-right ml-4">
        <span className={`font-mono text-sm font-medium ${highlight ? 'text-highlight' : 'text-paper'}`}>
          {value ?? '—'}
        </span>
        {sub && <div className="text-xs text-muted">{sub}</div>}
      </div>
    </div>
  )
}

function CameraBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted">{label}</span>
        <span className="font-mono text-paper">{value ?? 0}</span>
      </div>
      <div className="h-1.5 bg-slate rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// Normalise a value 0–1 across all suburbs, clamped
function norm(val, allVals) {
  const filtered = allVals.filter((v) => v !== null && !isNaN(v))
  const min = Math.min(...filtered)
  const max = Math.max(...filtered)
  if (max === min) return 0.5
  return Math.max(0, Math.min(1, (val - min) / (max - min)))
}

export default function DetailPanel({ suburb, allData, onClose }) {
  if (!suburb) return null

  const d = suburb

  const radarData = useMemo(() => {
    const get = (key) => allData.map((r) => r[key]).filter((v) => v !== null && !isNaN(v))

    return [
      {
        metric: 'Safety',
        value: Math.round((1 - norm(d.crashesPerCapita, get('crashesPerCapita'))) * 100),
        fullMark: 100,
      },
      {
        metric: 'Camera\nCoverage',
        value: Math.round(norm(d.camerasPer1000, get('camerasPer1000')) * 100),
        fullMark: 100,
      },
      {
        metric: 'Income',
        value: Math.round(norm(d.incomeWeekly, get('incomeWeekly')) * 100),
        fullMark: 100,
      },
      {
        metric: 'Transit\nAccess',
        value: Math.round(norm(d.transitScore, get('transitScore')) * 100),
        fullMark: 100,
      },
      {
        metric: 'Employment',
        value: Math.round(norm(d.labourForce, get('labourForce')) * 100),
        fullMark: 100,
      },
      {
        metric: 'Car-Free\nLiving',
        value: Math.round(norm(d.pctNoVehicle, get('pctNoVehicle')) * 100),
        fullMark: 100,
      },
    ]
  }, [d, allData])

  const maxCamType = Math.max(d.mobile || 0, d.dds || 0, d.fixed || 0, 1)

  const crashRisk =
    d.crashesPerCapita !== null
      ? d.crashesPerCapita > 15
        ? { label: 'HIGH', color: 'text-danger' }
        : d.crashesPerCapita > 7
        ? { label: 'MODERATE', color: 'text-warn' }
        : { label: 'LOW', color: 'text-safe' }
      : null

  return (
    <div className="detail-panel h-full flex flex-col bg-slate border-l border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between flex-shrink-0">
        <div>
          <div className="text-xs font-mono text-accent uppercase tracking-widest mb-1">
            Suburb Detail
          </div>
          <h2 className="font-display text-xl text-paper leading-tight">{d.suburbDisplay}</h2>
          {d.lga && (
            <div className="text-xs text-muted mt-0.5">{d.lga} LGA</div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-muted hover:text-paper transition-colors text-lg leading-none mt-1"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Risk badge */}
        {crashRisk && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-ink/40 border border-white/5">
            <div className="text-xs text-muted">Crash Risk</div>
            <div className={`font-mono font-semibold text-sm ${crashRisk.color}`}>
              ● {crashRisk.label}
            </div>
            {d.crashesPerCapita && (
              <div className="ml-auto font-mono text-xs text-muted">
                {d.crashesPerCapita.toFixed(1)} per 1k
              </div>
            )}
          </div>
        )}

        {/* Radar chart */}
        <div>
          <div className="text-xs font-mono text-muted uppercase tracking-wider mb-2">
            Suburb Profile
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#3a4055" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: '#9ca3af', fontSize: 9, fontFamily: 'DM Sans' }}
                />
                <Radar
                  dataKey="value"
                  stroke="#e85d2b"
                  fill="#e85d2b"
                  fillOpacity={0.25}
                  strokeWidth={1.5}
                />
                <Tooltip
                  formatter={(v) => [`${v}/100`, '']}
                  contentStyle={{
                    background: '#1e2330',
                    border: '1px solid #3a4055',
                    borderRadius: 6,
                    fontSize: 11,
                  }}
                  labelStyle={{ color: '#f5f3ee' }}
                  itemStyle={{ color: '#e85d2b' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Camera breakdown */}
        <div>
          <div className="text-xs font-mono text-muted uppercase tracking-wider mb-3">
            Camera Deployment
          </div>
          <CameraBar label="Mobile" value={d.mobile} max={maxCamType} color="#4a90d9" />
          <CameraBar label="DDS (Point-to-Point)" value={d.dds} max={maxCamType} color="#2d9b6f" />
          <CameraBar label="Fixed" value={d.fixed} max={maxCamType} color="#e85d2b" />
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/10">
            <span className="text-xs text-muted">Cameras per 1,000 residents</span>
            <span className="font-mono text-sm text-highlight">
              {d.camerasPer1000?.toFixed(2) ?? '—'}
            </span>
          </div>
        </div>

        {/* Key stats */}
        <div>
          <div className="text-xs font-mono text-muted uppercase tracking-wider mb-2">
            Demographics
          </div>
          <StatRow
            label="Population (2021)"
            value={d.population ? d.population.toLocaleString() : null}
          />
          <StatRow
            label="Median Weekly Income"
            value={d.incomeWeekly ? `$${d.incomeWeekly.toLocaleString()}` : null}
            highlight={d.incomeWeekly > 1000}
          />
          <StatRow
            label="Labour Force Participation"
            value={d.labourForce ? `${d.labourForce.toFixed(1)}%` : null}
          />
          <StatRow
            label="Top Non-AU Ancestry"
            value={d.topNonAuAncestry ? `${d.topNonAuAncestry.toFixed(1)}%` : null}
          />
          <StatRow
            label="Households — No Vehicle"
            value={d.pctNoVehicle ? `${d.pctNoVehicle.toFixed(1)}%` : null}
          />
        </div>

        {/* Transport */}
        <div>
          <div className="text-xs font-mono text-muted uppercase tracking-wider mb-2">
            Public Transport
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Metro Lines', val: d.metroTrain || d.trainLines },
              { label: 'V-Line', val: d.vlineTrain },
              { label: 'Tram Stops', val: d.tramStops },
              { label: 'Bus Routes', val: d.busRoutes },
            ].map(({ label, val }) => (
              <div key={label} className="bg-ink/30 rounded-lg p-2.5 border border-white/5">
                <div className="text-xs text-muted">{label}</div>
                <div className="font-mono text-base text-paper mt-0.5">
                  {val !== null && val !== undefined ? val : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Crash stats */}
        <div>
          <div className="text-xs font-mono text-muted uppercase tracking-wider mb-2">
            Road Safety
          </div>
          <StatRow
            label="Crashes Since 2020"
            value={d.crashes?.toLocaleString() ?? null}
          />
          <StatRow
            label="Crashes per 1,000 residents"
            value={d.crashesPerCapita?.toFixed(2) ?? null}
          />
        </div>
      </div>
    </div>
  )
}
