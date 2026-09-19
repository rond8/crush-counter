import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getMyInventory,
  useFire,
  useLighter,
  useSword,
  useStar,
  useShield,
  useArrow,
  useMagnet,
  useClover,
  useMirror,
  useSpear,
  usePetTreat,
  usePetToy,
  usePetMedicine,
  useMysteryBox,
} from '../lib/game'
import { ITEMS } from '../lib/items'
import UsernameSearchInput from '../components/UsernameSearchInput'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'offensive', label: 'Offensive', types: ['arrow', 'magnet', 'spear'] },
  { key: 'defensive', label: 'Defensive', types: ['shield', 'mirror'] },
  { key: 'consumables', label: 'Consumables', types: ['fire', 'clover', 'star'] },
  { key: 'petcare', label: 'Pet care', types: ['pettreat', 'pettoy', 'petmedicine'] },
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
  lighter: 2,
  pettreat: 1,
  pettoy: 1,
  petmedicine: 3,
}

// Items that fire instantly against the caller's own account — no
// target needed, so the "Use" button acts directly.
const SELF_USE_HANDLERS = {
  fire: { fn: useFire, message: () => '🔥 Fame +5!' },
  star: { fn: useStar, message: () => '🌟 Fame +10!' },
  shield: { fn: useShield, message: () => '🛡️ Shielded from Arrows for the next 24h.' },
  clover: { fn: useClover, message: () => '🍀 +10 coins!' },
  mirror: { fn: useMirror, message: () => '🪞 Reflecting Arrows for the next 24h.' },
  sword: { fn: useSword, message: () => '⚔️ Your messages to your crush are priority for the next 24h.' },
  pettreat: { fn: usePetTreat, message: () => "🍖 Your pet's hunger is refilled!" },
  pettoy: { fn: usePetToy, message: () => '🎾 Your pet is delighted!' },
  petmedicine: { fn: usePetMedicine, message: () => '💊 Your pet is healed!' },
  mysterybox: { fn: useMysteryBox, message: (res) => res?.won_coins > 0 ? `📦 You won ${res.won_coins} coins!` : `📦 You won a ${res.won_item_type}!` },
}

// Items that need a target username — "Use" opens the picker instead
// of firing immediately.
const TARGETED_USE_HANDLERS = {
  lighter: { fn: useLighter, message: (u) => `🕯️ Gifted +5 fame to @${u}.`, cta: 'Gift' },
  arrow: { fn: useArrow, message: (u) => `🏹 -5 fame to @${u}.`, cta: 'Attack' },
  magnet: { fn: useMagnet, message: (u) => `🧲 Stole 3 fame from @${u}.`, cta: 'Steal' },
  spear: { fn: useSpear, message: (u) => `🗡️ Pierced @${u} for -8 fame.`, cta: 'Attack' },
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
  const [actingType, setActingType] = useState(null)

  const [dialogNotice, setDialogNotice] = useState({ isOpen: false, type: 'success', message: '' })
  const closeDialog = () => setDialogNotice((prev) => ({ ...prev, isOpen: false }))
  const showSuccess = (msg) => setDialogNotice({ isOpen: true, type: 'success', message: msg })
  const showError = (msg) => setDialogNotice({ isOpen: true, type: 'error', message: msg })

  const refresh = useCallback(async () => {
    const items = await getMyInventory()
    setGroups(groupByType(items))
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const handleSelfUse = async (type, itemId) => {
    const handler = SELF_USE_HANDLERS[type]
    if (!handler) return
    setActingType(type)
    try {
      await handler.fn(itemId)
      showSuccess(handler.message())
      await Promise.all([refreshProfile(), refresh()])
    } catch (err) {
      showError(err.message || 'Could not use that item.')
    } finally {
      setActingType(null)
    }
  }

  const handleTargetedUse = async (type, itemId) => {
    const handler = TARGETED_USE_HANDLERS[type]
    if (!handler) return
    const cleanTarget = giftTarget.trim().toLowerCase()
    if (!cleanTarget) {
      showError('Please enter a target username.')
      return
    }
    setActingType(type)
    try {
      await handler.fn(itemId, cleanTarget)
      showSuccess(handler.message(cleanTarget))
      setGiftingType(null)
      setGiftTarget('')
      await Promise.all([refreshProfile(), refresh()])
    } catch (err) {
      showError(err.message || 'Could not use that item.')
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
      const matchesSearch =
        !normalizedSearch ||
        config?.name?.toLowerCase().includes(normalizedSearch) ||
        config?.tagline?.toLowerCase().includes(normalizedSearch)
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
      {dialogNotice.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-white/10 bg-midnight/95">
            <div className="flex justify-center">
              {dialogNotice.type === 'error' ? (
                <div className="w-12 h-12 rounded-full bg-heart-red/20 text-heart-red flex items-center justify-center text-2xl font-bold">
                  ⚠️
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-heart-green/20 text-heart-green flex items-center justify-center text-2xl font-bold">
                  ✨
                </div>
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-display text-ink">
                {dialogNotice.type === 'error' ? 'Action Failed' : 'Success!'}
              </h3>
              <p className="text-sm text-muted">{dialogNotice.message}</p>
            </div>
            <button onClick={closeDialog} className="btn-primary w-full !py-2.5 text-sm font-semibold">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl md:text-4xl">🎒 Inventory</h1>
        <p className="text-muted text-sm max-w-md mx-auto">
          Your collected items are grouped by type and shown with quantities so it's easier to browse.
        </p>
      </section>

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
            const targeted = TARGETED_USE_HANDLERS[type]

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
                        if (SELF_USE_HANDLERS[type]) handleSelfUse(type, items[0].id)
                        else if (targeted) setGiftingType(type)
                      }}
                      disabled={isActing}
                      className="btn-ghost !px-4 !py-2 text-sm whitespace-nowrap"
                    >
                      {isActing ? 'Using…' : 'Use'}
                    </button>
                  )}
                </div>

                {giftingType === type && targeted && (
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
                        onClick={() => handleTargetedUse(type, items[0].id)}
                        disabled={isActing || !giftTarget.trim()}
                        className="btn-primary !px-4 !py-2 text-sm whitespace-nowrap disabled:opacity-50"
                      >
                        {isActing ? 'Using…' : targeted.cta}
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