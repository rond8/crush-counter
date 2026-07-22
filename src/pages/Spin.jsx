import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  spinWheel,
  getMyInventory,
  useFire,
  useLighter,
  useSword,
  useStar,
  useArrow,
  useShield,
  useMagnet,
  useClover,
  useMirror,
} from '../lib/game'
import { ITEM_INFO } from '../lib/items'
import { watchRewardedAd } from '../lib/ads'
import UsernameSearchInput from '../components/UsernameSearchInput'

const SPIN_COST = 5
const WHEEL_ICON = '/images/items/wheel.png'

const ITEMS = {
  ...ITEM_INFO,
  coins: {
    icon: '/images/items/coins.png',
    name: '+3 Coins',
    tagline: 'Straight to your balance — nothing to use later.',
  },
}

const TARGET_ACTION_LABEL = {
  lighter: 'Gift',
  arrow: 'Shoot',
  magnet: 'Steal',
}

export default function Spin() {
  const { profile, refreshProfile } = useAuth()

  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const [inventory, setInventory] = useState([])
  const [loadingInventory, setLoadingInventory] = useState(true)

  const [giftingId, setGiftingId] = useState(null)
  const [giftTarget, setGiftTarget] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [actingId, setActingId] = useState(null)

  const [watchingAd, setWatchingAd] = useState(false)
  const [adChoiceOpen, setAdChoiceOpen] = useState(false)
  const [adError, setAdError] = useState('')
  const [adSuccess, setAdSuccess] = useState('')

  // Toggle state to hide/show possible items list
  const [showLegend, setShowLegend] = useState(false)

  const refreshInventory = useCallback(async () => {
    const items = await getMyInventory()
    setInventory(items)
  }, [])

  useEffect(() => {
    refreshInventory().finally(() => setLoadingInventory(false))
  }, [refreshInventory])

  const handleSpin = async () => {
    setError('')
    setResult(null)
    setSpinning(true)
    try {
      const spinResult = await spinWheel()
      await new Promise((r) => setTimeout(r, 900))
      setResult(spinResult)
      await Promise.all([refreshProfile(), refreshInventory()])
    } catch (err) {
      setError(err.message || 'Could not spin right now.')
    } finally {
      setSpinning(false)
    }
  }

  const handleWatchAd = async (rewardType) => {
    setAdError('')
    setAdSuccess('')
    setAdChoiceOpen(false)
    setWatchingAd(true)
    try {
      await watchRewardedAd(rewardType)
      setAdSuccess(rewardType === 'coins' ? '🎬 +5 coins!' : '🎬 +1 free spin!')
      await refreshProfile()
    } catch (err) {
      setAdError(err.message || 'Could not complete that ad.')
    } finally {
      setWatchingAd(false)
    }
  }

  const handleUseFire = async (itemId) => {
    setActionError('')
    setActionSuccess('')
    setActingId(itemId)
    try {
      await useFire(itemId)
      setActionSuccess('🔥 Fame +5!')
      await Promise.all([refreshProfile(), refreshInventory()])
    } catch (err) {
      setActionError(err.message || 'Could not use that item.')
    } finally {
      setActingId(null)
    }
  }

  const handleUseSword = async (itemId) => {
    setActionError('')
    setActionSuccess('')
    setActingId(itemId)
    try {
      await useSword(itemId)
      setActionSuccess('⚔️ Your messages to your crush are priority for the next 24h.')
      await refreshInventory()
    } catch (err) {
      setActionError(err.message || 'Could not use that item.')
    } finally {
      setActingId(null)
    }
  }

  const handleUseStar = async (itemId) => {
    setActionError('')
    setActionSuccess('')
    setActingId(itemId)
    try {
      await useStar(itemId)
      setActionSuccess('⭐ Fame +10!')
      await Promise.all([refreshProfile(), refreshInventory()])
    } catch (err) {
      setActionError(err.message || 'Could not use that item.')
    } finally {
      setActingId(null)
    }
  }

  const handleUseShield = async (itemId) => {
    setActionError('')
    setActionSuccess('')
    setActingId(itemId)
    try {
      await useShield(itemId)
      setActionSuccess("🛡️ You're shielded from arrows for the next 24h.")
      await refreshInventory()
    } catch (err) {
      setActionError(err.message || 'Could not use that item.')
    } finally {
      setActingId(null)
    }
  }

  const handleUseArrow = async (itemId) => {
    setActionError('')
    setActionSuccess('')
    if (!giftTarget.trim()) return
    setActingId(itemId)
    try {
      await useArrow(itemId, giftTarget)
      setActionSuccess(`🏹 Hit @${giftTarget.trim().toLowerCase()} with an arrow — their fame dropped by 5.`)
      setGiftingId(null)
      setGiftTarget('')
      await refreshInventory()
    } catch (err) {
      setActionError(err.message || 'Could not use that item.')
    } finally {
      setActingId(null)
    }
  }

  const handleUseLighter = async (itemId) => {
    setActionError('')
    setActionSuccess('')
    if (!giftTarget.trim()) return
    setActingId(itemId)
    try {
      await useLighter(itemId, giftTarget)
      setActionSuccess(`🕯️ Gifted +5 fame to @${giftTarget.trim().toLowerCase()}.`)
      setGiftingId(null)
      setGiftTarget('')
      await refreshInventory()
    } catch (err) {
      setActionError(err.message || 'Could not gift that item.')
    } finally {
      setActingId(null)
    }
  }

  const handleUseMagnet = async (itemId) => {
    setActionError('')
    setActionSuccess('')
    if (!giftTarget.trim()) return
    setActingId(itemId)
    try {
      await useMagnet(itemId, giftTarget)
      setActionSuccess(`🧲 Siphoned 3 fame from @${giftTarget.trim().toLowerCase()}!`)
      setGiftingId(null)
      setGiftTarget('')
      await Promise.all([refreshProfile(), refreshInventory()])
    } catch (err) {
      setActionError(err.message || 'Could not use magnet.')
    } finally {
      setActingId(null)
    }
  }

  const handleUseClover = async (itemId) => {
    setActionError('')
    setActionSuccess('')
    setActingId(itemId)
    try {
      await useClover(itemId)
      setActionSuccess('🍀 Feeling lucky! +10 coins added!')
      await Promise.all([refreshProfile(), refreshInventory()])
    } catch (err) {
      setActionError(err.message || 'Could not use clover.')
    } finally {
      setActingId(null)
    }
  }

  const handleUseMirror = async (itemId) => {
    setActionError('')
    setActionSuccess('')
    setActingId(itemId)
    try {
      await useMirror(itemId)
      setActionSuccess('🪞 Mirror active! Incoming arrows will reflect back for 24h.')
      await refreshInventory()
    } catch (err) {
      setActionError(err.message || 'Could not use mirror.')
    } finally {
      setActingId(null)
    }
  }

  const freeSpins = profile?.ad_free_spins ?? 0
  const canSpin = freeSpins > 0 || (profile?.coins ?? 0) >= SPIN_COST

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl md:text-4xl">🎡 Spin</h1>
        <p className="text-muted text-sm max-w-md mx-auto">
          Spend coins for a random item. Log in daily to earn more.
        </p>
        <div className="flex items-center justify-center gap-4 pt-1 flex-wrap">
          <span className="text-sm text-muted">
            🪙 <span className="text-ink font-semibold">{profile?.coins ?? 0}</span> coins
          </span>
          <span className="text-sm text-muted">
            🌟 <span className="text-ink font-semibold">{profile?.fame ?? 0}</span> fame
          </span>
          {freeSpins > 0 && (
            <span className="text-sm text-heart-green">
              🎬 <span className="font-semibold">{freeSpins}</span> free spin{freeSpins === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </section>

      {/* Spin wheel */}
      <section className="card p-8 flex flex-col items-center gap-5">
        <div
          className={`w-28 h-28 rounded-full border-2 border-heart-purple/50 flex items-center justify-center transition-transform duration-700 ${
            spinning ? 'animate-spin' : ''
          }`}
        >
          <img
            src={spinning || !result ? WHEEL_ICON : ITEMS[result.item_type]?.icon}
            alt=""
            className="w-16 h-16"
          />
        </div>

        {result && !spinning && (
          <div className="text-center">
            <p className="font-display text-xl">
              {result.item_type === 'coins' ? 'You got +3 coins!' : `You got a ${ITEMS[result.item_type]?.name}!`}
            </p>
            <p className="text-sm text-muted mt-1">{ITEMS[result.item_type]?.tagline}</p>
          </div>
        )}

        <button
          onClick={handleSpin}
          disabled={spinning || !canSpin}
          className="btn-primary !px-6 !py-3"
        >
          {spinning ? 'Spinning…' : freeSpins > 0 ? 'Spin (free!)' : `Spin for ${SPIN_COST} 🪙`}
        </button>
        {!canSpin && !spinning && (
          <p className="text-xs text-muted">Not enough coins — come back tomorrow for more.</p>
        )}
        {error && <p className="text-heart-red text-sm">{error}</p>}
      </section>

      {/* Watch an ad for a bonus */}
      <section className="card p-5 flex flex-col items-center gap-3 text-center">
        {adChoiceOpen ? (
          <>
            <p className="text-sm text-muted">Pick your reward, then watch the ad:</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleWatchAd('coins')}
                disabled={watchingAd}
                className="btn-primary !px-4 !py-2 text-sm"
              >
                🪙 +5 coins
              </button>
              <button
                onClick={() => handleWatchAd('spin')}
                disabled={watchingAd}
                className="btn-primary !px-4 !py-2 text-sm"
              >
                🎡 Free spin
              </button>
              <button
                onClick={() => setAdChoiceOpen(false)}
                disabled={watchingAd}
                className="text-xs text-muted hover:text-ink px-1"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => setAdChoiceOpen(true)}
            disabled={watchingAd}
            className="btn-ghost !px-4 !py-2 text-sm"
          >
            🎬 {watchingAd ? 'Loading ad…' : 'Watch an ad for a bonus'}
          </button>
        )}
        {adError && <p className="text-heart-red text-xs">{adError}</p>}
        {adSuccess && <p className="text-heart-green text-xs">{adSuccess}</p>}
      </section>

      {/* Possible Items Toggle & Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Possible outcomes</span>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="w-7 h-7 rounded-full bg-heart-purple/10 text-heart-purple font-bold text-sm flex items-center justify-center hover:bg-heart-purple/20 transition-colors"
            title="Toggle item list"
          >
            ?
          </button>
        </div>

        {showLegend && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
            {Object.entries(ITEMS).map(([key, item]) => (
              <div key={key} className="card p-4 text-center space-y-1">
                <img src={item.icon} alt="" className="w-9 h-9 mx-auto" />
                <p className="text-sm font-semibold text-ink">{item.name}</p>
                <p className="text-xs text-muted">{item.tagline}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Inventory */}
      <section>
        <h2 className="font-display text-xl mb-3">Your inventory</h2>
        {actionError && <p className="text-heart-red text-sm mb-3">{actionError}</p>}
        {actionSuccess && <p className="text-heart-green text-sm mb-3">{actionSuccess}</p>}

        {loadingInventory ? (
          <p className="text-muted text-sm font-mono text-center">loading…</p>
        ) : inventory.length === 0 ? (
          <div className="card p-8 text-center text-muted text-sm">
            No items yet — spin to get your first one.
          </div>
        ) : (
          <div className="space-y-3">
            {inventory
              .filter((item) => ITEMS[item.item_type])
              .map((item) => {
                const config = ITEMS[item.item_type]
                const isActing = actingId === item.id
                return (
                  <div key={item.id} className="card p-4 flex items-center gap-4">
                    <img src={config.icon} alt="" className="w-9 h-9 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink">{config.name}</p>
                      <p className="text-xs text-muted">{config.tagline}</p>

                      {giftingId === item.id && (
                        <div className="mt-2 space-y-2">
                          {item.item_type === 'arrow' && (
                            <p className="text-xs text-heart-red">
                              This will reduce their fame by 5 — blocked if they're currently shielded.
                            </p>
                          )}
                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex-1">
                              <UsernameSearchInput
                                value={giftTarget}
                                onChange={setGiftTarget}
                                excludeUsername={profile?.username}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (item.item_type === 'arrow') handleUseArrow(item.id)
                                  else if (item.item_type === 'magnet') handleUseMagnet(item.id)
                                  else handleUseLighter(item.id)
                                }}
                                disabled={isActing || !giftTarget.trim()}
                                className="btn-primary !px-4 !py-2 text-sm whitespace-nowrap"
                              >
                                {isActing ? `${TARGET_ACTION_LABEL[item.item_type]}ing…` : TARGET_ACTION_LABEL[item.item_type]}
                              </button>
                              <button
                                onClick={() => {
                                  setGiftingId(null)
                                  setGiftTarget('')
                                }}
                                className="btn-ghost !px-3 !py-2 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {giftingId !== item.id && (
                      <button
                        onClick={() => {
                          if (item.item_type === 'fire') handleUseFire(item.id)
                          else if (item.item_type === 'sword') handleUseSword(item.id)
                          else if (item.item_type === 'star') handleUseStar(item.id)
                          else if (item.item_type === 'shield') handleUseShield(item.id)
                          else if (item.item_type === 'clover') handleUseClover(item.id)
                          else if (item.item_type === 'mirror') handleUseMirror(item.id)
                          else {
                            setGiftingId(item.id)
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
                )
              })}
          </div>
        )}
      </section>
    </div>
  )
}