import { useMemo, useState } from 'react'

const MAX_NAME_LENGTH = 55

export default function EditSubscriptionDetailsModal({ isOpen, onClose, onSubmit, initialName = 'premium account', initialBenefits = ['no ads', '+ 100 fame points'] }) {
  const [name, setName] = useState(initialName)
  const [benefits, setBenefits] = useState(initialBenefits)

  const languageLabel = useMemo(() => 'Default - English (United States) - en-US', [])

  if (!isOpen) return null

  const handleRemoveBenefit = (indexToRemove) => {
    setBenefits((current) => current.filter((_, index) => index !== indexToRemove))
  }

  const handleSubmit = () => {
    onSubmit?.({
      name: name.trim(),
      benefits,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-[1100px] rounded-[18px] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-slate-200">
        <h2 className="text-[22px] font-medium tracking-[-0.03em] text-slate-800">Edit subscription details</h2>

        <div className="mt-5 flex items-center gap-2 text-[15px] text-slate-500">
          <span>{languageLabel}</span>
          <button type="button" className="font-medium text-slate-600 underline decoration-slate-300 underline-offset-2">
            Manage translations
          </button>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <div className="grid grid-cols-[180px_1fr] gap-5 items-start">
            <div className="pt-3 text-[15px] font-medium text-slate-800">
              Name <span className="text-red-500">*</span>
            </div>

            <div>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value.slice(0, MAX_NAME_LENGTH))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[16px] text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <div className="mt-2 flex items-center justify-between gap-3 text-[12px] text-slate-500">
                <span>
                  A short name for your subscription. Users will see this in emails and the subscription center.
                </span>
                <span>{name.length} / {MAX_NAME_LENGTH}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-[180px_1fr] gap-5 items-start">
            <div className="pt-3 flex items-center gap-2 text-[15px] font-medium text-slate-800">
              <span>Benefits</span>
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-400 text-[11px] text-slate-500">
                ?
              </span>
            </div>

            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div key={`${benefit}-${index}`} className="flex items-center gap-3">
                  <div className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-800 shadow-sm">
                    {benefit}
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${benefit}`}
                    onClick={() => handleRemoveBenefit(index)}
                    className="text-[32px] leading-none text-slate-600 transition-colors hover:text-slate-900"
                  >
                    ×
                  </button>
                  <div className="min-w-[60px] text-right text-[12px] text-slate-500">
                    {benefit.length} / 40
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
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
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
