import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getFameTier } from '../lib/fame'
import { handleImageError } from '../lib/utils'
import VerifiedBadge from './VerifiedBadge'

const NAV_SECTIONS = [
  {
    title: 'Explore',
    links: [
      {
        to: '/dashboard',
        label: 'Home',
        authOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
      {
        to: '/announcements',
        label: 'Announcements',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        ),
      },
      {
        to: '/event',
        label: 'Event',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        to: '/featured',
        label: 'Leaderboard',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Community',
    links: [
      {
        to: '/thoughts',
        label: 'Thoughts',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
      },
      {
        to: '/polls',
        label: 'Polls',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
      {
        to: '/art-corner',
        label: 'Art Corner',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        ),
      },
      {
        to: '/whispers',
        label: 'Whisper Wall',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Play',
    links: [
      {
        to: '/games',
        label: 'Games',
        authOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9h12M8 6v6m8-6v6M5 18h14a2 2 0 002-2v-4a5 5 0 00-5-5H8a5 5 0 00-5 5v4a2 2 0 002 2zm1-4h.01M18 14h.01" />
          </svg>
        ),
      },
      {
        to: '/teammates',
        label: 'Find Teammates',
        authOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m6-9a4 4 0 100-8 4 4 0 000 8zm8-1a3 3 0 100-6m4 13v-2a4 4 0 00-3-3.87" />
          </svg>
        ),
      },
      {
        to: '/spin',
        label: 'Spin',
        authOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
      },
      {
        to: '/inventory',
        label: 'Inventory',
        authOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        ),
      },
      {
        to: '/shop',
        label: 'Shop',
        authOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        ),
      },
      {
        to: '/missions',
        label: 'Missions',
        authOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Social',
    links: [
      {
        to: '/random-chat',
        label: 'Random Chat',
        authOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.25" fill="currentColor" />
            <circle cx="15.5" cy="8.5" r="1.25" fill="currentColor" />
            <circle cx="12" cy="12" r="1.25" fill="currentColor" />
            <circle cx="8.5" cy="15.5" r="1.25" fill="currentColor" />
            <circle cx="15.5" cy="15.5" r="1.25" fill="currentColor" />
          </svg>
        ),
      },
      {
        to: '/messages',
        label: 'Messages',
        authOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        to: '/notifications',
        label: 'Notifications',
        badge: true,
        authOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        ),
      },
      {
        to: '/friends',
        label: 'Friends',
        authOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Account',
    links: [
      {
        to: '/profile',
        label: 'Profile',
        authOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
      },
      {
        to: '/settings',
        label: 'Settings',
        authOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
    ],
  },
]

export default function Sidebar({ open, onClose }) {
  const { session, profile, signOut, unreadCount } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Track which sections are collapsed
  const [collapsedSections, setCollapsedSections] = useState({})

  const toggleSection = (title) => {
    setCollapsedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  // Auto-expand sections that contain the active route
  useEffect(() => {
    const activeSection = NAV_SECTIONS.find(section =>
      section.links.some(link => link.to === location.pathname)
    )
    if (activeSection) {
      setCollapsedSections(prev => ({
        ...prev,
        [activeSection.title]: false
      }))
    }
  }, [location.pathname])

  // Prevent background scrolling when sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleSignOut = async () => {
    onClose()
    await signOut()
    navigate('/login')
  }

  const isActive = (to) => location.pathname === to

  const linkClass = (to) => {
    const active = isActive(to)
    return `group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-heart-purple/15 text-ink font-semibold shadow-sm'
        : 'text-muted hover:bg-midnight hover:text-ink hover:translate-x-1'
    }`
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-midnight-surface/95 backdrop-blur-md border-r border-midnight-border/60
          flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Header Branding */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-midnight-border/50">
          <Link
            to="/"
            onClick={onClose}
            className="font-display text-2xl tracking-tight flex items-center gap-2 group"
          >
            <span>
              crush<span className="text-heart-purple drop-shadow-sm">counter</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-muted hover:text-ink hover:bg-midnight transition-colors"
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scrollbar-thin scrollbar-thumb-midnight-border">
          {NAV_SECTIONS.map((section) => {
            const visibleLinks = section.links.filter((link) => !link.authOnly || session)
            if (visibleLinks.length === 0) return null

            const isCollapsed = collapsedSections[section.title] ?? false

            return (
              <div key={section.title} className="space-y-1">
                {/* Collapsible Header */}
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted font-bold opacity-80 group-hover:text-ink transition-colors">
                      {section.title}
                    </p>
                  </div>
                  <svg
                    className={`w-3 h-3 text-muted transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"
                  >
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Animated Links Container */}
                <div className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100 mt-1'}`}>
                  {visibleLinks.map((link) => {
                    const active = isActive(link.to)
                    return (
                      <Link key={link.to} to={link.to} onClick={onClose} className={linkClass(link.to)}>
                        {active && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 bg-heart-purple rounded-r-full shadow-[0_0_8px_rgba(181,123,255,0.8)]" />
                        )}

                        <div className="flex items-center gap-3 truncate">
                          <span className={`transition-colors ${active ? 'text-heart-purple' : 'text-muted group-hover:text-ink'}`}>
                            {link.icon}
                          </span>
                          <span className="truncate">{link.label}</span>
                        </div>

                        {link.badge && unreadCount > 0 && (
                          <span className="bg-heart-red text-white text-[9px] font-bold leading-none rounded-full min-w-[15px] h-4 px-1 flex items-center justify-center shadow-md animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* User Card & Footer */}
        <div className="border-t border-midnight-border/60 p-4 space-y-4 bg-midnight/30">
          {session ? (
            <div className="space-y-3">
              {profile && (
                <div className="p-3 rounded-2xl bg-midnight border border-midnight-border/80 flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {profile.avatar_url ? (
                      <>
                        <img
                          src={profile.avatar_url}
                          alt={profile.username}
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-heart-purple/40"
                          onError={handleImageError}
                        />
                        <div className="avatar-fallback hidden w-8 h-8 rounded-full bg-heart-purple/20 text-heart-purple items-center justify-center font-bold text-xs">
                          {profile.username?.[0]?.toUpperCase()}
                        </div>
                      </>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-heart-purple/20 text-heart-purple flex items-center justify-center font-bold text-xs">
                        {profile.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 font-mono text-xs font-semibold text-ink truncate">
                        <span className="truncate">@{profile.username}</span>
                        {getFameTier(profile.fame).emoji}
                        <VerifiedBadge verified={Boolean(profile?.is_verified)} />
                      </div>
                      <span className="text-[11px] text-muted flex items-center gap-1">
                        Coins: <span className="font-semibold text-ink">{profile.coins ?? 0}</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="p-2 rounded-xl text-muted hover:text-heart-red hover:bg-heart-red/10 transition-colors"
                    title="Sign out"
                    aria-label="Sign out"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className="btn-primary w-full inline-flex justify-center !py-2.5 text-sm shadow-lg shadow-heart-purple/20"
            >
              Sign in
            </Link>
          )}

          {/* Secondary Links */}
          <div className="flex items-center justify-center gap-3 text-xs text-muted/80">
            <a
              href="https://privpol.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors"
            >
              Privacy
            </a>
            <span>•</span>
            <Link to="/faq" onClick={onClose} className="hover:text-ink transition-colors">
              FAQ
            </Link>
            <span>•</span>
            <Link to="/support" onClick={onClose} className="hover:text-ink transition-colors">
              Support
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}