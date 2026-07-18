import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function MobileTopBar({ onMenuClick }) {
  const { profile, unreadCount } = useAuth()

  return (
    <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-midnight-surface border-b border-midnight-border/60">
      <button
        onClick={onMenuClick}
        className="p-1.5 -ml-1.5 text-ink"
        aria-label="Open menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
      </button>

      <Link to="/" className="font-display text-lg tracking-tight">
        crush<span className="text-heart-purple">counter</span>
      </Link>

      {profile ? (
        <Link to="/notifications" className="relative p-1.5 -mr-1.5 text-ink" aria-label="Notifications">
          🔔
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-heart-red text-white text-[9px] leading-none rounded-full min-w-[14px] h-3.5 px-0.5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      ) : (
        <span className="w-7" aria-hidden="true" />
      )}
    </div>
  )
}
