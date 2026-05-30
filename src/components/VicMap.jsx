import React, { useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import { METRICS, buildQuantileStops, quantileNorm } from '../data/config'

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
}

function blendHex(a, b, t) {
  const [r1,g1,b1] = hexToRgb(a)
  const [r2,g2,b2] = hexToRgb(b)
  const r = Math.round(r1+(r2-r1)*t)
  const g = Math.round(g1+(g2-g1)*t)
  const bl= Math.round(b1+(b2-b1)*t)
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl.toString(16).padStart(2,'0')}`
}

function interpolateColor(scale, t) {
  if (t === null || isNaN(t)) return '#2a2f3e'
  const clamped = Math.max(0, Math.min(1, t))
  const idx = clamped * (scale.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.min(scale.length - 1, lo + 1)
  return blendHex(scale[lo], scale[hi], idx - lo)
}

function FitBounds({ geoData }) {
  const map = useMap()
  useEffect(() => {
    if (!geoData) return
    try {
      const bounds = L.geoJSON(geoData).getBounds()
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [10, 10] })
    } catch(_) {}
  }, [geoData, map])
  return null
}

const PINNED_COLOURS = ['#e85d2b', '#4a90d9', '#2d9b6f']

export default function VicMap({
  geoData, bySuburb, metricKey, selectedSuburb,
  pinnedSuburbs, // Set of pinned suburb keys (compare mode)
  onSuburbClick, filteredSuburbs,
}) {
  const geoRef = useRef(null)
  const metric = METRICS.find(m => m.key === metricKey) || METRICS[0]

  // Build quantile stops from the current dataset — fixes the colour contrast issue
  const quantileStops = useMemo(() => {
    const vals = Object.values(bySuburb).map(d => d[metricKey]).filter(v => v !== null && !isNaN(v))
    return buildQuantileStops(vals, metric.colorScale)
  }, [bySuburb, metricKey, metric.colorScale])

  const getColor = (suburbKey) => {
    const d = bySuburb[suburbKey]
    if (!d) return '#2a2f3e'
    const val = d[metricKey]
    if (val === null || val === undefined) return '#2a2f3e'
    const t = quantileNorm(val, quantileStops)
    if (t === null) return '#2a2f3e'
    return interpolateColor(metric.colorScale, t)
  }

  const style = (feature) => {
    const name = (feature.properties.vic_loca_2 || '').toUpperCase()
    const isSelected = name === selectedSuburb
    const isPinned   = pinnedSuburbs && pinnedSuburbs.has(name)
    const isFiltered = filteredSuburbs ? filteredSuburbs.has(name) : true
    return {
      fillColor: getColor(name),
      fillOpacity: isFiltered ? (isSelected || isPinned ? 1 : 0.85) : 0.12,
      color: isPinned ? '#f0c040' : isSelected ? '#f0c040' : '#0a0c10',
      weight: (isPinned || isSelected) ? 2.5 : 0.3,
      opacity: 1,
    }
  }

  const onEachFeature = (feature, layer) => {
    const name = (feature.properties.vic_loca_2 || '').toUpperCase()
    const d = bySuburb[name]

    layer.on({
      mouseover(e) {
        e.target.setStyle({ weight: 2, color: '#f0c040', fillOpacity: 0.95 })
        e.target.bringToFront()
        const val = d ? d[metricKey] : null
        const formatted = val !== null && val !== undefined ? metric.format(val) : 'No data'
        e.target.bindTooltip(
          `<div class="suburb-tooltip">
            <strong>${d?.suburbDisplay || name}</strong><br/>
            ${metric.shortLabel}: <span style="color:#f0c040">${formatted}</span>
            ${d?.lga ? `<br/><span style="color:#9ca3af;font-size:10px">${d.lga}</span>` : ''}
          </div>`,
          { sticky: true, className: 'leaflet-tooltip-custom' }
        ).openTooltip()
      },
      mouseout(e) {
        if (geoRef.current) geoRef.current.resetStyle(e.target)
        e.target.closeTooltip()
      },
      click() { if (d) onSuburbClick(name) },
    })
  }

  const pinnedKey = pinnedSuburbs ? [...pinnedSuburbs].sort().join(',') : ''
  const key = `${metricKey}-${selectedSuburb}-${pinnedKey}-${filteredSuburbs ? 'f' : 'a'}`

  return (
    <MapContainer
      center={[-37.0, 144.5]} zoom={7}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors'
        maxZoom={18}
      />
      {geoData && (
        <GeoJSON key={key} ref={geoRef} data={geoData} style={style} onEachFeature={onEachFeature} />
      )}
      {geoData && <FitBounds geoData={geoData} />}
    </MapContainer>
  )
}
