import { useCallback, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { useAuth } from '../context/AuthContext'
import { getShopItems, buyShopItemWithCoins } from '../lib/shop'
import { purchaseCoins } from '../lib/purchases'
import { ITEM_INFO } from '../lib/items'

const IAP_PRODUCT_IDS = {
  fire: 'crush_counter_item_fire',
  lighter: 'crush_counter_item_lighter',
  sword: 'crush_counter_item_sword',
  star: 'crush_counter_item_star',
  arrow: 'crush_counter_item_arrow',
  shield: 'crush_counter_item_shield',
}

export default function Shop() {
  const { profile, refreshProfile } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [buyingKey, setBuyingKey] = useState(null)

  const isNative = Capacitor.isNativePlatform()

  const refresh = useCallback(async () => {
    const data = await getShopItems()
    setItems(data)
  }, [])

  useEffect(() => {
    refresh()
      .catch((err) => setError(err.message || 'Could not load the shop.'))
      .finally(() => setLoading(false))
  }, [refresh])

  const handleBuyWithCoins = async (itemType) => {
    setError('')
    setSuccess('')
    setBuyingKey(`${itemType}:coins`)
    try {
      await buyShopItemWithCoins(itemType)
      setSuccess(`Added ${ITEM_INFO[itemType]?.name ?? itemType} to your inventory!`)
      await refreshProfile()
    } catch (err) {
      setError(err.message || 'Could not complete that purchase.')
    } finally {
      setBuyingKey(null)
    }
  }

  const handleRefillCoins = async () => {
    setError('')
    setSuccess('')
    setBuyingKey('refill:100')
    try {
      await purchaseCoins('100coin')
      // Approval handler in purchases.js will call grant_coins
      setSuccess('Redirecting to Google Play Store...')
    } catch (err) {
      setError(err.message || 'Could not initiate purchase.')
    } finally {
      setBuyingKey(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      {/* Header Section */}
      <section className="text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
          🛍️ Official Marketplace
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
          Item Shop
        </h1>
        <p className="text-muted text-sm max-w-md mx-auto">
          Get direct access to power-ups and special items. Skip the wheel spin and buy instantly.
        </p>

        {/* User Balance Card */}
        <div className="inline-flex items-center gap-3 bg-white/[0.03] border border-white/10 px-4 py-2 rounded-2xl shadow-inner mt-2">
          <span className="text-xl">🪙</span>
          <div className="text-left">
            <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Your Balance</p>
            <p className="text-sm font-extrabold text-ink leading-tight">
              {profile?.coins ?? 0} <span className="text-xs font-normal text-muted">coins</span>
            </p>
          </div>
        </div>
      </section>

      {/* Coin Packs Section (Google Play) */}
      {isNative && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
             <span className="w-1.5 h-6 bg-amber-500 rounded-full" />
             <h2 className="font-display text-xl font-bold text-ink uppercase tracking-tight">Coin Packs</h2>
          </div>
          <div className="card p-5 border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent flex items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl shadow-lg">
                   🪙
                </div>
                <div>
                   <h3 className="text-sm font-black text-ink">50 Gold Coins</h3>
                   <p className="text-[10px] text-muted">One-time purchase via Google Play</p>
                </div>
             </div>
             <button
               onClick={handleRefillCoins}
               className="btn-primary !bg-amber-500 hover:!bg-amber-600 !py-2 !px-6 text-xs font-black shadow-lg shadow-amber-500/20"
             >
               {buyingKey === 'refill:100' ? '...' : 'BUY PACK'}
             </button>
          </div>
        </section>
      )}

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-heart-red/10 border border-heart-red/20 text-heart-red text-sm text-center font-medium animate-fade-in">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center font-medium animate-fade-in">
          🎉 {success}
        </div>
      )}

      {/* Shop Items Section */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5 animate-pulse flex items-center gap-4">
              <div className="w-14 h-14 bg-white/5 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/5 rounded w-2/3" />
                <div className="h-3 bg-white/5 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center space-y-2">
          <p className="text-2xl">📦</p>
          <p className="text-sm font-medium text-ink">The shop is empty</p>
          <p className="text-xs text-muted">Check back later for newly added items.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => {
            const info = ITEM_INFO[item.item_type]
            if (!info) return null

            const userCoins = profile?.coins ?? 0
            const canAfford = userCoins >= item.coin_price
            const buyingCoins = buyingKey === `${item.item_type}:coins`
            const buyingMoney = buyingKey === `${item.item_type}:money`
            const anyBuying = buyingCoins || buyingMoney

            return (
              <div
                key={item.item_type}
                className="card p-5 border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent hover:border-white/15 transition-all duration-200 flex flex-col justify-between gap-4"
              >
                {/* Item Details */}
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                    <img src={info.icon} alt={info.name} className="w-10 h-10 object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-ink leading-snug">{info.name}</h3>
                    <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-2">
                      {info.tagline}
                    </p>
                  </div>
                </div>

                {/* Purchase Actions */}
                <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                  <button
                    onClick={() => handleBuyWithCoins(item.item_type)}
                    disabled={!canAfford || anyBuying}
                    className={`btn-primary flex-1 !py-2 text-xs font-semibold transition-all ${
                      !canAfford ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
                    }`}
                  >
                    {buyingCoins ? (
                      <span className="animate-pulse">Processing…</span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <span>🪙</span>
                        <span>{item.coin_price} Coins</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}