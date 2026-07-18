import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { spinWheel } from '../lib/game'
import { watchRewardedAd } from '../lib/ads'
import { ITEMS } from '../lib/items'

const SPIN_COST = 5

export default function Spin() {
  const { profile, refreshProfile } = useAuth()

  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const [watchingAd, setWatchingAd] = useState(false)
  const [adChoiceOpen, setAdChoiceOpen] = useState(false)
  const [adError, setAdError] = useState('')
  const [adSuccess, setAdSuccess] = useState('')

  const handleSpin = async () => {
    setError('')
    setResult(null)
    setSpinning(true)
    try {
      const spinResult = await spinWheel()
      // Small delay so the "spinning" state is visible even though the
      // result comes back instantly — feels more like a real spin.
      await new Promise((r) => setTimeout(r, 900))
      setResult(spinResult)
      await refreshProfile()
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
          className={`w-28 h-28 rounded-full border-2 border-heart-purple/50 flex items-center justify-center text-5xl transition-transform duration-700 ${
            spinning ? 'animate-spin' : ''
          }`}
        >
          {spinning ? '🎡' : result ? ITEMS[result.item_type].icon : '🎡'}
        </div>

        {result && !spinning && (
          <div className="text-center">
            <p className="font-display text-xl">
              {result.item_type === 'coins' ? 'You got +3 coins!' : `You got a ${ITEMS[result.item_type].name}!`}
            </p>
            <p className="text-sm text-muted mt-1">{ITEMS[result.item_type].tagline}</p>
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

      {/* Item legend */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(ITEMS).map(([key, item]) => (
          <div key={key} className="card p-4 text-center space-y-1">
            <p className="text-3xl">{item.icon}</p>
            <p className="text-sm font-semibold text-ink">{item.name}</p>
            <p className="text-xs text-muted">{item.tagline}</p>
          </div>
        ))}
      </section>

      <div className="text-center">
        <Link to="/inventory" className="btn-ghost inline-flex !px-5 !py-2.5 text-sm">
          🎒 View your inventory
        </Link>
      </div>
    </div>
  )
}
