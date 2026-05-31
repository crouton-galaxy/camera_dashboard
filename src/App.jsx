import React, { useState, useEffect, useMemo } from 'react'
import { useSuburbData } from './hooks/useSuburbData'
import VicMap from './components/VicMap'
import DetailPanel from './components/DetailPanel'
import ComparePanel from './components/ComparePanel'
import EffectivenessScatter from './components/EffectivenessScatter'
import EquityScatter from './components/EquityScatter'
import CameraTypesBar from './components/CameraTypesBar'
import TransitScatter from './components/TransitScatter'
import HotspotTable from './components/HotspotTable'
import LGAComparison from './components/LGAComparison'
import FiltersBar from './components/FiltersBar'
import SummaryCards from './components/SummaryCards'
import MapLegend from './components/MapLegend'
import LandingModal from './components/LandingModal'
import { CAMERA_TYPES } from './data/config'

const CHART_TABS = [
  { key: 'effectiveness', label: 'Effectiveness' },
  { key: 'equity',        label: 'Equity' },
  { key: 'transit',       label: 'Transit' },
  { key: 'hotspots',      label: 'Hotspots' },
  { key: 'lga',           label: 'LGA View' },
  { key: 'types',         label: 'Cam Types' },
]

const MAX_COMPARE = 3

export default function App() {
  const { data, bySuburb, lgas, loading, error } = useSuburbData()
  const [geoData, setGeoData] = useState(null)
  const [geoLoading, setGeoLoading] = useState(true)

  // Filters
  const [metricKey, setMetricKey]       = useState('camerasPer1000')
  const [selectedLga, setSelectedLga]   = useState('All')
  const [metroFilter, setMetroFilter]   = useState('All')
  const [cameraType, setCameraType]     = useState('all')
  const [coverageMode, setCoverageMode] = useState('rate') // 'rate' | 'served'
  const [minPop, setMinPop]             = useState(0)
  const [searchQuery, setSearchQuery]   = useState('')

  // Selection & compare
  const [selectedSuburb, setSelectedSuburb]   = useState(null)
  const [pinnedSuburbs, setPinnedSuburbs]       = useState([])   // array of suburb keys
  const [compareMode, setCompareMode]           = useState(false)

  const [chartTab, setChartTab] = useState('effectiveness')

  // Show landing modal unless already seen this session
  const [showModal, setShowModal] = useState(
    () => !sessionStorage.getItem('seen_landing')
  )

  const handleCameraTypeChange = (type) => {
    setCameraType(type)
    const match = CAMERA_TYPES.find(c => c.key === type)
    if (match) setMetricKey(coverageMode === 'served' ? match.resMetricKey : match.metricKey)
  }

  const handleCoverageModeChange = (mode) => {
    setCoverageMode(mode)
    const match = CAMERA_TYPES.find(c => c.key === cameraType)
    if (match) setMetricKey(mode === 'served' ? match.resMetricKey : match.metricKey)
  }

  useEffect(() => {
    fetch('/suburb-2-vic.geojson')
      .then(r => { if (!r.ok) throw new Error('GeoJSON not found'); return r.json() })
      .then(geo => { setGeoData(geo); setGeoLoading(false) })
      .catch(e => { console.error(e); setGeoLoading(false) })
  }, [])

  const filteredData = useMemo(() => {
    return data.filter(d => {
      if (selectedLga !== 'All' && d.lga !== selectedLga) return false
      if (metroFilter === 'Metro'    && !d.isMetro) return false
      if (metroFilter === 'Regional' &&  d.isMetro) return false
      if (minPop > 0 && (d.population === null || d.population < minPop)) return false
      if (searchQuery && !d.suburb.includes(searchQuery.toUpperCase())) return false
      return true
    })
  }, [data, selectedLga, metroFilter, minPop, searchQuery])

  const filteredSuburbSet = useMemo(() => {
    if (selectedLga === 'All' && metroFilter === 'All' && !searchQuery && minPop === 0) return null
    return new Set(filteredData.map(d => d.suburb))
  }, [filteredData, selectedLga, metroFilter, searchQuery, minPop])

  const selectedSuburbData = selectedSuburb ? bySuburb[selectedSuburb] : null
  const pinnedSuburbsData  = pinnedSuburbs.map(k => bySuburb[k]).filter(Boolean)

  // Click: in compare mode, pin/unpin; otherwise normal select
  const handleSuburbClick = (suburbKey) => {
    if (compareMode) {
      setPinnedSuburbs(prev => {
        if (prev.includes(suburbKey)) return prev.filter(k => k !== suburbKey)
        if (prev.length >= MAX_COMPARE) return [...prev.slice(1), suburbKey]
        return [...prev, suburbKey]
      })
    } else {
      setSelectedSuburb(prev => prev === suburbKey ? null : suburbKey)
    }
  }

  const handleUnpin = (suburbKey) => {
    setPinnedSuburbs(prev => prev.filter(k => k !== suburbKey))
  }

  // Toggle compare mode — clear state on exit
  const toggleCompareMode = () => {
    setCompareMode(prev => {
      if (prev) { setPinnedSuburbs([]); setSelectedSuburb(null) }
      return !prev
    })
  }

  // Right panel content
  const showCompare  = compareMode && pinnedSuburbs.length > 0
  const showDetail   = !compareMode && selectedSuburbData
  const showCharts   = !showCompare && !showDetail

  if (loading || geoLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-ink">
        <div className="text-center">
          <div className="font-display text-4xl text-paper mb-3">Victoria</div>
          <div className="font-display text-lg text-accent italic mb-6">Road Safety Dashboard</div>
          <div className="flex items-center gap-3 text-muted text-sm justify-center">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            Loading data…
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-ink p-8">
        <div className="max-w-md text-center">
          <div className="font-display text-2xl text-danger mb-3">Data Error</div>
          <p className="text-muted text-sm mb-4">{error}</p>
          <div className="bg-slate rounded-lg p-4 text-left text-xs font-mono text-muted">
            <p className="text-paper mb-2">Setup checklist:</p>
            <p>1. Place <span className="text-highlight">data.csv</span> in <code>/public/</code></p>
            <p>2. Place <span className="text-highlight">suburb-2-vic.geojson</span> in <code>/public/</code></p>
            <p>3. Run <span className="text-highlight">npm run dev</span></p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-ink text-paper">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/10 flex-shrink-0 bg-ink/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-lg text-paper leading-none">Victoria Road Safety</h1>
          <div className="h-6 w-px bg-white/10" />
          <div className="text-xs text-muted font-mono">
            <span className="text-paper">{filteredData.length}</span>
            <span> / {data.length} suburbs</span>
            {minPop > 0 && <span className="text-accent"> · pop ≥ {minPop.toLocaleString()}</span>}
          </div>
          {cameraType !== 'all' && (
            <div className="metric-pill bg-accent/20 text-accent">
              {CAMERA_TYPES.find(c => c.key === cameraType)?.label} ·{' '}
              {coverageMode === 'served' ? 'residents/cam' : 'cams/1k'}
            </div>
          )}
          {cameraType === 'all' && coverageMode === 'served' && (
            <div className="metric-pill bg-accent/20 text-accent">
              Residents per camera
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-muted">2020–2023 · ABS 2021</div>

          {/* Compare mode toggle */}
          <button onClick={toggleCompareMode}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
              compareMode
                ? 'bg-highlight/20 border-highlight/50 text-highlight'
                : 'bg-slate border-white/10 text-muted hover:text-paper hover:border-white/20'
            }`}>
            {compareMode
              ? `Compare (${pinnedSuburbs.length}/${MAX_COMPARE})`
              : '⊕ Compare suburbs'}
          </button>

          {selectedSuburb && !compareMode && (
            <div className="metric-pill bg-highlight/20 text-highlight">
              ● {bySuburb[selectedSuburb]?.suburbDisplay}
            </div>
          )}
        </div>
      </header>

      {/* Compare mode hint */}
      {compareMode && (
        <div className="flex items-center gap-2 px-5 py-2 bg-highlight/5 border-b border-highlight/20 flex-shrink-0">
          <span className="text-xs text-highlight">⊕ Compare mode active —</span>
          <span className="text-xs text-muted">
            click up to {MAX_COMPARE} suburbs on the map to compare them side by side.
            {pinnedSuburbs.length > 0 && ` ${pinnedSuburbs.length} selected.`}
          </span>
        </div>
      )}

      {/* Filters */}
      <FiltersBar
        metricKey={metricKey}    onMetricChange={setMetricKey}
        selectedLga={selectedLga} onLgaChange={setSelectedLga}
        lgas={lgas}
        metroFilter={metroFilter} onMetroFilterChange={setMetroFilter}
        cameraType={cameraType}   onCameraTypeChange={handleCameraTypeChange}
        coverageMode={coverageMode} onCoverageModeChange={handleCoverageModeChange}
        minPop={minPop}           onMinPopChange={setMinPop}
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
      />

      {/* Summary cards */}
      <SummaryCards data={data} filteredData={filteredData} />

      {/* Main content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative min-w-0">
          {geoData ? (
            <>
              <VicMap
                geoData={geoData}
                bySuburb={bySuburb}
                metricKey={metricKey}
                selectedSuburb={compareMode ? null : selectedSuburb}
                pinnedSuburbs={compareMode ? new Set(pinnedSuburbs) : null}
                onSuburbClick={handleSuburbClick}
                filteredSuburbs={filteredSuburbSet}
              />
              <MapLegend metricKey={metricKey} data={filteredData.length > 0 ? filteredData : data} />

              {/* Crash-gap legend overlay if that metric is active */}
              {metricKey === 'crashGapScore' && (
                <div className="absolute top-4 left-4 z-[1000] bg-ink/85 backdrop-blur-sm border border-warn/30 rounded-xl p-3 max-w-[220px] shadow-2xl">
                  <div className="text-xs font-mono text-warn uppercase tracking-wider mb-1">⚠ Crash–Camera Gap</div>
                  <div className="text-xs text-muted leading-relaxed">
                    High values = many crashes relative to cameras deployed.<br/>
                    These suburbs are potential priority areas for new camera deployment.
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center bg-slate/30">
              <div className="text-center text-muted">
                <div className="text-4xl mb-3">🗺</div>
                <p className="text-sm">Place <code className="text-highlight">suburb-2-vic.geojson</code> in <code>/public/</code></p>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-[420px] flex-shrink-0 flex flex-col border-l border-white/10 min-h-0">
          {showCompare ? (
            <ComparePanel
              pinnedSuburbs={pinnedSuburbsData}
              allData={data}
              onUnpin={handleUnpin}
              onClose={toggleCompareMode}
            />
          ) : showDetail ? (
            <DetailPanel
              suburb={selectedSuburbData}
              allData={data}
              onClose={() => setSelectedSuburb(null)}
            />
          ) : (
            <div className="flex flex-col h-full min-h-0">
              <div className="flex border-b border-white/10 flex-shrink-0 overflow-x-auto">
                {CHART_TABS.map(({ key, label }) => (
                  <button key={key} onClick={() => setChartTab(key)}
                    className={`flex-shrink-0 px-3 py-2.5 text-xs font-medium transition-all whitespace-nowrap ${
                      chartTab === key
                        ? 'text-accent border-b-2 border-accent'
                        : 'text-muted hover:text-paper'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex-1 min-h-0 p-4 overflow-hidden">
                {chartTab === 'effectiveness' && (
                  <EffectivenessScatter data={filteredData} selectedSuburb={selectedSuburb} onSuburbClick={handleSuburbClick} />
                )}
                {chartTab === 'equity' && (
                  <EquityScatter data={filteredData} selectedSuburb={selectedSuburb} onSuburbClick={handleSuburbClick} />
                )}
                {chartTab === 'transit' && (
                  <TransitScatter data={filteredData} selectedSuburb={selectedSuburb} onSuburbClick={handleSuburbClick} />
                )}
                {chartTab === 'hotspots' && (
                  <HotspotTable data={filteredData} selectedSuburb={selectedSuburb} onSuburbClick={handleSuburbClick} cameraType={cameraType} />
                )}
                {chartTab === 'lga' && (
                  <LGAComparison data={filteredData} cameraType={cameraType} />
                )}
                {chartTab === 'types' && (
                  <CameraTypesBar data={filteredData} />
                )}
              </div>
              <div className="px-4 pb-3 text-xs text-muted flex-shrink-0 border-t border-white/10 pt-2">
                {compareMode
                  ? `↖ Click suburbs to compare (${pinnedSuburbs.length}/${MAX_COMPARE} selected)`
                  : '↖ Click a suburb for its full profile · ⊕ Compare suburbs button to pin multiple'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Landing modal */}
      {showModal && <LandingModal onDismiss={() => setShowModal(false)} />}
    </div>
  )
}
