import React, { useEffect, useState } from 'react'

const GRAPHS_URL = './graphs.html'

export default function LandingModal({ onDismiss }) {
  const [visible, setVisible] = useState(false)

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const handleMap = () => {
    sessionStorage.setItem('seen_landing', '1')
    onDismiss()
  }

  const handleGraphs = () => {
    sessionStorage.setItem('seen_landing', '1')
    window.location.href = GRAPHS_URL
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        transition: 'opacity 0.4s ease',
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Backdrop — blurs whatever is behind */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(10, 12, 18, 0.72)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 max-w-lg w-full mx-5"
        style={{
          background: '#1e2330',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'transform 0.4s ease',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            height: '3px',
            background: 'linear-gradient(to right, #e85d2b, #f0c040)',
            borderRadius: '16px 16px 0 0',
          }}
        />

        <div className="px-8 py-7">
          {/* Label */}
          <div className="text-xs font-mono uppercase tracking-widest mb-4"
            style={{ color: '#e85d2b' }}>
            Victoria Speed Camera Dashboard
          </div>

          {/* Main text */}
          <p style={{
            color: '#c8c4bc',
            fontSize: '14px',
            lineHeight: '1.75',
            marginBottom: '28px',
          }}>
            I was curious about camera locations in Victoria and decided to vibe code together
            this mapping project using some Vic Gov data. There are things that could be improved
            and a million different analytical approaches but I've already succumbed to project
            scope creep and need to just stop at some point. Definitely got lost in the sauce at
            some point with the million different data sets I had open. If something looks not
            right let me know, but there were some weird things in the Vic Gov data sets I
            accessed so blame them not me.
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleMap}
              style={{
                flex: 1,
                padding: '11px 20px',
                background: '#e85d2b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.15s ease, transform 0.1s ease',
                fontFamily: 'DM Sans, sans-serif',
              }}
              onMouseEnter={e => e.target.style.background = '#d4501f'}
              onMouseLeave={e => e.target.style.background = '#e85d2b'}
              onMouseDown={e => e.target.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.target.style.transform = 'scale(1)'}
            >
              Take me to the map →
            </button>

            <button
              onClick={handleGraphs}
              style={{
                flex: 1,
                padding: '11px 20px',
                background: 'transparent',
                color: '#c8c4bc',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, color 0.15s ease, transform 0.1s ease',
                fontFamily: 'DM Sans, sans-serif',
              }}
              onMouseEnter={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.35)'
                e.target.style.color = '#f5f3ee'
              }}
              onMouseLeave={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.15)'
                e.target.style.color = '#c8c4bc'
              }}
              onMouseDown={e => e.target.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.target.style.transform = 'scale(1)'}
            >
              Show me some graphs ↗
            </button>
          </div>

          {/* Small footnote */}
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            fontSize: '11px',
            color: '#6b7280',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            Data: Vic Gov open data · ABS 2021 Census · 2020–2023
          </div>
        </div>
      </div>
    </div>
  )
}
