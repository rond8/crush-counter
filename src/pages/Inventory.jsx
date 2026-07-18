import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMyInventory, useFire, useLighter, useSword } from '../lib/game'
import { ITEMS } from '../lib/items'
import UsernameSearchInput from '../components/UsernameSearchInput'

/**
 * Groups individual inventory rows into { fire: [items...], lighter: [...] }
 * so the page can show a quantity per type instead of one card each.
 */
function groupByType(items) {
  const groups = {}
  for (const item of items) {
    if (!ITEMS[item.item_type]) continue // skip unrecognized/legacy item types
    if (!groups[item.item_type]) groups[item.item_type] = []
    groups[item.item_type].push(item)
  }
  return groups
}

export default function Inventory() {
  const { profile, refreshProfile } = useAuth()

  const [groups, setGroups] = useState({})
  const [loading, setLoading] = useState(true)

  const [giftingType, setGiftingType] = useState(null)
  const [giftTarget, setGiftTarget] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [actingType, setActingType] = useState(null)

  const refresh = useCallback(async () => {
    const items = await getMyInventory()
    setGroups(groupByType(items))
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const handleUseFire = async (itemId) => {
    setActionError('')
    setActionSuccess('')
    setActingType('fire')
    try {
      await useFire(itemId)
      setActionSuccess('🔥 Fame +5!')
      await Promise.all([refreshProfile(), refresh()])
    } catch (err) {
      setActionError(err.message || 'Could not use that item.')
    } finally {
      setActingType(null)
    }
  }

  const handleUseSword = async (itemId) => {
    setActionError('')
    setActionSuccess('')
    setActingType('sword')
    try {
      await useSword(itemId)
      setActionSuccess('⚔️ Your messages to your crush are priority for the next 24h.')
      await refresh()
    } catch (err) {
      setActionError(err.message || 'Could not use that item.')
    } finally {
      setActingType(null)
    }
  }

  const handleUseLighter = async (itemId) => {
    setActionError('')
    setActionSuccess('')
    if (!giftTarget.trim()) return
    setActingType('lighter')
    try {
      await useLighter(itemId, giftTarget)
      setActionSuccess(`🕯️ Gifted +5 fame to @${giftTarget.trim().toLowerCase()}.`)
      setGiftingType(null)
      setGiftTarget('')
      await refresh()
    } catch (err) {
      setActionError(err.message || 'Could not gift that item.')
    } finally {
      setActingType(null)
    }
  }

  const types = Object.keys(groups)

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl md:text-4xl">🎒 Inventory</h1>
        <p className="text-muted text-sm max-w-md mx-auto">
          Items you've won from the{' '}
          <Link to="/spin" className="text-heart-purple hover:underline">
            spin
          </Link>
          , not used yet.
        </p>
      </section>

      {actionError && <p className="text-heart-red text-sm text-center">{actionError}</p>}
      {actionSuccess && <p className="text-heart-green text-sm text-center">{actionSuccess}</p>}

      {loading ? (
        <p className="text-muted text-sm font-mono text-center">loading…</p>
      ) : types.length === 0 ? (
        <div className="card p-8 text-center text-muted text-sm space-y-3">
          <p>Nothing here yet.</p>
          <Link to="/spin" className="btn-primary inline-flex !px-4 !py-2 text-sm">
            🎡 Go spin
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {types.map((type) => {
            const config = ITEMS[type]
            const items = groups[type]
            const quantity = items.length
            const isActing = actingType === type

            return (
              <div key={type} className="card p-4">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {config.name} <span className="text-muted font-normal">× {quantity}</span>
                    </p>
                    <p className="text-xs text-muted">{config.tagline}</p>
                  </div>

                  {giftingType !== type && (
                    <button
                      onClick={() => {
                        if (type === 'fire') handleUseFire(items[0].id)
                        else if (type === 'sword') handleUseSword(items[0].id)
                        else {
                          setGiftingType(type)
                          setActionError('')
                          setActionSuccess('')
                        }
                      }}
                      disabled={isActing}
                      className="btn-ghost !px-4 !py-2 text-sm whitespace-nowrap"
                    >
                      {isActing ? 'Using…' : 'Use'}
                    </button>
                  )}
                </div>

                {giftingType === type && (
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <UsernameSearchInput
                        value={giftTarget}
                        onChange={setGiftTarget}
                        excludeUsername={profile?.username}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUseLighter(items[0].id)}
                        disabled={isActing || !giftTarget.trim()}
                        className="btn-primary !px-4 !py-2 text-sm whitespace-nowrap"
                      >
                        {isActing ? 'Gifting…' : 'Gift'}
                      </button>
                      <button
                        onClick={() => {
                          setGiftingType(null)
                          setGiftTarget('')
                        }}
                        className="btn-ghost !px-3 !py-2 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
