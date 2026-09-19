import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { spinWheel } from '../lib/game'
import { ITEM_INFO } from '../lib/items'
import { watchRewardedAd } from '../lib/ads'

const SPIN_COST = 5

// Wheel items without handshake (includes pet items + coins)
const WHEEL_ORDER = [
  'fire',
  'star',
  'clover',
  'mirror',
  'sword',
  'shield',
  'magnet',
  'arrow',
  'lighter',
  'spear',
  'pettreat',
  'pettoy',
  'petmedicine',
  'coins',
]

const WHEEL_COLORS = new Array(WHEEL_ORDER.length).fill('#111')

const ITEMS = {
  ...ITEM_INFO,
  coins: {
    icon: '/images/items/coins.png',
    name: '+3 Coins',
    tagline: 'Straight to your balance — nothing to use later.',
  },
}

function polarToCartesian(cx, cy, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  }
}

function describeSector(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle)
  const end = polarToCartesian(cx, cy, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`
}

function getSectorRotation(type) {
  const total = WHEEL_ORDER.length
  const index = WHEEL_ORDER.indexOf(type)
  const sliceAngle = 360 / total
  const targetCenter = index * sliceAngle + sliceAngle / 2
  return 360 - targetCenter
}

function Wheel({ rotation, spinning }) {
  const sectors = WHEEL_ORDER.map((itemType, index) => ({
    itemType,
    color: WHEEL_COLORS[index % WHEEL_COLORS.length],
    icon: ITEMS[itemType]?.icon,
    name: ITEMS[itemType]?.name,
  }))
  const sliceAngle = 360 / sectors.length
  const radius = 140
  const center = 160

  return (
    <div className="relative w-72 h-72 rounded-full overflow-hidden">
      <svg viewBox="0 0 320 320" className="w-full h-full">
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: '160px 160px',
            transition: spinning ? 'transform 4.2s cubic-bezier(0.18,0.82,0.3,1)' : 'none',
          }}
        >
          {sectors.map((sector, index) => {
            const startAngle = index * sliceAngle
            const endAngle = startAngle + sliceAngle
            const midAngle = startAngle + sliceAngle / 2
            const labelPos = polarToCartesian(0, 0, radius * 0.62, midAngle)
            return (
              <g key={`${sector.itemType}-${index}`}>
                <path
                  d={describeSector(center, center, radius, startAngle, endAngle)}
                  fill={sector.color}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="1"
                />
                <g transform={`translate(${center + labelPos.x}, ${center + labelPos.y}) rotate(${midAngle})`}>
                  <rect x="-18" y="-18" width="36" height="36" rx="10" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <image href={sector.icon} width="20" height="20" x="-10" y="-10" />
                </g>
              </g>
            )
          })}
          <circle cx={center} cy={center} r="28" fill="#090214" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        </g>
      </svg>
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 w-0 h-0 border-[14px] border-x-transparent border-b-heart-purple shadow-sm" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-midnight border border-midnight-border shadow-lg backdrop-blur-sm flex items-center justify-center">
           <div className="w-12 h-12 rounded-full border border-heart-purple/20 bg-heart-purple/5 flex items-center justify-center">
              <span className="text-xl">✨</span>
           </div>
        </div>
      </div>
    </div>
  )
}

export default function Spin() {
  const { profile, refreshProfile } = useAuth()
  const isVerified = Boolean(profile?.is_verified)
  const hasPremium = Boolean(profile?.premium_unlocked) || (profile?.fame ?? 0) >= 5000

  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [pendingResult, setPendingResult] = useState(null)
  const [error, setError] = useState('')
  const [wheelRotation, setWheelRotation] = useState(0)
  const [wheelSpinning, setWheelSpinning] = useState(false)

  const [watchingAd, setWatchingAd] = useState(false)
  const [adChoiceOpen, setAdChoiceOpen] = useState(false)
  const [adError, setAdError] = useState('')
  const [adSuccess, setAdSuccess] = useState('')

  const [showLegend, setShowLegend] = useState(false)

  const handleSpin = async () => {
    // PREVENT DOUBLE CLICK / SPAM CLICK
    if (spinning || wheelSpinning) return

    setError('')
    setResult(null)
    setPendingResult(null)
    setSpinning(true)
    setWheelSpinning(true)

    try {
      const spinResult = await spinWheel()
      const targetRotation = getSectorRotation(spinResult.item_type)
      const currentFullRotations = Math.ceil(wheelRotation / 360)
      const finalRotation = currentFullRotations * 360 + 1440 + targetRotation
      
      setWheelRotation(finalRotation)
      setPendingResult(spinResult)

      // Delay state reveal and profile refresh until spin animation finishes
      setTimeout(async () => {
        setWheelSpinning(false)
        setSpinning(false)
        setResult(spinResult)
        await refreshProfile()
      }, 4200)

    } catch (err) {
      setError(err.message || 'Could not spin right now.')
      setWheelSpinning(false)
      setSpinning(false)
    }
  }

  const handleWatchAd = async (rewardType) => {
    if (watchingAd) return

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

  const freeSpins = profile?.ad_free_spins ?? 0
  const canSpin = freeSpins > 0 || (profile?.coins ?? 0) >= SPIN_COST
  const isButtonDisabled = spinning || wheelSpinning || !canSpin

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
        <div className="flex flex-wrap justify-center gap-3 mt-3">
          {isVerified && (
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs text-sky-200">
              Verified perk: extra spin shimmer
            </span>
          )}
          {hasPremium && (
            <span className="rounded-full border border-heart-yellow/30 bg-heart-yellow/10 px-3 py-1 text-xs text-heart-yellow">
              Premium perk: ad-free spins + faster results
            </span>
          )}
        </div>
      </section>

      {/* Spin wheel */}
      <section className="card p-8 flex flex-col items-center gap-5">
        <div
          className={`relative w-72 h-72 rounded-full border-2 flex items-center justify-center ${
            hasPremium ? 'border-heart-yellow/60' : isVerified ? 'border-sky-400/60' : 'border-heart-purple/50'
          }`}
        >
          <Wheel rotation={wheelRotation} spinning={wheelSpinning} />
          {!wheelSpinning && pendingResult && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-full transition-opacity duration-300">
              <div className="w-60 p-6 rounded-3xl border border-white/20 bg-slate-900/90 text-center shadow-2xl">
                <p className="text-[10px] uppercase tracking-[0.4em] text-heart-purple font-bold mb-2">Reward Unlocked</p>
                <div className="relative">
                   <div className="absolute inset-0 bg-heart-purple/20 blur-2xl rounded-full" />
                   <img
                    src={ITEMS[pendingResult.item_type]?.icon}
                    alt={ITEMS[pendingResult.item_type]?.name}
                    className="relative mx-auto mb-4 w-20 h-20 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                  />
                </div>
                <h3 className="font-display text-2xl text-white mb-1">
                  {pendingResult.item_type === 'coins'
                    ? '+3 Coins'
                    : ITEMS[pendingResult.item_type]?.name}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed px-2">{ITEMS[pendingResult.item_type]?.tagline}</p>
                <button
                  onClick={() => {
                    setResult(pendingResult)
                    setPendingResult(null)
                  }}
                  className="mt-6 w-full py-2 bg-heart-purple text-white text-xs font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  Awesome!
                </button>
              </div>
            </div>
          )}
        </div>

        {result && !pendingResult && !spinning && !wheelSpinning && (
          <div className="text-center space-y-2 p-4 rounded-2xl bg-midnight-surface/50 border border-midnight-border">
            <p className="font-display text-xl text-ink">
              {result.item_type === 'coins' ? 'Spin complete!' : `Confirmed: ${ITEMS[result.item_type]?.name}`}
            </p>
            <p className="text-sm text-muted mt-1">{ITEMS[result.item_type]?.tagline}</p>
            {(isVerified || hasPremium) && (
              <p className="text-[10px] text-muted mt-2">
                {isVerified && '✨ Verified perk active — your spin sparkled extra bright.'}
                {hasPremium && !isVerified && '👑 Premium perk active — enjoy the faster spin reveal.'}
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleSpin}
          disabled={isButtonDisabled}
          className="btn-primary !px-6 !py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {spinning || wheelSpinning ? 'Spinning…' : freeSpins > 0 ? 'Spin (free!)' : `Spin for ${SPIN_COST} 🪙`}
        </button>
        {!canSpin && !spinning && !wheelSpinning && (
          <p className="text-xs text-muted">Not enough coins — come back tomorrow for more.</p>
        )}
        {error && <p className="text-heart-red text-sm">{error}</p>}
      </section>

      {/* Watch an ad for a bonus */}
      <section className="card p-5 flex flex-col items-center gap-3 text-center">
        {hasPremium ? (
          <>
            <p className="text-sm text-muted">
              Premium accounts skip ads and enjoy an enhanced spin experience.
            </p>
            <p className="text-xs text-heart-yellow">
              👑 You are premium — no rewarded ads needed for bonus spins.
            </p>
          </>
        ) : adChoiceOpen ? (
          <>
            <p className="text-sm text-muted">Pick your reward, then watch the ad:</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleWatchAd('coins')}
                disabled={watchingAd}
                className="btn-primary !px-4 !py-2 text-sm disabled:opacity-50"
              >
                🪙 +5 coins
              </button>
              <button
                onClick={() => handleWatchAd('spin')}
                disabled={watchingAd}
                className="btn-primary !px-4 !py-2 text-sm disabled:opacity-50"
              >
                🎡 Free spin
              </button>
              <button
                onClick={() => setAdChoiceOpen(false)}
                disabled={watchingAd}
                className="text-xs text-muted hover:text-ink px-1 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => setAdChoiceOpen(true)}
            disabled={watchingAd}
            className="btn-ghost !px-4 !py-2 text-sm disabled:opacity-50"
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
            {WHEEL_ORDER.map((key) => {
              const item = ITEMS[key]
              if (!item) return null
              return (
                <div key={key} className="card p-4 text-center space-y-1">
                  <img src={item.icon} alt="" className="w-9 h-9 mx-auto" />
                  <p className="text-sm font-semibold text-ink">{item.name}</p>
                  <p className="text-xs text-muted">{item.tagline}</p>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Inventory link */}
      <section className="card p-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg">Your inventory</h2>
          <p className="text-xs text-muted mt-1">Use, gift, or check what you've won.</p>
        </div>
        <Link to="/inventory" className="btn-primary !px-4 !py-2 text-sm whitespace-nowrap">
          View inventory
        </Link>
      </section>
    </div>
  )
}