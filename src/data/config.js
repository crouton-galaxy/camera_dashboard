export const CSV_COLUMNS = {
  suburb: 'Suburb',
  crashes: 'Crashes Since 2020',
  population: 'Population (2021 Census)',
  mobile: 'Mobile',
  dds: 'DDS',
  fixed: 'Fixed',
  totalCameras: 'Total',
  incomeWeekly: 'Median_Personal_Inc_Weekly',
  genderRatio: 'Gender_Ratio_M_F',
  vehicles0: 'Vehicles_0',
  vehicles1: 'Vehicles_1',
  vehicles2: 'Vehicles_2',
  vehicles3: 'Vehicles_3',
  vehicles4plus: 'Vehicles_4plus',
  totalVehicles: 'Total_Vehicles',
  pctNoVehicle: 'Percentage no vehicle',
  labourForce: 'Lab_Force_Participation_Pct',
  topNonAuAncestry: 'Top_Non_AU_Ancestry_Pct',
  tramStops: 'Tram Stops',
  vlineTrain: 'V-Line Train',
  busRoutes: 'Bus Routes',
  busStops: 'Bus Stops.1',
  metroTrain: 'Metro Train',
  trainLines: 'Train Lines',
  lga: 'lgaregion',
  camerasPer1000: 'Cameras_Per_1000',
}

export function parseRow(row) {
  const num = (v) => { const n = parseFloat(v); return isNaN(n) ? null : n }

  const pop      = num(row['Population (2021 Census)'])
  const crashes  = num(row['Crashes Since 2020'])
  const cameras  = num(row['Total'])
  const camerasP1k = num(row['Cameras_Per_1000'])
  const mobile   = num(row['Mobile'])
  const dds      = num(row['DDS'])
  const fixed    = num(row['Fixed'])
  const tramStops   = num(row['Tram Stops'])
  const vlineTrain  = num(row['V-Line Train'])
  const busRoutes   = num(row['Bus Routes'])
  const busStops    = num(row['Bus Stops.1'])
  const metroTrain  = num(row['Metro Train'])
  const trainLines  = num(row['Train Lines'])
  const transitScore = calcTransitScore(row)

  const mobilePer1k = pop && mobile !== null ? (mobile / pop) * 1000 : null
  const ddsPer1k    = pop && dds    !== null ? (dds    / pop) * 1000 : null
  const fixedPer1k  = pop && fixed  !== null ? (fixed  / pop) * 1000 : null
  const cameraToCrash = cameras !== null && crashes && crashes > 0 ? cameras / crashes : null

  // Crash-to-camera gap: crashes per camera — high = under-surveilled relative to crash history
  // null if no cameras (avoid div/0) or no crashes
  const crashGapScore = cameras && cameras > 0 && crashes !== null
    ? crashes / cameras
    : null

  // Total transit infrastructure count (raw, not scored)
  const totalTransitInfra = (tramStops || 0) + (busRoutes || 0) +
    ((metroTrain || 0) > 0 ? (trainLines || 1) : 0) +
    ((vlineTrain || 0) > 0 ? 1 : 0)

  return {
    suburb: (row['Suburb'] || '').trim().toUpperCase(),
    suburbDisplay: toTitleCase((row['Suburb'] || '').trim()),
    crashes,
    population: pop,
    mobile,
    dds,
    fixed,
    totalCameras: cameras,
    incomeWeekly: num(row['Median_Personal_Inc_Weekly']),
    genderRatio:  num(row['Gender_Ratio_M_F']),
    vehicles0:    num(row['Vehicles_0']),
    vehicles1:    num(row['Vehicles_1']),
    vehicles2:    num(row['Vehicles_2']),
    vehicles3:    num(row['Vehicles_3']),
    vehicles4plus:num(row['Vehicles_4plus']),
    totalVehicles:num(row['Total_Vehicles']),
    pctNoVehicle: num(row['Percentage no vehicle']),
    labourForce:  num(row['Lab_Force_Participation_Pct']),
    topNonAuAncestry: num(row['Top_Non_AU_Ancestry_Pct']),
    tramStops,
    vlineTrain,
    busRoutes,
    busStops,
    metroTrain,
    trainLines,
    lga: (row['lgaregion'] || '').trim(),
    camerasPer1000: camerasP1k,
    // derived
    crashesPerCapita: pop && crashes !== null ? (crashes / pop) * 1000 : null,
    isMetro: (parseFloat(row['Metro Train']) || 0) > 0,
    transitScore,
    totalTransitInfra,
    mobilePer1k,
    ddsPer1k,
    fixedPer1k,
    cameraToCrash,
    crashGapScore,
    hasMetroTrain: (metroTrain || 0) > 0,
    hasVline:      (vlineTrain || 0) > 0,
    hasTram:       (tramStops  || 0) > 0,
    hasBus:        (busRoutes  || 0) > 0,
  }
}

function calcTransitScore(row) {
  const metro  = parseFloat(row['Metro Train'])  || 0
  const tram   = parseFloat(row['Tram Stops'])   || 0
  const bus    = parseFloat(row['Bus Routes'])   || 0
  const vline  = parseFloat(row['V-Line Train']) || 0
  return Math.min(10, metro * 2 + (tram > 0 ? 3 : 0) + Math.min(bus, 5) + vline)
}

export function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

// Build a quantile colour scale from data values — this is the key fix
// for the "colours too similar" problem. Instead of linear min→max
// (dominated by outliers), we spread stops across the actual data percentiles.
export function buildQuantileStops(values, colorScale) {
  const sorted = [...values].filter((v) => v !== null && !isNaN(v)).sort((a, b) => a - b)
  if (!sorted.length) return []
  const n = colorScale.length
  return colorScale.map((color, i) => {
    const idx = Math.floor((i / (n - 1)) * (sorted.length - 1))
    return { value: sorted[idx], color }
  })
}

export function quantileNorm(val, stops) {
  if (val === null || isNaN(val) || !stops.length) return null
  if (val <= stops[0].value) return 0
  if (val >= stops[stops.length - 1].value) return 1
  for (let i = 1; i < stops.length; i++) {
    if (val <= stops[i].value) {
      const lo = stops[i - 1], hi = stops[i]
      const range = hi.value - lo.value
      if (range === 0) return (i - 1) / (stops.length - 1)
      const t = (val - lo.value) / range
      return ((i - 1) + t) / (stops.length - 1)
    }
  }
  return 1
}

export const METRICS = [
  {
    key: 'camerasPer1000',
    label: 'Cameras per 1,000 residents',
    shortLabel: 'Cameras / 1k',
    colorScale: ['#1a3a6b', '#6aaed6', '#f5f3ee', '#f4a460', '#8b2500'],
    format: (v) => v?.toFixed(2) ?? '—',
    unit: 'per 1k',
  },
  {
    key: 'totalCameras',
    label: 'Total Cameras (raw count)',
    shortLabel: 'Total Cameras',
    colorScale: ['#1a3a6b', '#6aaed6', '#f5f3ee', '#f4a460', '#8b2500'],
    format: (v) => v?.toFixed(0) ?? '—',
    unit: '',
  },
  {
    key: 'mobile',
    label: 'Mobile Cameras (count)',
    shortLabel: 'Mobile Cameras',
    colorScale: ['#0a1628', '#163d6e', '#1f6eb5', '#4a98d4', '#a8d4f0'],
    format: (v) => v?.toFixed(0) ?? '—',
    unit: '',
  },
  {
    key: 'dds',
    label: 'DDS Cameras (count)',
    shortLabel: 'DDS Cameras',
    colorScale: ['#0a2012', '#165c28', '#1f9140', '#4ab86a', '#a8e8bb'],
    format: (v) => v?.toFixed(0) ?? '—',
    unit: '',
  },
  {
    key: 'fixed',
    label: 'Fixed Cameras (count)',
    shortLabel: 'Fixed Cameras',
    colorScale: ['#200e06', '#6b2a10', '#b84a1a', '#e07a48', '#f5c090'],
    format: (v) => v?.toFixed(0) ?? '—',
    unit: '',
  },
  {
    key: 'mobilePer1k',
    label: 'Mobile Cameras per 1,000 residents',
    shortLabel: 'Mobile / 1k',
    colorScale: ['#0a1628', '#163d6e', '#1f6eb5', '#4a98d4', '#a8d4f0'],
    format: (v) => v?.toFixed(2) ?? '—',
    unit: 'per 1k',
  },
  {
    key: 'ddsPer1k',
    label: 'DDS Cameras per 1,000 residents',
    shortLabel: 'DDS / 1k',
    colorScale: ['#0a2012', '#165c28', '#1f9140', '#4ab86a', '#a8e8bb'],
    format: (v) => v?.toFixed(2) ?? '—',
    unit: 'per 1k',
  },
  {
    key: 'fixedPer1k',
    label: 'Fixed Cameras per 1,000 residents',
    shortLabel: 'Fixed / 1k',
    colorScale: ['#200e06', '#6b2a10', '#b84a1a', '#e07a48', '#f5c090'],
    format: (v) => v?.toFixed(2) ?? '—',
    unit: 'per 1k',
  },
  {
    key: 'crashGapScore',
    label: '⚠ Crash–Camera Gap (crashes per camera)',
    shortLabel: 'Crash Gap',
    colorScale: ['#1a5c38', '#5dba8a', '#f5f3ee', '#e8602b', '#6b0000'],
    format: (v) => v?.toFixed(1) ?? '—',
    unit: 'crashes/cam',
    isGap: true,
  },
  {
    key: 'crashes',
    label: 'Total Crashes Since 2020',
    shortLabel: 'Total Crashes',
    colorScale: ['#1a5c38', '#5dba8a', '#f5f3ee', '#e8602b', '#6b0000'],
    format: (v) => v?.toFixed(0) ?? '—',
    unit: '',
  },
  {
    key: 'crashesPerCapita',
    label: 'Crashes per 1,000 residents',
    shortLabel: 'Crashes / 1k',
    colorScale: ['#1a5c38', '#5dba8a', '#f5f3ee', '#e8602b', '#6b0000'],
    format: (v) => v?.toFixed(2) ?? '—',
    unit: 'per 1k',
  },
  {
    key: 'cameraToCrash',
    label: 'Cameras per Crash (Surveillance Intensity)',
    shortLabel: 'Cams / Crash',
    colorScale: ['#1a0533', '#4a1a7a', '#7b3db5', '#b06be0', '#dbb8f5'],
    format: (v) => v?.toFixed(2) ?? '—',
    unit: 'ratio',
  },
  {
    key: 'transitScore',
    label: 'Transit Access Score',
    shortLabel: 'Transit Score',
    colorScale: ['#5c3a1a', '#c49060', '#f5f3ee', '#6dc44a', '#1a4a10'],
    format: (v) => v?.toFixed(1) ?? '—',
    unit: '/10',
  },
  {
    key: 'incomeWeekly',
    label: 'Median Weekly Personal Income',
    shortLabel: 'Med. Income',
    colorScale: ['#4a1a7a', '#9b6bdb', '#f5f3ee', '#5dba8a', '#1a5c38'],
    format: (v) => v ? `$${Math.round(v)}` : '—',
    unit: '$/wk',
  },
  {
    key: 'pctNoVehicle',
    label: '% Households with No Vehicle',
    shortLabel: 'Have no Vehicle %',
    colorScale: ['#1a3a6b', '#6aaed6', '#f5f3ee', '#b06be0', '#4a0a6b'],
    format: (v) => v?.toFixed(1) + '%' ?? '—',
    unit: '%',
  },
]

export const CAMERA_TYPES = [
  { key: 'all',    label: 'All Types', metricKey: 'camerasPer1000', countKey: 'totalCameras' },
  { key: 'mobile', label: 'Mobile',    metricKey: 'mobilePer1k',    countKey: 'mobile' },
  { key: 'dds',    label: 'DDS',       metricKey: 'ddsPer1k',       countKey: 'dds' },
  { key: 'fixed',  label: 'Fixed',     metricKey: 'fixedPer1k',     countKey: 'fixed' },
]

export const LGA_COLOURS = [
  '#e85d2b','#2d9b6f','#4a90d9','#f0c040',
  '#9b59b6','#e91e8c','#1abc9c','#e67e22',
  '#3498db','#e74c3c','#2ecc71','#f39c12',
]

// Population filter presets
export const POP_PRESETS = [
  { label: 'All', min: 0 },
  { label: '500+', min: 500 },
  { label: '2k+', min: 2000 },
  { label: '5k+', min: 5000 },
  { label: '10k+', min: 10000 },
  { label: '20k+', min: 20000 },
]
