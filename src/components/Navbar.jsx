import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { session, profile, signOut, unreadCount } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    setMenuOpen(false)
    await signOut()
    navigate('/login')
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="border-b border-midnight-border/60 relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-display text-xl tracking-tight" onClick={closeMenu}>
          crush<span className="text-heart-purple">counter</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4">
          <Link to="/announcements" className="text-sm text-muted hover:text-ink transition-colors">
            📣 Announcements
          </Link>
          <Link to="/featured" className="text-sm text-muted hover:text-ink transition-colors">
            🏆 Featured
          </Link>
          <Link to="/thoughts" className="text-sm text-muted hover:text-ink transition-colors">
            💭 Thoughts
          </Link>
          <Link to="/polls" className="text-sm text-muted hover:text-ink transition-colors">
            🗳️ Polls
          </Link>
          {session && (
            <>
              <Link to="/notifications" className="relative text-muted hover:text-ink transition-colors" aria-label="Notifications">
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-heart-red text-white text-[10px] leading-none rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              {profile && (
                <span className="text-sm text-muted whitespace-nowrap">
                  🪙 {profile.coins ?? 0}
                </span>
              )}
              <Link to="/spin" className="text-sm text-muted hover:text-ink transition-colors">
                🎡 Spin
              </Link>
              <Link to="/messages" className="text-sm text-muted hover:text-ink transition-colors">
                💌 Messages
              </Link>
              {profile?.username && (
                <Link to="/profile" className="font-mono text-sm text-muted hover:text-ink transition-colors">
                  @{profile.username}
                </Link>
              )}
              <button onClick={handleSignOut} className="btn-ghost !px-4 !py-2 text-sm">
                Sign out
              </button>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="sm:hidden p-2 -mr-2 text-ink"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="sm:hidden border-t border-midnight-border/60 bg-midnight-surface px-4 py-3 flex flex-col gap-1">
          <Link
            to="/announcements"
            onClick={closeMenu}
            className="px-2 py-2.5 rounded-lg text-sm text-muted hover:bg-midnight hover:text-ink transition-colors"
          >
            📣 Announcements
          </Link>
          <Link
            to="/featured"
            onClick={closeMenu}
            className="px-2 py-2.5 rounded-lg text-sm text-muted hover:bg-midnight hover:text-ink transition-colors"
          >
            🏆 Featured
          </Link>
          <Link
            to="/thoughts"
            onClick={closeMenu}
            className="px-2 py-2.5 rounded-lg text-sm text-muted hover:bg-midnight hover:text-ink transition-colors"
          >
            💭 Thoughts
          </Link>
          <Link
            to="/polls"
            onClick={closeMenu}
            className="px-2 py-2.5 rounded-lg text-sm text-muted hover:bg-midnight hover:text-ink transition-colors"
          >
            🗳️ Polls
          </Link>
          {session ? (
            <>
              <Link
                to="/notifications"
                onClick={closeMenu}
                className="px-2 py-2.5 rounded-lg text-sm text-muted hover:bg-midnight hover:text-ink transition-colors flex items-center gap-2"
              >
                🔔 Notifications
                {unreadCount > 0 && (
                  <span className="bg-heart-red text-white text-[10px] leading-none rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              {profile && (
                <span className="px-2 py-1 text-xs text-muted">
                  🪙 {profile.coins ?? 0} coins · 🌟 {profile.fame ?? 0} fame
                </span>
              )}
              <Link
                to="/spin"
                onClick={closeMenu}
                className="px-2 py-2.5 rounded-lg text-sm text-muted hover:bg-midnight hover:text-ink transition-colors"
              >
                🎡 Spin
              </Link>
              <Link
                to="/messages"
                onClick={closeMenu}
                className="px-2 py-2.5 rounded-lg text-sm text-muted hover:bg-midnight hover:text-ink transition-colors"
              >
                💌 Messages
              </Link>
              {profile?.username && (
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="px-2 py-2.5 rounded-lg text-sm font-mono text-muted hover:bg-midnight hover:text-ink transition-colors"
                >
                  @{profile.username}
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="px-2 py-2.5 rounded-lg text-sm text-left text-heart-red hover:bg-midnight transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={closeMenu}
              className="px-2 py-2.5 rounded-lg text-sm text-muted hover:bg-midnight hover:text-ink transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
