import React from 'react'

export default function MutualMatchOverlay({ matches = [], onClose }) {
  // Generate a few floating hearts with randomized positions/durations
  const hearts = Array.from({ length: 10 }).map((_, i) => {
    const left = Math.floor(Math.random() * 90) + 2 // 2% - 92%
    const delay = (Math.random() * 2).toFixed(2)
    const dur = (3 + Math.random() * 3).toFixed(2)
    const size = 14 + Math.floor(Math.random() * 18)
    const style = {
      left: `${left}%`,
      bottom: `${-10 - Math.random() * 10}vh`,
      fontSize: `${size}px`,
      animationDuration: `${dur}s`,
      animationDelay: `${delay}s`,
    }
    return <span key={i} style={style}>💜</span>
  })

  return (
    <div className="mutual-overlay" role="dialog" aria-modal="true">
      <div className="mutual-overlay__hearts" aria-hidden="true">{hearts}</div>
      <div className="mutual-overlay__card">
        <div className="mb-3">
          <div className="mutual-heart">💜</div>
        </div>
        <h2 className="font-display text-2xl mb-2">It's a match!</h2>
        <p className="text-sm text-muted mb-4">
          You matched with {matches.length === 1 ? `@${matches[0].username}` : `${matches.length} people`} — have fun!
        </p>
        <div className="flex justify-center gap-3">
          <button onClick={onClose} className="btn-primary !px-6 !py-2 text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
