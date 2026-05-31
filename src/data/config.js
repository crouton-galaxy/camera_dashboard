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

  const pop        = num(row['Population (2021 Census)'])
  const crashes    = num(row['Crashes Since 2020'])
  const cameras    = num(row['Total'])
  const camerasP1k = num(row['Cameras_Per_1000'])
  const mobile     = num(row['Mobile'])
  const dds        = num(row['DDS'])
  const fixed      = num(row['Fixed'])
  const tramStops  = num(row['Tram Stops'])
  const vlineTrain = num(row['V-Line Train'])
  const busRoutes  = num(row['Bus Routes'])
  const busStops   = num(row['Bus Stops.1'])
  const metroTrain = num(row['Metro Train'])
  const trainLines = num(row['Train Lines'])

  const transitScore = calcTransitScore(row)

  const mobilePer1k = pop && mobile !== null ? (mobile / pop) * 1000 : null
  const ddsPer1k    = pop && dds    !== null ? (dds    / pop) * 1000 : null
  const fixedPer1k  = pop && fixed  !== null ? (fixed  / pop) * 1000 : null

  // Residents per camera — how many people share each camera (higher = under-surveilled)
  const residentsPerCamera = cameras && cameras > 0 && pop ? pop / cameras : null
  const mobileResPerCam    = mobile && mobile > 0 && pop  ? pop / mobile  : null
  const ddsResPerCam       = dds    && dds    > 0 && pop  ? pop / dds     : null
  const fixedResPerCam     = fixed  && fixed  > 0 && pop  ? pop / fixed   : null

  const cameraToCrash = cameras !== null && crashes && crashes > 0 ? cameras / crashes : null
  const crashGapScore = cameras && cameras > 0 && crashes !== null ? crashes / cameras : null

  const totalTransitInfra = (tramStops || 0) + (busRoutes || 0) +
    ((metroTrain || 0) > 0 ? (trainLines || 1) : 0) +
    ((vlineTrain || 0) > 0 ? 1 : 0)

  // Schools and cameras
  const schoolsTotal = num(row['Schools_Total'])
  const schoolsPrimary = num(row['Schools_Primary'])
  const schoolsSecondary = num(row['Schools_Secondary'])
  const schoolsGovt = num(row['Schools_Govt'])
  const schoolsPerCamera = cameras && cameras > 0 && schoolsTotal !== null
    ? schoolsTotal / cameras : null
  const camerasPerSchool = schoolsTotal && schoolsTotal > 0 && cameras !== null
    ? cameras / schoolsTotal : null
  
  return {
    suburb: (row['Suburb'] || '').trim().toUpperCase(),
    suburbDisplay: toTitleCase((row['Suburb'] || '').trim()),
    crashes,
    population: pop,
    mobile,
    dds,
    fixed,
    totalCameras: cameras,
    schoolsTotal,
    schoolsPrimary,
    schoolsSecondary,
    schoolsGovt,
    schoolsPerCamera,
    camerasPerSchool,
    incomeWeekly:     num(row['Median_Personal_Inc_Weekly']),
    genderRatio:      num(row['Gender_Ratio_M_F']),
    vehicles0:        num(row['Vehicles_0']),
    vehicles1:        num(row['Vehicles_1']),
    vehicles2:        num(row['Vehicles_2']),
    vehicles3:        num(row['Vehicles_3']),
    vehicles4plus:    num(row['Vehicles_4plus']),
    totalVehicles:    num(row['Total_Vehicles']),
    pctNoVehicle:     num(row['Percentage no vehicle']),
    labourForce:      num(row['Lab_Force_Participation_Pct']),
    topNonAuAncestry: num(row['Top_Non_AU_Ancestry_Pct']),
    tramStops, vlineTrain, busRoutes, busStops, metroTrain, trainLines,
    lga: (row['lgaregion'] || '').trim(),
    camerasPer1000: camerasP1k,
    // derived
    crashesPerCapita: pop && crashes !== null ? (crashes / pop) * 1000 : null,
    isMetro: (parseFloat(row['Metro Train']) || 0) > 0,
    transitScore,
    totalTransitInfra,
    mobilePer1k, ddsPer1k, fixedPer1k,
    residentsPerCamera, mobileResPerCam, ddsResPerCam, fixedResPerCam,
    cameraToCrash, crashGapScore,
    hasMetroTrain: (metroTrain || 0) > 0,
    hasVline:      (vlineTrain || 0) > 0,
    hasTram:       (tramStops  || 0) > 0,
    hasBus:        (busRoutes  || 0) > 0,
  }
}

function calcTransitScore(row) {
  const metro = parseFloat(row['Metro Train'])  || 0
  const tram  = parseFloat(row['Tram Stops'])   || 0
  const bus   = parseFloat(row['Bus Routes'])   || 0
  const vline = parseFloat(row['V-Line Train']) || 0
  return Math.min(10, metro * 2 + (tram > 0 ? 3 : 0) + Math.min(bus, 5) + vline)
}

export function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Colour scale helpers ─────────────────────────────────────────────────────
//
// Three-colour diverging scales anchored to the MEDIAN of the dataset.
// This means:
//   - The middle colour always = the median suburb
//   - Bottom 50% maps to left→mid gradient
//   - Top 50% maps to mid→right gradient
//
// Result: colour immediately communicates "above/below typical" for policy readers.

export function buildDivergingStops(values, colorScale) {
  // colorScale must have exactly 3 colours: [low, mid, high]
  const sorted = [...values].filter(v => v !== null && !isNaN(v)).sort((a, b) => a - b)
  if (!sorted.length) return []

  const min    = sorted[0]
  const max    = sorted[sorted.length - 1]
  const median = sorted[Math.floor(sorted.length / 2)]

  // 5-stop interpolation: min, Q1, median, Q3, max — gives smoother gradient
  const q1 = sorted[Math.floor(sorted.length * 0.25)]
  const q3 = sorted[Math.floor(sorted.length * 0.75)]

  const [lo, mid, hi] = colorScale
  // Blend colours between stops
  const midLo = blendHex(lo, mid, 0.5)
  const midHi = blendHex(mid, hi, 0.5)

  return [
    { value: min,    color: lo    },
    { value: q1,     color: midLo },
    { value: median, color: mid   },
    { value: q3,     color: midHi },
    { value: max,    color: hi    },
  ]
}

export function getColorFromStops(val, stops) {
  if (val === null || isNaN(val) || !stops.length) return '#2a2f3e'
  if (val <= stops[0].value) return stops[0].color
  if (val >= stops[stops.length - 1].value) return stops[stops.length - 1].color
  for (let i = 1; i < stops.length; i++) {
    if (val <= stops[i].value) {
      const lo = stops[i - 1], hi = stops[i]
      const t = (hi.value === lo.value) ? 0 : (val - lo.value) / (hi.value - lo.value)
      return blendHex(lo.color, hi.color, t)
    }
  }
  return stops[stops.length - 1].color
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
}

export function blendHex(a, b, t) {
  const [r1,g1,b1] = hexToRgb(a)
  const [r2,g2,b2] = hexToRgb(b)
  const r = Math.round(r1 + (r2-r1)*t)
  const g = Math.round(g1 + (g2-g1)*t)
  const bl= Math.round(b1 + (b2-b1)*t)
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl.toString(16).padStart(2,'0')}`
}

// ─── Metric definitions ───────────────────────────────────────────────────────
// colorScale: [low_colour, mid_colour, high_colour]
// mid anchors to the median of the dataset automatically

export const METRICS = [
  // ── Coverage rate (cameras per 1k) ──────────────────────────────────────
  {
    key: 'camerasPer1000',
    label: 'Cameras per 1,000 residents',
    shortLabel: 'Cameras / 1k',
    colorScale: ['#1a3a6b', '#f5f3ee', '#c8500a'],  // blue → neutral → orange
    format: v => v?.toFixed(2) ?? '—',
    unit: 'per 1k',
    group: 'Coverage rate',
  },
  {
    key: 'mobilePer1k',
    label: 'Mobile Cameras per 1,000 residents',
    shortLabel: 'Mobile / 1k',
    colorScale: ['#1a3a6b', '#f5f3ee', '#c8500a'],
    format: v => v?.toFixed(2) ?? '—',
    unit: 'per 1k',
    group: 'Coverage rate',
  },
  {
    key: 'ddsPer1k',
    label: 'DDS Cameras per 1,000 residents',
    shortLabel: 'DDS / 1k',
    colorScale: ['#1a3a6b', '#f5f3ee', '#c8500a'],
    format: v => v?.toFixed(2) ?? '—',
    unit: 'per 1k',
    group: 'Coverage rate',
  },
  {
    key: 'fixedPer1k',
    label: 'Fixed Cameras per 1,000 residents',
    shortLabel: 'Fixed / 1k',
    colorScale: ['#1a3a6b', '#f5f3ee', '#c8500a'],
    format: v => v?.toFixed(2) ?? '—',
    unit: 'per 1k',
    group: 'Coverage rate',
  },
  // ── Population served per camera (inverse) ───────────────────────────────
  {
    key: 'residentsPerCamera',
    label: 'Residents per Camera (population served)',
    shortLabel: 'Residents / Camera',
    colorScale: ['#1a5c38', '#f5f3ee', '#8b0000'],  // green → neutral → red (high = under-surveilled)
    format: v => v ? Math.round(v).toLocaleString() : '—',
    unit: 'residents',
    group: 'Population served',
    invertScale: true,  // flag: high value = bad (under-surveilled)
  },
  {
    key: 'mobileResPerCam',
    label: 'Residents per Mobile Camera',
    shortLabel: 'Residents / Mobile',
    colorScale: ['#1a5c38', '#f5f3ee', '#8b0000'],
    format: v => v ? Math.round(v).toLocaleString() : '—',
    unit: 'residents',
    group: 'Population served',
    invertScale: true,
  },
  {
    key: 'ddsResPerCam',
    label: 'Residents per DDS Camera',
    shortLabel: 'Residents / DDS',
    colorScale: ['#1a5c38', '#f5f3ee', '#8b0000'],
    format: v => v ? Math.round(v).toLocaleString() : '—',
    unit: 'residents',
    group: 'Population served',
    invertScale: true,
  },
  {
    key: 'fixedResPerCam',
    label: 'Residents per Fixed Camera',
    shortLabel: 'Residents / Fixed',
    colorScale: ['#1a5c38', '#f5f3ee', '#8b0000'],
    format: v => v ? Math.round(v).toLocaleString() : '—',
    unit: 'residents',
    group: 'Population served',
    invertScale: true,
  },
  // ── Raw camera counts ────────────────────────────────────────────────────
  {
    key: 'totalCameras',
    label: 'Total Cameras (raw count)',
    shortLabel: 'Total Cameras',
    colorScale: ['#1a3a6b', '#f5f3ee', '#c8500a'],
    format: v => v?.toFixed(0) ?? '—',
    unit: '',
    group: 'Camera counts',
  },
  {
    key: 'mobile',
    label: 'Mobile Cameras (count)',
    shortLabel: 'Mobile Cameras',
    colorScale: ['#1a3a6b', '#f5f3ee', '#c8500a'],
    format: v => v?.toFixed(0) ?? '—',
    unit: '',
    group: 'Camera counts',
  },
  {
    key: 'dds',
    label: 'DDS Cameras (count)',
    shortLabel: 'DDS Cameras',
    colorScale: ['#1a3a6b', '#f5f3ee', '#c8500a'],
    format: v => v?.toFixed(0) ?? '—',
    unit: '',
    group: 'Camera counts',
  },
  {
    key: 'fixed',
    label: 'Fixed Cameras (count)',
    shortLabel: 'Fixed Cameras',
    colorScale: ['#1a3a6b', '#f5f3ee', '#c8500a'],
    format: v => v?.toFixed(0) ?? '—',
    unit: '',
    group: 'Camera counts',
  },
  // ── Crash metrics ────────────────────────────────────────────────────────
  {
    key: 'crashGapScore',
    label: '⚠ Crash–Camera Gap (crashes per camera)',
    shortLabel: 'Crash Gap',
    colorScale: ['#1a5c38', '#f5f3ee', '#8b0000'],  // green=low gap → red=high gap
    format: v => v?.toFixed(1) ?? '—',
    unit: 'crashes/cam',
    group: 'Crash metrics',
    isGap: true,
    invertScale: true,
  },
  {
    key: 'crashes',
    label: 'Total Crashes Since 2020',
    shortLabel: 'Total Crashes',
    colorScale: ['#1a5c38', '#f5ef60', '#8b0000'],  // green → yellow → red
    format: v => v?.toFixed(0) ?? '—',
    unit: '',
    group: 'Crash metrics',
    invertScale: true,
  },
  {
    key: 'crashesPerCapita',
    label: 'Crashes per 1,000 residents',
    shortLabel: 'Crashes / 1k',
    colorScale: ['#1a5c38', '#f5ef60', '#8b0000'],
    format: v => v?.toFixed(2) ?? '—',
    unit: 'per 1k',
    group: 'Crash metrics',
    invertScale: true,
  },
  {
    key: 'cameraToCrash',
    label: 'Cameras per Crash (Surveillance Intensity)',
    shortLabel: 'Cams / Crash',
    colorScale: ['#8b0000', '#f5f3ee', '#1a5c38'],  // red=low → green=high
    format: v => v?.toFixed(2) ?? '—',
    unit: 'ratio',
    group: 'Crash metrics',
  },
  // ── Socioeconomic ────────────────────────────────────────────────────────
  {
    key: 'incomeWeekly',
    label: 'Median Weekly Personal Income',
    shortLabel: 'Med. Income',
    colorScale: ['#4a1a7a', '#f5f3ee', '#1a5c38'],  // purple=low → green=high
    format: v => v ? `$${Math.round(v)}` : '—',
    unit: '$/wk',
    group: 'Socioeconomic',
  },
  {
    key: 'pctNoVehicle',
    label: '% Households with No Vehicle',
    shortLabel: 'No Vehicle %',
    colorScale: ['#1a3a6b', '#f5f3ee', '#4a1a7a'],  // blue=low → purple=high
    format: v => v?.toFixed(1) + '%' ?? '—',
    unit: '%',
    group: 'Socioeconomic',
    invertScale: true,
  },
  {
    key: 'transitScore',
    label: 'Transit Access Score',
    shortLabel: 'Transit Score',
    colorScale: ['#8b0000', '#f5ef60', '#1a5c38'],  // red=none → yellow → green=high
    format: v => v?.toFixed(1) ?? '—',
    unit: '/10',
    group: 'Socioeconomic',
  },
  // ── Schools ────────────────────────────────────────────────────────
  {
  key: 'schoolsPerCamera',
  label: 'Schools per Camera',
  shortLabel: 'Schools / Camera',
  colorScale: ['#1a5c38', '#f5f3ee', '#8b0000'],
  format: v => v?.toFixed(2) ?? '—',
  unit: 'schools/cam',
  group: 'Schools & Safety',
  invertScale: true,
},
{
  key: 'camerasPerSchool',
  label: 'Cameras per School',
  shortLabel: 'Cameras / School',
  colorScale: ['#8b0000', '#f5f3ee', '#1a5c38'],
  format: v => v?.toFixed(2) ?? '—',
  unit: 'cams/school',
  group: 'Schools & Safety',
},
{
  key: 'schoolsTotal',
  label: 'Total Schools',
  shortLabel: 'Total Schools',
  colorScale: ['#1a3a6b', '#f5f3ee', '#c8500a'],
  format: v => v?.toFixed(0) ?? '—',
  unit: '',
  group: 'Schools & Safety',
},
]

// Group metrics for the dropdown
export const METRIC_GROUPS = ['Coverage rate', 'Population served', 'Camera counts', 'Crash metrics', 'Socioeconomic', 'Schools & Safety']

export const CAMERA_TYPES = [
  { key: 'all',    label: 'All Types', metricKey: 'camerasPer1000',      resMetricKey: 'residentsPerCamera' },
  { key: 'mobile', label: 'Mobile',    metricKey: 'mobilePer1k',         resMetricKey: 'mobileResPerCam'    },
  { key: 'dds',    label: 'DDS',       metricKey: 'ddsPer1k',            resMetricKey: 'ddsResPerCam'       },
  { key: 'fixed',  label: 'Fixed',     metricKey: 'fixedPer1k',          resMetricKey: 'fixedResPerCam'     },
]

export const POP_PRESETS = [
  { label: 'All',  min: 0     },
  { label: '500+', min: 500   },
  { label: '2k+',  min: 2000  },
  { label: '5k+',  min: 5000  },
  { label: '10k+', min: 10000 },
  { label: '20k+', min: 20000 },
]

export const LGA_COLOURS = [
  '#e85d2b','#2d9b6f','#4a90d9','#f0c040',
  '#9b59b6','#e91e8c','#1abc9c','#e67e22',
  '#3498db','#e74c3c','#2ecc71','#f39c12',
]
