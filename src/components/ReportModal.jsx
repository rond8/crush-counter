import { useState } from 'react'
import { REPORT_REASONS } from '../lib/reports'

export default function ReportModal({ title, onSubmit, onClose }) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason) {
      setError('Please choose a reason.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await onSubmit(reason, details)
      setDone(true)
    } catch (err) {
      setError(err.message || 'Could not submit report.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="card w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="text-center space-y-3 py-2">
            <p className="text-3xl">✅</p>
            <p className="text-sm text-ink">Report submitted. Thanks for helping keep things safe.</p>
            <button onClick={onClose} className="btn-primary w-full">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="font-display text-xl">{title}</h2>

            <div>
              <label className="block text-sm text-muted mb-1.5" htmlFor="reason">
                Reason
              </label>
              <select
                id="reason"
                className="input-field"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">Select a reason…</option>
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted mb-1.5" htmlFor="details">
                Details (optional)
              </label>
              <textarea
                id="details"
                rows={3}
                className="input-field resize-none"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>

            {error && <p className="text-heart-red text-sm">{error}</p>}

            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Submitting…' : 'Submit report'}
              </button>
              <button type="button" onClick={onClose} className="btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
