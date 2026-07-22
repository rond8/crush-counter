import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getCurrentEvent, setCurrentEvent, clearCurrentEvent, claimEventBonus } from '../lib/event'
import { timeAgo } from '../lib/time'

function toDatetimeLocalValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function Event() {
  const { profile } = useAuth()
  const isAdmin = Boolean(profile?.is_admin)

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [bonusCoins, setBonusCoins] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [clearing, setClearing] = useState(false)

  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState('')
  const [claimSuccess, setClaimSuccess] = useState('')

  const load = useCallback(async () => {
    setLoadError('')
    try {
      const data = await getCurrentEvent()
      setEvent(data)
      setTitle(data?.title ?? '')
      setBody(data?.body ?? '')
      setImageUrl(data?.image_url ?? '')
      setStartsAt(toDatetimeLocalValue(data?.starts_at))
      setEndsAt(toDatetimeLocalValue(data?.ends_at))
      setBonusCoins(data?.bonus_coins ? String(data.bonus_coins) : '')
    } catch (err) {
      setLoadError(err.message || 'Could not load the event.')
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaveError('')
    if (!title.trim() || !body.trim()) return
    setSaving(true)
    try {
      await setCurrentEvent({
        title,
        body,
        imageUrl,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        bonusCoins: bonusCoins ? Number(bonusCoins) : 0,
      })
      await load()
    } catch (err) {
      setSaveError(err.message || 'Could not save the event.')
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    setSaveError('')
    setClearing(true)
    try {
      await clearCurrentEvent()
      setTitle('')
      setBody('')
      setImageUrl('')
      setStartsAt('')
      setEndsAt('')
      setBonusCoins('')
      await load()
    } catch (err) {
      setSaveError(err.message || 'Could not clear the event.')
    } finally {
      setClearing(false)
    }
  }

  const handleClaim = async () => {
    setClaimError('')
    setClaimSuccess('')
    setClaiming(true)
    try {
      const newBalance = await claimEventBonus()
      setClaimSuccess(`+${event.bonus_coins} 🪙 claimed! New balance: ${newBalance}.`)
      await load()
    } catch (err) {
      setClaimError(err.message || 'Could not claim the bonus.')
    } finally {
      setClaiming(false)
    }
  }

  const now = Date.now()
  const startsInFuture = event?.starts_at && new Date(event.starts_at).getTime() > now
  const hasEnded = event?.ends_at && new Date(event.ends_at).getTime() < now

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl md:text-4xl">🎉 Event</h1>
        <p className="text-muted text-sm">What's happening right now on Crush Counter.</p>
      </section>

      {isAdmin && (
        <form onSubmit={handleSave} className="card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
            {event ? 'Update the event' : 'Set an event'}
          </h2>
          <input
            type="text"
            placeholder="Title"
            className="input-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="What's going on?"
            rows={4}
            className="input-field resize-none"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <input
            type="url"
            placeholder="Image URL (optional)"
            className="input-field"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">Starts (optional)</label>
              <input
                type="datetime-local"
                className="input-field"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Ends (optional)</label>
              <input
                type="datetime-local"
                className="input-field"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Bonus coins for participating (optional)</label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 20"
              className="input-field"
              value={bonusCoins}
              onChange={(e) => setBonusCoins(e.target.value)}
            />
            <p className="text-xs text-muted mt-1">
              Anyone who does at least one thing (spin, send a crush, message someone, like a
              profile, or share a thought) after the event starts can claim this once.
            </p>
          </div>
          {saveError && <p className="text-heart-red text-sm">{saveError}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving || !title.trim() || !body.trim()} className="btn-primary">
              {saving ? 'Saving…' : event ? 'Update event' : 'Publish event'}
            </button>
            {event && (
              <button
                type="button"
                onClick={handleClear}
                disabled={clearing}
                className="btn-ghost !text-heart-red"
              >
                {clearing ? 'Clearing…' : 'End event'}
              </button>
            )}
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-muted text-sm font-mono text-center">loading…</p>
      ) : loadError ? (
        <p className="text-heart-red text-sm text-center">{loadError}</p>
      ) : !event ? (
        <div className="card p-8 text-center text-muted text-sm">
          No event running right now — check back soon.
        </div>
      ) : (
        <article className="card overflow-hidden">
          {event.image_url && <img src={event.image_url} alt="" className="w-full max-h-64 object-cover" />}
          <div className="p-6 space-y-3">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <h2 className="font-display text-2xl">{event.title}</h2>
              <span className="text-xs text-muted font-mono whitespace-nowrap">
                Updated {timeAgo(event.updated_at)}
              </span>
            </div>
            {(startsInFuture || hasEnded) && (
              <p className="text-xs text-heart-yellow">
                {hasEnded
                  ? 'This event has ended.'
                  : startsInFuture
                  ? `Starts ${new Date(event.starts_at).toLocaleString()}`
                  : null}
              </p>
            )}
            {!startsInFuture && !hasEnded && event.ends_at && (
              <p className="text-xs text-heart-yellow">Ends {new Date(event.ends_at).toLocaleString()}</p>
            )}
            <p className="text-sm text-muted whitespace-pre-wrap">{event.body}</p>

            {event.bonus_coins > 0 && (
              <div className="card !bg-midnight ring-1 ring-heart-yellow/40 p-4 space-y-2 mt-2">
                <p className="text-sm font-semibold text-heart-yellow">
                  🪙 Participate to earn +{event.bonus_coins} coins
                </p>
                {event.claimed_by_me ? (
                  <p className="text-xs text-heart-green font-semibold">Already claimed ✓</p>
                ) : (
                  <>
                    <button
                      onClick={handleClaim}
                      disabled={claiming || hasEnded || startsInFuture}
                      className="btn-primary !px-4 !py-2 text-sm"
                    >
                      {claiming ? 'Claiming…' : 'Claim bonus'}
                    </button>
                    {claimError && <p className="text-heart-red text-xs">{claimError}</p>}
                    {claimSuccess && <p className="text-heart-green text-xs">{claimSuccess}</p>}
                  </>
                )}
              </div>
            )}
          </div>
        </article>
      )}
    </div>
  )
}