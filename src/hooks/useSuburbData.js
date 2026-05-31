import { useState, useEffect, useMemo } from 'react'
import Papa from 'papaparse'
import { parseRow } from '../data/config'

export function useSuburbData() {
  const [rawData, setRawData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/data.csv')
      .then((r) => {
        if (!r.ok) throw new Error('Could not load data.csv')
        return r.text()
      })
      .then((text) => {
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
        })
        const parsed = result.data
          .map(parseRow)
          .filter((d) => d.suburb && d.suburb.length > 0)
        setRawData(parsed)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  const bySuburb = useMemo(() => {
    const map = {}
    rawData.forEach((d) => { map[d.suburb] = d })
    return map
  }, [rawData])

  const lgas = useMemo(() => {
    const set = new Set(rawData.map((d) => d.lga).filter(Boolean))
    return ['All', ...Array.from(set).sort()]
  }, [rawData])

  return { data: rawData, bySuburb, lgas, loading, error }
}
