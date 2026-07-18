import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { useAuth } from '../context/AuthContext'
import { getPremiumPackage, purchasePremium, restorePurchases, syncPremiumToProfile } from '../lib/purchases'

const FAME_THRESHOLD = 500

export default function Premium() {
  const { profile, refreshProfile } = useAuth()

  const [pkg, setPkg] = useState(null)
  const [loadingPkg, setLoadingPkg] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState('')

  const fame = profile?.fame ?? 0
  const hasPremium = fame >= FAME_THRESHOLD || Boolean(profile?.premium_unlocked)
  const progressPct = Math.min(100, Math.round((fame / FAME_THRESHOLD) * 100))
  const isNative = Capacitor.isNativePlatform()

  useEffect(() => {
    if (hasPremium) {
      setLoadingPkg(false)
      return
    }
    getPremiumPackage()
      .then(setPkg)
      .finally(() => setLoadingPkg(false))
  }, [hasPremium])

  const handlePurchase = async () => {
    if (!pkg) return
    setError('')
    setPurchasing(true)
    try {
      const entitled = await purchasePremium(pkg)
      if (entitled) {
        await syncPremiumToProfile()
        await refreshProfile()
      }
    } catch (err) {
      // A cancelled purchase sheet isn't a real error — don't scare
      // the person with an error message for backing out.
      if (!err?.userCancelled) {
        setError(err.message || 'Could not complete the purchase.')
      }
    } finally {
      setPurchasing(false)
    }
  }

  const handleRestore = async () => {
    setError('')
    setRestoring(true)
    try {
      const entitled = await restorePurchases()
      if (entitled) {
        await syncPremiumToProfile()
        await refreshProfile()
      } else {
        setError('No previous purchase found on this account.')
      }
    } catch (err) {
      setError(err.message || 'Could not restore purchases.')
    } finally {
      setRestoring(false)
    }
  }

  if (hasPremium) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-14 space-y-8 text-center">
        <div className="text-5xl">👑</div>
        <h1 className="font-display text-3xl md:text-4xl">Welcome to Premium</h1>
        <p className="text-muted text-sm max-w-md mx-auto">
          You've unlocked full access — your crown badge shows on your profile, and you're
          part of the smallest, most legendary corner of Crush Counter.
        </p>

        <div className="card p-6 max-w-sm mx-auto space-y-2">
          <p className="text-sm text-muted">Unlocked because you</p>
          <p className="text-ink font-semibold">
            {fame >= FAME_THRESHOLD ? `Reached ${FAME_THRESHOLD}+ fame 🌟` : 'Purchased Premium 👑'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-14 space-y-8 text-center">
      <div className="text-5xl">🔒</div>
      <h1 className="font-display text-3xl md:text-4xl">Premium</h1>
      <p className="text-muted text-sm max-w-md mx-auto">
        A crown badge on your profile, and bragging rights. Unlock it by reaching{' '}
        {FAME_THRESHOLD} fame, or skip the wait with a one-time purchase.
      </p>

      <div className="card p-6 max-w-sm mx-auto space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Fame progress</span>
          <span className="text-ink font-semibold">
            {fame} / {FAME_THRESHOLD}
          </span>
        </div>
        <div className="h-2 rounded-full bg-midnight-border overflow-hidden">
          <div
            className="h-full bg-heart-yellow transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-muted">
          Earn fame from 🔥 and 🕯️ items in the spin, or profile likes.
        </p>
      </div>

      <div className="flex items-center gap-3 justify-center text-xs text-muted">
        <span className="flex-1 h-px bg-midnight-border max-w-16" />
        or
        <span className="flex-1 h-px bg-midnight-border max-w-16" />
      </div>

      <div className="card p-6 max-w-sm mx-auto space-y-3">
        <p className="text-sm text-muted">Skip straight to it</p>

        {!isNative ? (
          <p className="text-xs text-muted">
            Purchases are only available in the installed app, not the web preview.
          </p>
        ) : loadingPkg ? (
          <p className="text-xs text-muted font-mono">loading…</p>
        ) : !pkg ? (
          <p className="text-xs text-muted">
            Premium isn't available for purchase right now — check back soon.
          </p>
        ) : (
          <>
            <button onClick={handlePurchase} disabled={purchasing} className="btn-primary w-full">
              {purchasing ? 'Processing…' : `Unlock for ${pkg.product.priceString}`}
            </button>
            <button
              onClick={handleRestore}
              disabled={restoring || purchasing}
              className="text-xs text-muted hover:text-ink transition-colors"
            >
              {restoring ? 'Restoring…' : 'Restore previous purchase'}
            </button>
          </>
        )}

        {error && <p className="text-heart-red text-sm">{error}</p>}
      </div>
    </div>
  )
}
