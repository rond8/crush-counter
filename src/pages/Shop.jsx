import { useCallback, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { useAuth } from '../context/AuthContext'
import { getShopItems, buyShopItemWithCoins, grantPurchasedItem } from '../lib/shop'
import { getShopPackage, purchaseConsumable } from '../lib/purchases'
import { ITEM_INFO } from '../lib/items'

// Maps each item to the RevenueCat product identifier you create for
// it in Play Console / App Store Connect + the RevenueCat dashboard
// (as a Consumable product, not a subscription/entitlement — same
// place you set up the Premium product, see PREMIUM setup notes in
// src/pages/Premium.jsx). These are placeholder identifiers — rename
// to match whatever you actually configure on both sides.
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
  const [buyingKey, setBuyingKey] = useState(null) // `${item_type}:coins` or `${item_type}:money`

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
      setSuccess(`Bought a ${ITEM_INFO[itemType]?.name ?? itemType}!`)
      await refreshProfile()
    } catch (err) {
      setError(err.message || 'Could not complete that purchase.')
    } finally {
      setBuyingKey(null)
    }
  }

  const handleBuyWithMoney = async (itemType) => {
    setError('')
    setSuccess('')
    setBuyingKey(`${itemType}:money`)
    try {
      const productId = IAP_PRODUCT_IDS[itemType]
      const pkg = await getShopPackage(productId)
      if (!pkg) {
        throw new Error("This item isn't available for purchase right now — check back soon.")
      }
      await purchaseConsumable(pkg)
      await grantPurchasedItem(itemType)
      setSuccess(`Bought a ${ITEM_INFO[itemType]?.name ?? itemType}!`)
      await refreshProfile()
    } catch (err) {
      if (!err?.userCancelled) {
        setError(err.message || 'Could not complete that purchase.')
      }
    } finally {
      setBuyingKey(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl md:text-4xl">🛍️ Shop</h1>
        <p className="text-muted text-sm max-w-md mx-auto">
          Buy exactly the item you want — no spin needed. Use coins, or buy instantly with real money.
        </p>
        <p className="text-sm text-muted">
          🪙 <span className="text-ink font-semibold">{profile?.coins ?? 0}</span> coins
        </p>
      </section>

      {error && <p className="text-heart-red text-sm text-center">{error}</p>}
      {success && <p className="text-heart-green text-sm text-center">{success}</p>}

      {loading ? (
        <p className="text-muted text-sm font-mono text-center">loading…</p>
      ) : items.length === 0 ? (
        <div className="card p-8 text-center text-muted text-sm">Nothing in the shop right now.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const info = ITEM_INFO[item.item_type]
            if (!info) return null
            const canAfford = (profile?.coins ?? 0) >= item.coin_price
            const buyingCoins = buyingKey === `${item.item_type}:coins`
            const buyingMoney = buyingKey === `${item.item_type}:money`
            const anyBuying = buyingCoins || buyingMoney
            return (
              <div key={item.item_type} className="card p-4 flex items-center gap-4">
                <img src={info.icon} alt="" className="w-12 h-12 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">{info.name}</p>
                  <p className="text-xs text-muted">{info.tagline}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => handleBuyWithCoins(item.item_type)}
                    disabled={!canAfford || anyBuying}
                    className="btn-primary !px-3 !py-1.5 text-xs whitespace-nowrap"
                  >
                    {buyingCoins ? 'Buying…' : `🪙 ${item.coin_price}`}
                  </button>
                  {isNative && (
                    <button
                      onClick={() => handleBuyWithMoney(item.item_type)}
                      disabled={anyBuying}
                      className="btn-ghost !px-3 !py-1.5 text-xs whitespace-nowrap"
                    >
                      {buyingMoney ? 'Buying…' : '💳 Buy'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
