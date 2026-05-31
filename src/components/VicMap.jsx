import React, { useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import { METRICS, buildDivergingStops, getColorFromStops } from '../data/config'

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

export default function VicMap({
  geoData, bySuburb, metricKey,
  selectedSuburb, pinnedSuburbs,
  onSuburbClick, filteredSuburbs,
}) {
  const geoRef = useRef(null)
  const metric = METRICS.find(m => m.key === metricKey) || METRICS[0]

  // Build diverging stops anchored to dataset median
  const colorStops = useMemo(() => {
    const vals = Object.values(bySuburb)
      .map(d => d[metricKey])
      .filter(v => v !== null && !isNaN(v))
    return buildDivergingStops(vals, metric.colorScale)
  }, [bySuburb, metricKey, metric.colorScale])

  const getColor = (suburbKey) => {
    const d = bySuburb[suburbKey]
    if (!d) return '#2a2f3e'
    const val = d[metricKey]
    if (val === null || val === undefined) return '#2a2f3e'
    return getColorFromStops(val, colorStops)
  }

  const style = (feature) => {
    const name = (feature.properties.vic_loca_2 || '').toUpperCase()
    const isSelected = name === selectedSuburb
    const isPinned   = pinnedSuburbs && pinnedSuburbs.has(name)
    const isFiltered = filteredSuburbs ? filteredSuburbs.has(name) : true
    return {
      fillColor: getColor(name),
      fillOpacity: isFiltered ? (isSelected || isPinned ? 1 : 0.85) : 0.1,
      color: (isPinned || isSelected) ? '#f0c040' : '#0a0c10',
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
        const formatted = (val !== null && val !== undefined) ? metric.format(val) : 'No data'
        e.target.bindTooltip(
          `<div class="suburb-tooltip">
            <strong>${d?.suburbDisplay || name}</strong><br/>
            ${metric.shortLabel}: <span style="color:#f0c040">${formatted}</span>
            ${d?.lga ? `<br/><span style="color:#9ca3af;font-size:10px">${d.lga}</span>` : ''}
          </div>`,
          { sticky: true }
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
