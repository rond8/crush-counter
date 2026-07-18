import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { to: '/dashboard', icon: '💜', label: 'Home' },
  { to: '/notifications', icon: '🔔', label: 'Notif', badge: true },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
  { to: '/profile', icon: '👤', label: 'Profile' },
]

export default function BottomTabBar() {
  const { session, unreadCount } = useAuth()
  const location = useLocation()

  if (!session) return null

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-midnight-surface border-t border-midnight-border/60 flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map((tab) => {
        const active = location.pathname === tab.to
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
              active ? 'text-heart-purple' : 'text-muted hover:text-ink'
            }`}
          >
            <span className="text-xl leading-none relative">
              {tab.icon}
              {tab.badge && unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-heart-red text-white text-[9px] leading-none rounded-full min-w-[14px] h-3.5 px-0.5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
