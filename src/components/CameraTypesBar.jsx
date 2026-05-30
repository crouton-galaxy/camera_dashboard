import React, { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate border border-white/10 rounded-lg p-3 text-xs shadow-xl min-w-[140px]">
      <div className="font-semibold text-paper mb-2">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono text-paper">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function CameraTypesBar({ data }) {
  const [sortBy, setSortBy] = useState('total')

  const chartData = useMemo(() => {
    const byLga = {}
    data.forEach((d) => {
      if (!d.lga) return
      if (!byLga[d.lga]) byLga[d.lga] = { lga: d.lga, mobile: 0, dds: 0, fixed: 0 }
      byLga[d.lga].mobile += d.mobile || 0
      byLga[d.lga].dds += d.dds || 0
      byLga[d.lga].fixed += d.fixed || 0
    })

    return Object.values(byLga)
      .map((r) => ({ ...r, total: r.mobile + r.dds + r.fixed }))
      .filter((r) => r.total > 0)
      .sort((a, b) => {
        if (sortBy === 'total') return b.total - a.total
        return b[sortBy] - a[sortBy]
      })
      .slice(0, 18) // top 18 LGAs for readability
  }, [data, sortBy])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <div className="text-xs font-mono text-muted uppercase tracking-wider">Camera Types by LGA</div>
          <div className="text-xs text-muted mt-0.5">Mobile vs. DDS vs. Fixed — top 18 regions</div>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-xs bg-ink/50 border border-white/10 text-muted rounded px-2 py-1 outline-none cursor-pointer hover:border-white/20"
        >
          <option value="total">Sort: Total</option>
          <option value="mobile">Sort: Mobile</option>
          <option value="dds">Sort: DDS</option>
          <option value="fixed">Sort: Fixed</option>
        </select>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, bottom: 60, left: 5 }}
            barSize={10}
          >
            <CartesianGrid stroke="#2a3045" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="lga"
              tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'DM Sans' }}
              tickLine={false}
              axisLine={{ stroke: '#3a4055' }}
              angle={-40}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: '#9ca3af', paddingTop: 4 }}
              iconType="circle"
              iconSize={8}
            />
            <Bar dataKey="mobile" name="Mobile" stackId="a" fill="#4a90d9" radius={[0, 0, 0, 0]} />
            <Bar dataKey="dds" name="DDS" stackId="a" fill="#2d9b6f" />
            <Bar dataKey="fixed" name="Fixed" stackId="a" fill="#e85d2b" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
