import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getReceivedCount, getMatches, getAdmirerDates } from '../lib/crush'

const MAX_DOTS = 10
const DEFAULT_DOT_COLORS = ['#FF5C7A', '#FFCB57', '#5FD68A', '#38BDF8']
const MUTUAL_PURPLE = '#9d4edd'

function useAdmirerDots(count, hasMutual, dates, matches) {
  return useMemo(() => {
    const shown = Math.min(count, MAX_DOTS)
    return Array.from({ length: shown }, (_, i) => {
      const isMutualDot = hasMutual && i === 0
      const angle = (i * 137.5) % 360
      const radius = 40 + ((i * 7) % 3) * 6
      const size = isMutualDot ? 14 : 10 + ((i * 5) % 3) * 3
      const delay = (i * 0.35) % 2.5
      const color = isMutualDot ? MUTUAL_PURPLE : DEFAULT_DOT_COLORS[i % DEFAULT_DOT_COLORS.length]
      
      // Determine timestamp: for mutual matches, use match date or current time if newly matched
      let rawDate = dates[i]?.created_at
      if (isMutualDot && matches.length > 0) {
        rawDate = matches[0]?.created_at || matches[0]?.matched_at || new Date().toISOString()
      }

      const formattedDate = rawDate 
        ? new Date(rawDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Today'

      return { 
        id: i, 
        angle, 
        radius, 
        size, 
        delay, 
        color, 
        isMutualDot, 
        dateText: formattedDate 
      }
    })
  }, [count, hasMutual, dates, matches])
}

export default function Radar() {
  const [count, setCount] = useState(null)
  const [matches, setMatches] = useState([])
  const [admirerDates, setAdmirerDates] = useState([])
  const [selectedDot, setSelectedDot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    
    Promise.all([getReceivedCount(), getMatches(), getAdmirerDates()])
      .then(([c, m, d]) => {
        if (!cancelled) {
          setCount(c)
          setMatches(m || [])
          setAdmirerDates(d || [])
        }
      })
      .catch((err) => !cancelled && setError(err.message || 'Could not load radar data.'))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [])

  const hasAdmirers = (count ?? 0) > 0
  const hasMutual = matches.length > 0
  const overflow = Math.max((count ?? 0) - MAX_DOTS, 0)
  const dots = useAdmirerDots(count ?? 0, hasMutual, admirerDates, matches)

  const handleDotClick = (e, dot) => {
    e.stopPropagation() // Prevents background click event from deselecting immediately
    if (selectedDot?.id === dot.id) {
      setSelectedDot(null)
    } else {
      setSelectedDot(dot)
    }
  }

  return (
    <div 
      className="max-w-md mx-auto px-6 py-10 space-y-8 select-none"
      onClick={() => setSelectedDot(null)}
    >
      <style>{`
        @keyframes radarSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ringFade {
          0%   { transform: scale(0.85); opacity: 0.35; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes dotPop {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.35); }
        }
        @keyframes mutualGlow {
          0%, 100% { transform: scale(1); box-shadow: 0 0 10px #9d4edd, 0 0 20px #9d4edd; }
          50%      { transform: scale(1.4); box-shadow: 0 0 18px #c77dff, 0 0 30px #c77dff; }
        }
        .radar-sweep {
          background: conic-gradient(from 0deg, rgba(181,123,255,0.35), transparent 45%);
          animation: radarSpin 6s linear infinite;
        }
        .radar-ring-fade {
          animation: ringFade 3s ease-out infinite;
        }
        .radar-dot {
          animation: dotPop 2.2s ease-in-out infinite;
        }
        .radar-dot-mutual {
          animation: mutualGlow 1.8s ease-in-out infinite !important;
        }
      `}</style>

      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl">Secret admirers</h1>
        <p className="text-muted text-sm max-w-xs mx-auto">
          Every dot is someone who currently has you as their crush. Tap on any dot to see when they added you!
        </p>
      </section>

      <section className="card p-8 flex flex-col items-center gap-6">
        <div className="relative w-64 h-64 shrink-0">
          <span className="absolute inset-0 rounded-full border border-heart-purple/25 radar-ring-fade" />
          <span
            className="absolute inset-0 rounded-full border border-heart-purple/25 radar-ring-fade"
            style={{ animationDelay: '1s' }}
          />
          <span
            className="absolute inset-0 rounded-full border border-heart-purple/25 radar-ring-fade"
            style={{ animationDelay: '2s' }}
          />

          <div className="absolute inset-4 rounded-full border border-midnight-border overflow-hidden">
            {hasAdmirers && <div className="absolute inset-0 radar-sweep" />}
          </div>

          {/* Admirer dots */}
          {dots.map((dot) => {
            const rad = (dot.angle * Math.PI) / 180
            const x = 50 + dot.radius * Math.cos(rad)
            const y = 50 + dot.radius * Math.sin(rad)
            const isSelected = selectedDot?.id === dot.id

            return (
              <div
                key={dot.id}
                className="absolute flex items-center justify-center cursor-pointer p-3 -m-3 touch-manipulation z-20"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={(e) => handleDotClick(e, dot)}
              >
                {/* Visible Dot */}
                <span
                  className={`radar-dot rounded-full transition-transform ${
                    dot.isMutualDot ? 'radar-dot-mutual z-10' : 'shadow-glow'
                  } ${isSelected ? 'scale-150 ring-2 ring-white' : ''}`}
                  style={{
                    width: dot.size,
                    height: dot.size,
                    backgroundColor: dot.color,
                    animationDelay: `${dot.delay}s`,
                  }}
                />

                {/* Mobile Floating Popup Tooltip */}
                {isSelected && (
                  <div className="absolute bottom-full mb-2 whitespace-nowrap bg-gray-900/90 text-white border border-purple-500/40 text-[11px] px-2.5 py-1 rounded-lg shadow-xl backdrop-blur-sm z-30 animate-fade-in pointer-events-none">
                    {dot.isMutualDot ? '💜 Mutual match' : '💖 Added'}: {dot.dateText}
                  </div>
                )}
              </div>
            )
          })}

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-midnight-surface ring-1 ring-heart-purple/40 flex items-center justify-center shadow-glow">
              <span className="text-3xl" role="img" aria-label="heart">
                {hasMutual ? '💜' : hasAdmirers ? '💖' : '🤍'}
              </span>
            </div>
          </div>
        </div>

        {/* Selected Dot Status Box */}
        <div className="text-center space-y-1 min-h-[4.5rem]">
          {selectedDot ? (
            <div className="bg-purple-950/60 border border-purple-500/30 rounded-xl px-4 py-2 text-xs text-purple-200 animate-fade-in">
              {selectedDot.isMutualDot ? '💜 Mutual Match' : '📍 Secret Admirer'}
              <div className="font-semibold text-white text-sm">
                Added on {selectedDot.dateText}
              </div>
            </div>
          ) : loading ? (
            <p className="text-muted text-sm font-mono">loading...</p>
          ) : error ? (
            <p className="text-heart-red text-sm">{error}</p>
          ) : (
            <>
              <p className="font-display text-5xl text-ink">{count}</p>
              <p className="text-muted text-sm">
                {count === 0
                  ? "No one yet, but someone might be thinking of you right now."
                  : count === 1
                  ? 'person currently has a crush on you'
                  : 'people currently have a crush on you'}
              </p>
              {overflow > 0 && (
                <p className="text-xs text-muted">+{overflow} more not shown</p>
              )}
            </>
          )}
        </div>
      </section>

      <div className="flex flex-col items-center gap-3">
        <Link to="/dashboard" className="btn-primary w-full text-center">
          💌 Set or change your crush
        </Link>
      </div>
    </div>
  )
}