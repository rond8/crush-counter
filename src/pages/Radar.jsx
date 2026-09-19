import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getReceivedCount, getMatches, getAdmirerDates } from '../lib/crush'
import { getHintStatus, unlockHint } from '../lib/hints'
import { useAuth } from '../context/AuthContext'

const MAX_DOTS = 10
const DEFAULT_DOT_COLORS = ['#FF5C7A', '#FFCB57', '#5FD68A', '#38BDF8']
const MUTUAL_PURPLE = '#9d4edd'
const HINT_COST = 20

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
  const { profile, refreshProfile } = useAuth()
  const [isActive, setIsActive] = useState(false)
  const [count, setCount] = useState(0)
  const [displayCount, setDisplayCount] = useState(0)
  const [matches, setMatches] = useState([])
  const [admirerDates, setAdmirerDates] = useState([])
  const [selectedDot, setSelectedDot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [hintData, setHintData] = useState({ unlocked: false, hint: null, next_available_at: null })
  const [unlocking, setUnlocking] = useState(false)

  const refreshRadar = useCallback(async () => {
    try {
      const [c, m, d, h] = await Promise.all([
        getReceivedCount(),
        getMatches(),
        getAdmirerDates(),
        getHintStatus()
      ])
      setCount(c || 0)
      setMatches(m || [])
      setAdmirerDates(d || [])
      setHintData(h)
    } catch (err) {
      setError(err.message || 'Could not load radar data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshRadar()
  }, [refreshRadar])

  // Count-up animation logic
  useEffect(() => {
    if (!isActive) {
      setDisplayCount(0)
      return
    }
    if (displayCount < count) {
      const timer = setTimeout(() => {
        setDisplayCount(prev => prev + 1)
      }, 50)
      return () => clearTimeout(timer)
    } else if (displayCount > count) {
      setDisplayCount(count)
    }
  }, [count, displayCount, isActive])

  const toggleRadar = () => {
    const next = !isActive
    setIsActive(next)
    if (next) {
      refreshRadar()
    }
  }

  const handleUnlockHint = async () => {
    if ((profile?.coins ?? 0) < HINT_COST) return alert('Not enough coins!')
    if (!confirm(`Unlock a mystery hint about an admirer for ${HINT_COST} coins? (Limit 1 per week)`)) return

    setUnlocking(true)
    try {
      const result = await unlockHint()
      setHintData(result)
      await refreshProfile()
    } catch (err) {
      alert(err.message)
    } finally {
      setUnlocking(false)
    }
  }

  const hasAdmirers = (count ?? 0) > 0
  const hasMutual = matches.length > 0
  const overflow = Math.max((count ?? 0) - MAX_DOTS, 0)
  const dots = useAdmirerDots(count ?? 0, hasMutual, admirerDates, matches)

  const handleDotClick = (e, dot) => {
    e.stopPropagation()
    if (selectedDot?.id === dot.id) {
      setSelectedDot(null)
    } else {
      setSelectedDot(dot)
    }
  }

  return (
    <div 
      className="max-w-md mx-auto px-6 py-10 space-y-8 select-none pb-32"
      onClick={() => setSelectedDot(null)}
    >
      <style>{`
        @keyframes radarSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ringFade { 0% { transform: scale(0.85); opacity: 0.35; } 100% { transform: scale(1.15); opacity: 0; } }
        @keyframes dotPop { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.35); } }
        @keyframes mutualGlow { 0%, 100% { transform: scale(1); box-shadow: 0 0 10px #9d4edd, 0 0 20px #9d4edd; } 50% { transform: scale(1.4); box-shadow: 0 0 18px #c77dff, 0 0 30px #c77dff; } }
        @keyframes heartPulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
        @keyframes radarWave {
          0% { transform: scale(1); opacity: 0.9; border-width: 3px; }
          100% { transform: scale(3.5); opacity: 0; border-width: 1px; }
        }
        .radar-sweep { background: conic-gradient(from 0deg, rgba(181,123,255,0.4), transparent 50%); animation: radarSpin 6s linear infinite; }
        .radar-ring-fade { animation: ringFade 3s ease-out infinite; }
        .radar-dot { animation: dotPop 2.2s ease-in-out infinite; }
        .radar-dot-mutual { animation: mutualGlow 1.8s ease-in-out infinite !important; }
        .heart-center-pulse { animation: heartPulse 2s ease-in-out infinite; }
        .radar-wave-animation {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          border-style: solid;
          border-color: #B57BFF;
          animation: radarWave 3.5s cubic-bezier(0, 0.5, 0.5, 1) infinite;
          pointer-events: none;
        }
      `}</style>

      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl italic">Radar</h1>
        <p className="text-muted text-xs uppercase font-black tracking-widest">
          {isActive ? 'Scanning for admirers...' : 'Radar is Offline'}
        </p>
      </section>

      <section className="card p-10 flex flex-col items-center gap-6 relative overflow-hidden bg-gradient-to-b from-white/[0.03] to-transparent">
        <div className="relative w-64 h-64 shrink-0">
          {isActive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="radar-wave-animation" style={{ animationDelay: '0s' }} />
              <div className="radar-wave-animation" style={{ animationDelay: '1.2s' }} />
              <div className="radar-wave-animation" style={{ animationDelay: '2.4s' }} />
            </div>
          )}

          <span className="absolute inset-0 rounded-full border border-heart-purple/10" />

          <div className="absolute inset-4 rounded-full border border-white/5 overflow-hidden">
            {isActive && <div className="absolute inset-0 radar-sweep" />}
          </div>

          {isActive && dots.map((dot) => {
            const rad = (dot.angle * Math.PI) / 180
            const x = 50 + dot.radius * Math.cos(rad)
            const y = 50 + dot.radius * Math.sin(rad)
            const isSelected = selectedDot?.id === dot.id

            return (
              <div
                key={dot.id}
                className="absolute flex items-center justify-center cursor-pointer p-3 -m-3 touch-manipulation z-20"
                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                onClick={(e) => handleDotClick(e, dot)}
              >
                <span
                  className={`radar-dot rounded-full transition-all duration-300 ${dot.isMutualDot ? 'radar-dot-mutual z-10' : 'shadow-[0_0_10px_rgba(255,255,255,0.5)]'} ${isSelected ? 'scale-150 ring-2 ring-white shadow-glow' : ''}`}
                  style={{ width: dot.size, height: dot.size, backgroundColor: dot.color, animationDelay: `${dot.delay}s` }}
                />
              </div>
            )
          })}

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <button
              onClick={toggleRadar}
              id="radar-heart"
              className={`w-20 h-20 rounded-full bg-midnight-surface ring-2 ring-white/10 flex items-center justify-center transition-all duration-500 active:scale-90 z-30 shadow-2xl
                ${isActive ? 'shadow-[0_0_40px_rgba(181,123,255,0.8)] ring-heart-purple/60 border-2 border-heart-purple/20 scale-105' : 'grayscale opacity-60'}
                ${hasAdmirers && isActive ? 'heart-center-pulse' : ''}`}
            >
              <span className={`text-4xl transition-transform duration-500 ${isActive ? 'scale-110' : 'scale-75'}`} role="img" aria-label="heart">
                {isActive ? (hasMutual ? '💜' : '💖') : '🤍'}
              </span>
            </button>
          </div>
        </div>

        <div className="text-center space-y-1 min-h-[4.5rem]">
          {!isActive ? (
            <button onClick={toggleRadar} className="btn-primary !py-2 !px-8 text-[10px] font-black uppercase tracking-widest animate-pulse">Turn On Radar</button>
          ) : selectedDot ? (
            <div className="bg-purple-950/60 border border-purple-500/30 rounded-xl px-4 py-2 text-xs text-purple-200 animate-fade-in">
              {selectedDot.isMutualDot ? '💜 Mutual Match' : '📍 Secret Admirer'}
              <div className="font-semibold text-white text-sm">Added on {selectedDot.dateText}</div>
            </div>
          ) : loading ? (
            <p className="text-muted text-sm font-mono">loading...</p>
          ) : error ? (
            <p className="text-heart-red text-sm">{error}</p>
          ) : (
            <>
              <p className="font-display text-5xl text-ink transition-all duration-500">{displayCount}</p>
              <p className="text-muted text-sm">
                {count === 0 ? "No one yet." : count === 1 ? 'person has a crush on you' : 'people have a crush on you'}
              </p>
              {overflow > 0 && <p className="text-xs text-muted">+{overflow} more not shown</p>}
            </>
          )}
        </div>
      </section>

      {/* Mystery Hint Section */}
      {hasAdmirers && (
        <section className="card p-5 space-y-4 bg-gradient-to-br from-midnight to-slate-900 border-heart-purple/20">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-heart-purple flex items-center gap-2">
              🕵️ Mystery Hint
            </h2>
            <span className="text-[10px] font-bold text-muted bg-white/5 px-2 py-0.5 rounded-full">
               Once a week
            </span>
          </div>

          {hintData.unlocked ? (
            <div className="p-4 rounded-2xl bg-heart-purple/10 border border-heart-purple/30 text-center space-y-2 animate-in zoom-in-95">
               <p className="text-[10px] text-heart-purple font-bold uppercase tracking-tighter">Your current hint:</p>
               <p className="text-sm text-white font-medium italic">"{hintData.hint}"</p>
               {hintData.next_available_at && (
                 <p className="text-[9px] text-muted pt-2 border-t border-white/5">
                   Next hint available: {new Date(hintData.next_available_at).toLocaleDateString()}
                 </p>
               )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted leading-relaxed">
                Unlock a mysterious detail about one of your admirers. Is it their location? Their username? Find out now.
              </p>
              <button
                onClick={handleUnlockHint}
                disabled={unlocking || (profile?.coins ?? 0) < HINT_COST}
                className="btn-primary w-full !py-2.5 text-xs shadow-glow-purple flex items-center justify-center gap-2"
              >
                <span>{unlocking ? 'Unlocking...' : `Unlock for ${HINT_COST} Coins`}</span>
                <span className="text-lg">✨</span>
              </button>
              {(profile?.coins ?? 0) < HINT_COST && (
                <p className="text-center text-[10px] text-heart-red font-bold animate-pulse">Need {HINT_COST - (profile?.coins ?? 0)} more coins!</p>
              )}
            </div>
          )}
        </section>
      )}

      <div className="flex flex-col items-center gap-3">
        <Link to="/dashboard" className="btn-primary w-full text-center">
          💌 Set or change your crush
        </Link>
      </div>
    </div>
  )
}
