import React, { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const METRICS = [
  { key: 'avgCamerasPer1k',    label: 'Avg Cameras / 1k',    color: '#f0c040', format: (v) => v.toFixed(2) },
  { key: 'avgCrashesPerCapita',label: 'Avg Crashes / 1k',    color: '#e85d2b', format: (v) => v.toFixed(2) },
  { key: 'avgIncome',          label: 'Avg Median Income',   color: '#2d9b6f', format: (v) => `$${Math.round(v)}` },
  { key: 'avgTransitScore',    label: 'Avg Transit Score',   color: '#4a90d9', format: (v) => v.toFixed(1) },
  { key: 'avgPctNoVehicle',    label: 'Avg No Vehicle %',    color: '#9b59b6', format: (v) => v.toFixed(1) + '%' },
  { key: 'cameraToCrashRatio', label: 'Cameras / Crash',     color: '#b06be0', format: (v) => v.toFixed(2) },
]

const CustomTooltip = ({ active, payload, label, metric }) => {
  if (!active || !payload?.length) return null
  const m = METRICS.find((x) => x.key === metric)
  const val = payload[0]?.value
  return (
    <div className="bg-slate border border-white/10 rounded-lg p-3 text-xs shadow-xl">
      <div className="font-semibold text-paper mb-1">{label}</div>
      <div style={{ color: m?.color }}>
        {m?.label}: <span className="font-mono">{m?.format(val ?? 0)}</span>
      </div>
      <div className="text-muted mt-1">{payload[0]?.payload?.suburbCount} suburbs</div>
    </div>
  )
}

export default function LGAComparison({ data, cameraType }) {
  const [metric, setMetric] = useState('avgCamerasPer1k')

  const cameraRateKey = {
    all: 'camerasPer1000', mobile: 'mobilePer1k', dds: 'ddsPer1k', fixed: 'fixedPer1k',
  }[cameraType] || 'camerasPer1000'

  const chartData = useMemo(() => {
    const byLga = {}

    data.forEach((d) => {
      if (!d.lga) return
      if (!byLga[d.lga]) {
        byLga[d.lga] = {
          lga: d.lga,
          cameras: [], crashes: [], income: [],
          transit: [], noVehicle: [], cameraCrash: [],
          suburbCount: 0,
        }
      }
      const g = byLga[d.lga]
      g.suburbCount++
      if (d[cameraRateKey] !== null) g.cameras.push(d[cameraRateKey])
      if (d.crashesPerCapita !== null) g.crashes.push(d.crashesPerCapita)
      if (d.incomeWeekly !== null) g.income.push(d.incomeWeekly)
      if (d.transitScore !== null) g.transit.push(d.transitScore)
      if (d.pctNoVehicle !== null) g.noVehicle.push(d.pctNoVehicle)
      if (d.cameraToCrash !== null) g.cameraCrash.push(d.cameraToCrash)
    })

    const avg = (arr) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0

    return Object.values(byLga)
      .map((g) => ({
        lga: g.lga,
        suburbCount: g.suburbCount,
        avgCamerasPer1k:     avg(g.cameras),
        avgCrashesPerCapita: avg(g.crashes),
        avgIncome:           avg(g.income),
        avgTransitScore:     avg(g.transit),
        avgPctNoVehicle:     avg(g.noVehicle),
        cameraToCrashRatio:  avg(g.cameraCrash),
      }))
      .filter((g) => g.suburbCount >= 2)
      .sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0))
  }, [data, cameraRateKey, metric])

  const activeMetric = METRICS.find((m) => m.key === metric)
  const maxVal = Math.max(...chartData.map((d) => d[metric] ?? 0))

  return (
    <div className="h-full flex flex-col">
      <div className="mb-3 flex-shrink-0">
        <div className="text-xs font-mono text-muted uppercase tracking-wider">LGA Comparison</div>
        <div className="text-xs text-muted mt-0.5">Aggregated averages across suburbs within each LGA</div>
      </div>

      {/* Metric pills */}
      <div className="flex flex-wrap gap-1.5 mb-3 flex-shrink-0">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              metric === m.key
                ? 'border-current text-paper'
                : 'border-white/10 text-muted hover:text-paper'
            }`}
            style={metric === m.key ? { borderColor: m.color, color: m.color, backgroundColor: m.color + '22' } : {}}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 50, bottom: 5, left: 0 }}
            barSize={10}
          >
            <CartesianGrid stroke="#2a3045" strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: '#3a4055' }}
              tickFormatter={(v) => activeMetric?.format(v) ?? v}
            />
            <YAxis
              type="category"
              dataKey="lga"
              tick={{ fill: '#9ca3af', fontSize: 9, fontFamily: 'DM Sans' }}
              tickLine={false}
              axisLine={false}
              width={110}
            />
            <Tooltip content={<CustomTooltip metric={metric} />} />
            <Bar dataKey={metric} radius={[0, 3, 3, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.lga}
                  fill={activeMetric?.color ?? '#4a90d9'}
                  fillOpacity={0.7 + 0.3 * ((entry[metric] ?? 0) / (maxVal || 1))}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
