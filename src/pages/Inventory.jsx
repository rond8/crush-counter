import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMyInventory, useFire, useLighter, useSword } from '../lib/game'
import { ITEMS } from '../lib/items'
import UsernameSearchInput from '../components/UsernameSearchInput'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'offensive', label: 'Offensive', types: ['arrow', 'magnet'] },
  { key: 'defensive', label: 'Defensive', types: ['shield', 'mirror'] },
  { key: 'consumables', label: 'Consumables', types: ['fire', 'clover', 'star'] },
]

const RARITY_ORDER = {
  fire: 2,
  sword: 3,
  star: 5,
  arrow: 2,
  shield: 3,
  magnet: 4,
  clover: 1,
  mirror: 4,
  spear: 5,
  handshake: 4,
  lighter: 2,
}

function groupByType(items) {
  const groups = {}
  for (const item of items) {
    if (!ITEMS[item.item_type]) continue
    if (!groups[item.item_type]) groups[item.item_type] = []
    groups[item.item_type].push(item)
  }
  return groups
}

export default function Inventory() {
  const { profile, refreshProfile } = useAuth()

  const [groups, setGroups] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [sortMode, setSortMode] = useState('newest')
  const [search, setSearch] = useState('')

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

  const filteredTypes = useMemo(() => {
    const types = Object.keys(groups)
    const normalizedSearch = search.trim().toLowerCase()

    const visible = types.filter((type) => {
      const config = ITEMS[type]
      const matchesTab = activeTab === 'all' || TABS.find((tab) => tab.key === activeTab)?.types?.includes(type)
      const matchesSearch = !normalizedSearch || config?.name?.toLowerCase().includes(normalizedSearch) || config?.tagline?.toLowerCase().includes(normalizedSearch)
      return matchesTab && matchesSearch
    })

    return visible.sort((a, b) => {
      if (sortMode === 'rarity') {
        return (RARITY_ORDER[b] ?? 0) - (RARITY_ORDER[a] ?? 0)
      }
      return groups[b]?.length - groups[a]?.length
    })
  }, [activeTab, groups, search, sortMode])

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl md:text-4xl">🎒 Inventory</h1>
        <p className="text-muted text-sm max-w-md mx-auto">
          Your collected items are grouped by type and shown with quantities so it’s easier to browse.
        </p>
      </section>

      {actionError && <p className="text-heart-red text-sm text-center">{actionError}</p>}
      {actionSuccess && <p className="text-heart-green text-sm text-center">{actionSuccess}</p>}

      <div className="card p-4 space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items"
          className="input-field"
        />

        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${
                activeTab === tab.key
                  ? 'border-heart-purple/50 bg-heart-purple/15 text-heart-purple'
                  : 'border-midnight-border text-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            className="input-field !py-2 !px-3 text-sm w-auto"
          >
            <option value="newest">Newest received</option>
            <option value="rarity">Rarity</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-muted text-sm font-mono text-center">loading…</p>
      ) : filteredTypes.length === 0 ? (
        <div className="card p-8 text-center text-muted text-sm space-y-3">
          <p>No matching items yet.</p>
          <Link to="/spin" className="btn-primary inline-flex !px-4 !py-2 text-sm">
            🎡 Go spin
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTypes.map((type) => {
            const config = ITEMS[type]
            const items = groups[type]
            const quantity = items.length
            const isActing = actingType === type

            return (
              <div key={type} className="card p-4">
                <div className="flex items-center gap-4">
                  <img src={config.icon} alt="" className="w-12 h-12 shrink-0 rounded-md object-contain" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-ink">{config.name}</p>
                      <span className="rounded-full bg-midnight px-2.5 py-1 text-[11px] text-muted">× {quantity}</span>
                    </div>
                    <p className="text-xs text-muted mt-1">{config.tagline}</p>
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
                      {isActing ? 'Using…' : type === 'fire' || type === 'sword' ? 'Use' : 'Use'}
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
