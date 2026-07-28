import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const SIDE_TABS = [
  {
    to: '/dashboard',
    label: 'Home',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    to: '/spin',
    label: 'Spin',
    icon: (
      <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18M3 12h18M12 12l6.36-6.36M12 12L5.64 18.36M12 12l6.36 6.36M12 12L5.64 5.64" />
      </svg>
    ),
  },
  {
    to: '/random-chat',
    label: 'Random',
    icon: (
      <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
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
    to: '/profile',
    label: 'Profile',
    icon: (
      <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

const HEART_ICON = (
  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
    <path d="M12 21s-6.7-4.35-9.33-8.24C1.02 10.5 1.5 7.3 4.1 5.6a5.4 5.4 0 017.9 1.9 5.4 5.4 0 017.9-1.9c2.6 1.7 3.08 4.9 1.43 7.16C18.7 16.65 12 21 12 21z" />
  </svg>
)

export default function BottomTabBar() {
  const { session, unreadCount } = useAuth()
  const location = useLocation()

  if (!session) return null

  const admirersActive = location.pathname === '/radar'
  // Split the side tabs evenly so the raised Admirers button sits
  // dead-center between them, regardless of how many tabs exist.
  const half = Math.ceil(SIDE_TABS.length / 2)
  const leftTabs = SIDE_TABS.slice(0, half)
  const rightTabs = SIDE_TABS.slice(half)

  const renderTab = (tab) => {
    const active = location.pathname === tab.to
    return (
      <Link
        key={tab.to}
        to={tab.to}
        className={`relative flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-medium transition-all duration-200 ${
          active ? 'text-heart-purple font-semibold scale-105' : 'text-muted hover:text-ink'
        }`}
      >
        {active && (
          <span className="absolute top-0 w-8 h-0.5 bg-heart-purple rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
        )}

        <span className="relative mb-0.5 flex items-center justify-center">
          {tab.icon}

          {tab.badge && unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[9px] font-bold leading-none rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center border-2 border-slate-900 shadow-md animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </span>
        <span>{tab.label}</span>
      </Link>
    )
  }

  return (
    <nav
      style={{ bottom: 'var(--banner-height, 0px)' }}
      className="lg:hidden fixed inset-x-0 z-30 bg-midnight-surface/95 backdrop-blur-md border-t border-midnight-border/60 flex items-stretch justify-around safe-area-bottom shadow-lg transition-[bottom] duration-300 ease-in-out overflow-visible"
    >
      {leftTabs.map(renderTab)}

      {/* Raised, larger, centered Admirers button */}
      <div className="relative flex-1 flex flex-col items-center justify-end">
        <Link
          to="/radar"
          aria-label="Admirers"
          className={`absolute -top-6 flex flex-col items-center gap-1 transition-transform duration-200 ${
            admirersActive ? 'scale-105' : 'hover:scale-105'
          }`}
        >
          <span
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-glow ring-4 ring-midnight transition-colors ${
              admirersActive
                ? 'bg-heart-purple text-midnight'
                : 'bg-gradient-to-br from-heart-purple to-heart-red text-white'
            }`}
          >
            {HEART_ICON}
          </span>
        </Link>
        <span
          className={`text-[10px] font-medium pb-2 pt-8 ${
            admirersActive ? 'text-heart-purple font-semibold' : 'text-muted'
          }`}
        >
          Admirers
        </span>
      </div>

      {rightTabs.map(renderTab)}
    </nav>
  )
}