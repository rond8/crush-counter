export default function VerifiedBadge({ verified, className = '', label = 'Verified account' }) {
  if (!verified) return null

  return (
    <span className={`ml-1.5 inline-flex items-center align-middle ${className}`} title={label} aria-label={label}>
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-sky-400 shrink-0" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.16" />
        <path
          d="M9.2 12.4l1.7 1.7 3.8-4.1"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
