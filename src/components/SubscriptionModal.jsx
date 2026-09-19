import { useEffect, useState } from 'react'

const MAX_PRODUCT_ID_LENGTH = 40
const MAX_NAME_LENGTH = 55

const PRODUCT_ID_PATTERN = /^[a-z0-9][a-z0-9._]*$/i

export default function SubscriptionModal({ isOpen, onClose, onSubmit }) {
  const [productId, setProductId] = useState('subscribe')
  const [name, setName] = useState('premium account')
  const [showProductError, setShowProductError] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setProductId('subscribe')
      setName('premium account')
      setShowProductError(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleProductIdChange = (value) => {
    const safeValue = value.slice(0, MAX_PRODUCT_ID_LENGTH)
    setProductId(safeValue)
    if (showProductError) setShowProductError(false)
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const trimmed = productId.trim()
    const valid = trimmed && PRODUCT_ID_PATTERN.test(trimmed)

    if (!valid) {
      setShowProductError(true)
      return
    }

    onSubmit?.({
      productId: trimmed,
      name: name.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
      <div className="w-full max-w-[980px] rounded-[18px] bg-white p-6 shadow-[0_30px_60px_rgba(15,23,42,0.18)] ring-1 ring-slate-200">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[22px] font-medium tracking-[-0.03em] text-slate-800">Create subscription</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-4xl leading-none text-slate-500 transition-colors hover:text-slate-800"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <p className="max-w-[760px] text-[15px] leading-7 text-slate-600">
            To create a subscription, you need to provide a product ID. You won&apos;t be able to
            change or reuse this ID. You will be able to configure more details later. This
            information won&apos;t be shared with users.{' '}
            <button type="button" className="font-semibold text-blue-600 underline underline-offset-2">
              Learn more
            </button>
          </p>

          <div className="space-y-2">
            <label className="block text-[14px] font-medium text-slate-700">Product ID</label>
            <input
              type="text"
              value={productId}
              onChange={(event) => handleProductIdChange(event.target.value)}
              aria-invalid={showProductError}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-slate-800 shadow-sm transition-all focus:outline-none ${
                showProductError
                  ? 'border-red-500 ring-2 ring-red-100 focus:border-red-500'
                  : 'border-blue-500 ring-2 ring-blue-100 focus:border-blue-500'
              }`}
            />
            {showProductError ? (
              <p className="text-[12px] leading-5 text-red-500">
                The product ID must start with a number or lowercase letter, and can also contain
                underscores (_), and periods (.)
              </p>
            ) : (
              <div className="flex justify-end text-[12px] text-slate-400">
                <span>{productId.length} / {MAX_PRODUCT_ID_LENGTH}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-[14px] font-medium text-slate-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value.slice(0, MAX_NAME_LENGTH))}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-800 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <div className="flex justify-end text-[12px] text-slate-400">
              <span>{name.length} / {MAX_NAME_LENGTH}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-5 py-3 text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-xl bg-blue-600 px-5 py-3 text-[15px] font-medium text-white shadow-sm transition-colors hover:bg-blue-500"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
