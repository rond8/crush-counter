import { useEffect, useRef, useState } from 'react'

const PULL_THRESHOLD = 70 // px of drag needed to trigger a refresh
const MAX_PULL = 120 // visual cap so the indicator doesn't stretch forever

/**
 * Global pull-to-refresh: dragging down while already scrolled to
 * the very top of the page shows a small spinner and reloads the
 * app once you've pulled past PULL_THRESHOLD. Mount this once, near
 * the top of App.jsx (alongside FloatingHearts/Notifications) — it
 * renders its own fixed-position indicator and doesn't need any
 * children or props.
 *
 * Note: this checks window.scrollY, not the scroll position of
 * nested scrollable containers (like the message list in Chat.jsx or
 * RandomChat.jsx). On pages with their own internal scroll area,
 * pulling down inside that area while the *page* itself is already
 * at the top can trigger this gesture too — a reasonable trade-off
 * for how simple this stays, but worth knowing if it ever feels like
 * it's firing somewhere you don't want it to.
 */
export default function PullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(null)
  const pulling = useRef(false)

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (window.scrollY <= 0 && !refreshing) {
        startY.current = e.touches[0].clientY
        pulling.current = true
      }
    }

    const handleTouchMove = (e) => {
      if (!pulling.current || startY.current === null) return
      const delta = e.touches[0].clientY - startY.current
      if (delta > 0 && window.scrollY <= 0) {
        // Prevent the browser's own overscroll/bounce while our
        // indicator is doing its thing.
        e.preventDefault()
        setPullDistance(Math.min(delta * 0.5, MAX_PULL))
      } else {
        pulling.current = false
        setPullDistance(0)
      }
    }

    const handleTouchEnd = () => {
      if (!pulling.current) return
      pulling.current = false
      setPullDistance((current) => {
        if (current >= PULL_THRESHOLD) {
          setRefreshing(true)
          // Small delay so the spinner is actually visible before
          // the reload kicks in.
          setTimeout(() => window.location.reload(), 200)
          return current
        }
        return 0
      })
      startY.current = null
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [refreshing])

  if (pullDistance === 0 && !refreshing) return null

  const rotation = Math.min((pullDistance / PULL_THRESHOLD) * 180, 180)

  return (
    <div
      className="fixed top-0 inset-x-0 z-[60] flex justify-center pointer-events-none"
      style={{ transform: `translateY(${refreshing ? 16 : pullDistance - 40}px)` }}
      aria-hidden="true"
    >
      <div className="mt-2 w-9 h-9 rounded-full bg-midnight-surface border border-midnight-border shadow-glow flex items-center justify-center">
        <span
          className={`text-lg leading-none ${refreshing ? 'animate-spin' : ''}`}
          style={refreshing ? undefined : { transform: `rotate(${rotation}deg)` }}
        >
          {refreshing ? '⏳' : '↓'}
        </span>
      </div>
    </div>
  )
}