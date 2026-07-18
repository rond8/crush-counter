import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PUBLIC_LINKS = [
  { to: '/dashboard', icon: '💜', label: 'Home', authOnly: true },
  { to: '/announcements', icon: '📣', label: 'Announcements' },
  { to: '/featured', icon: '🏆', label: 'Featured' },
  { to: '/thoughts', icon: '💭', label: 'Thoughts' },
  { to: '/polls', icon: '🗳️', label: 'Polls' },
]

const AUTH_LINKS = [
  { to: '/spin', icon: '🎡', label: 'Spin' },
  { to: '/inventory', icon: '🎒', label: 'Inventory' },
  { to: '/messages', icon: '💌', label: 'Messages' },
  { to: '/notifications', icon: '🔔', label: 'Notifications', badge: true },
  { to: '/premium', icon: '👑', label: 'Premium' },
  { to: '/profile', icon: '👤', label: 'Profile' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
]

export default function Sidebar({ open, onClose }) {
  const { session, profile, signOut, unreadCount } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    onClose()
    await signOut()
    navigate('/login')
  }

  const isActive = (to) => location.pathname === to

  const linkClass = (to) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
      isActive(to)
        ? 'bg-heart-purple/15 text-ink font-semibold'
        : 'text-muted hover:bg-midnight-surface hover:text-ink'
    }`

  return (
    <>
      {/* Backdrop, mobile only, when the drawer is open */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-midnight-surface border-r border-midnight-border/60
          flex flex-col transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-midnight-border/60">
          <Link
            to="/"
            onClick={onClose}
            className="font-display text-xl tracking-tight"
          >
            crush<span className="text-heart-purple">counter</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-muted hover:text-ink"
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {PUBLIC_LINKS.filter((l) => !l.authOnly || session).map((l) => (
            <Link key={l.to} to={l.to} onClick={onClose} className={linkClass(l.to)}>
              <span className="text-lg leading-none">{l.icon}</span>
              {l.label}
            </Link>
          ))}

          {session && (
            <>
              <div className="h-px bg-midnight-border/60 my-3" />
              {AUTH_LINKS.map((l) => (
                <Link key={l.to} to={l.to} onClick={onClose} className={linkClass(l.to)}>
                  <span className="text-lg leading-none relative">
                    {l.icon}
                    {l.badge && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1.5 bg-heart-red text-white text-[9px] leading-none rounded-full min-w-[14px] h-3.5 px-0.5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </span>
                  {l.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-midnight-border/60 px-4 py-4 space-y-3">
          {session ? (
            <div className="space-y-3">
              {profile && (
                <div className="flex items-center justify-between text-xs text-muted px-1">
                  <span className="font-mono text-ink truncate">@{profile.username}</span>
                  <span className="whitespace-nowrap">🪙 {profile.coins ?? 0}</span>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 rounded-xl text-sm text-heart-red hover:bg-midnight transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className="btn-primary w-full inline-flex justify-center !py-2.5 text-sm"
            >
              Sign in
            </Link>
          )}

          <div className="flex items-center justify-center gap-3 text-xs text-muted pt-1">
            <a
              href="https://privpol.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink hover:underline"
            >
              Privacy
            </a>
            <span aria-hidden="true">·</span>
            <Link to="/support" onClick={onClose} className="hover:text-ink hover:underline">
              Support
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
