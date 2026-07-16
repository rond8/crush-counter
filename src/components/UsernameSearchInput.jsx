import { useEffect, useRef, useState } from 'react'
import { searchUsernames } from '../lib/profile'

/**
 * Text input with a live dropdown of matching registered usernames,
 * so the person can confirm they've got the right account before
 * sending a heart.
 */
export default function UsernameSearchInput({ value, onChange, excludeUsername, autoFocus }) {
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const clean = value.trim()
    if (!clean) {
      setResults([])
      setOpen(false)
      return
    }

    let cancelled = false
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const data = await searchUsernames(clean, excludeUsername)
        if (!cancelled) {
          setResults(data)
          setOpen(true)
        }
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [value, excludeUsername])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (username) => {
    onChange(username)
    setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-mono">@</span>
        <input
          type="text"
          placeholder="crush_username"
          className="input-field font-mono pl-8"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoFocus={autoFocus}
          autoComplete="off"
        />
      </div>

      {open && (results.length > 0 || loading) && (
        <div className="absolute z-10 mt-1 w-full card p-1 max-h-56 overflow-y-auto shadow-glow">
          {loading && results.length === 0 ? (
            <p className="text-muted text-sm font-mono px-3 py-2">searching…</p>
          ) : results.length === 0 ? (
            <p className="text-muted text-sm px-3 py-2">No matching accounts.</p>
          ) : (
            results.map((r) => (
              <button
                key={r.username}
                type="button"
                onClick={() => handleSelect(r.username)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-midnight text-left transition-colors"
              >
                {r.avatar_url ? (
                  <img src={r.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-heart-purple/20 flex items-center justify-center text-xs font-display">
                    {r.username[0]?.toUpperCase()}
                  </span>
                )}
                <span className="font-mono text-sm text-ink">@{r.username}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
