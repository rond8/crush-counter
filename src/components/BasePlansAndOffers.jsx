export default function BasePlansAndOffers() {
  const plans = [
    {
      id: 'monthly-premium',
      duration: '1 month, prepaid',
      countries: '174 countries / regions',
      status: 'Active',
      updated: 'Aug 25, 2026',
    },
  ]

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 pb-10 pt-4 text-slate-800">
      <div className="flex items-center justify-between gap-4 pb-3">
        <h2 className="text-[22px] font-medium tracking-[-0.03em] text-slate-800">Base plans and offers</h2>
        <div className="flex items-center gap-4 text-[15px] text-blue-600">
          <button type="button" className="font-medium hover:text-blue-500">Add base plan</button>
          <button type="button" className="font-medium hover:text-blue-500">Add offer</button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-100/80 px-4 py-3 text-[15px] text-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[13px] font-bold text-blue-600">
            i
          </div>
          <p>
            Offers aren&apos;t supported for prepaid base plans. To add offers, create a different base plan.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-transparent text-[13px] font-medium text-slate-500">
              <th className="px-4 py-4">ID and duration</th>
              <th className="px-4 py-4">Countries / regions</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Last updated</th>
              <th className="w-14 px-4 py-4 text-right">&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className="border-b border-slate-200 align-middle text-[15px] text-slate-700 last:border-b-0">
                <td className="px-4 py-4 align-top">
                  <div className="font-medium text-slate-800">{plan.id}</div>
                  <div className="mt-1 text-slate-500">{plan.duration}</div>
                </td>
                <td className="px-4 py-4 text-slate-600">{plan.countries}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-[10px] text-green-600">✓</span>
                    <span>{plan.status}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-600">{plan.updated}</td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button type="button" aria-label="More actions" className="text-[26px] leading-none text-slate-500 hover:text-slate-800">⋮</button>
                    <button type="button" aria-label="Open detail" className="text-[22px] leading-none text-blue-600 hover:text-blue-500">→</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-end gap-3 text-[13px] text-slate-500">
        <span>Show rows:</span>
        <button type="button" className="rounded border border-slate-200 bg-white px-2 py-1">10</button>
        <span className="px-1">1 - 1 of 1</span>
        <button type="button" className="rounded border border-slate-200 bg-white px-2 py-1">&lt;</button>
        <button type="button" className="rounded border border-slate-200 bg-white px-2 py-1">&gt;</button>
      </div>
    </div>
  )
}
