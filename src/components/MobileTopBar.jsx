import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function MobileTopBar({ onMenuClick }) {
  const { profile, unreadCount, unreadMessageCount } = useAuth()

  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-midnight/80 backdrop-blur-md border-b border-white/10 shadow-sm transition-all">
      {/* Hamburger Menu Button */}
      <button
        onClick={onMenuClick}
        type="button"
        className="p-2 -ml-2 text-ink/80 hover:text-ink active:scale-95 rounded-xl transition-all duration-150 hover:bg-white/5"
        aria-label="Open navigation menu"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Right Side Actions: Messages & Notifications */}
      {profile ? (
        <div className="flex items-center gap-1 -mr-1">
          {/* Messages Link */}
          <Link
            to="/messages"
            className="relative p-2 text-ink/80 hover:text-ink active:scale-95 rounded-xl transition-all duration-150 hover:bg-white/5 flex items-center justify-center"
            aria-label="Messages"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>

            {unreadMessageCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-purple-600 rounded-full ring-2 ring-midnight shadow-md animate-pulse">
                {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
              </span>
            )}
          </Link>

          {/* Notifications Link */}
          <Link
            to="/notifications"
            className="relative p-2 text-ink/80 hover:text-ink active:scale-95 rounded-xl transition-all duration-150 hover:bg-white/5 flex items-center justify-center"
            aria-label="Notifications"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>

            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-midnight shadow-md animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      ) : (
        <div className="w-9" aria-hidden="true" />
      )}
    </header>
  )
}