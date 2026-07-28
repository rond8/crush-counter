import { Link } from 'react-router-dom'
import { isOnline } from '../lib/presence'
import { timeAgo } from '../lib/time'

const STATUS_CONFIG = {
  // Alias 'mutual' to your purple heart configuration
  mutual: {
    icon: '/images/hearts/purple.png',
    label: 'Mutual match',
    detail: 'You like them, and they like you back.',
    ring: 'ring-heart-purple/50',
    glow: 'shadow-glow',
    text: 'text-heart-purple',
  },
  // Alias 'competition' to your green heart configuration
  competition: {
    icon: '/images/hearts/green.png',
    label: 'Competition',
    detail: 'Someone else has also sent a heart to your crush.',
    ring: 'ring-heart-green/40',
    glow: '',
    text: 'text-heart-green',
  },
  // Alias 'yellow' / 'pending_invite' for unregistered users
  yellow: {
    icon: '/images/hearts/yellow.png',
    label: 'Invite needed',
    detail: "This username isn't on Crush Counter yet — invite them!",
    ring: 'ring-heart-yellow/40',
    glow: '',
    text: 'text-heart-yellow',
  },
  pending: {
    icon: '/images/hearts/pending.png',
    label: 'Sent',
    detail: 'Waiting to see if it’s mutual.',
    ring: 'ring-midnight-border',
    glow: '',
    text: 'text-muted',
  },
}

export default function HeartCard({ username, status, lastSeen }) {
  // Gracefully handle color names or status strings (e.g., 'purple' vs 'mutual')
  const statusKey = 
    status === 'purple' ? 'mutual' :
    status === 'green' ? 'competition' :
    status;

  const config = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending
  
  // Online status only makes sense once the account actually exists.
  const showPresence = statusKey !== 'yellow'
  const online = isOnline(lastSeen)

  return (
    <div className={`card ring-1 ${config.ring} ${config.glow} p-4 flex items-center gap-4`}>
      <img
        src={config.icon}
        alt={config.label}
        className={`w-9 h-9 shrink-0 ${statusKey === 'mutual' ? 'mutual-animate' : ''}`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          {showPresence ? (
            <Link to={`/u/${username}`} className="font-mono text-sm text-ink truncate hover:underline">
              @{username}
            </Link>
          ) : (
            <span className="font-mono text-sm text-ink truncate">@{username}</span>
          )}
          <span className={`text-xs font-semibold uppercase tracking-wide ${config.text}`}>
            {config.label}
          </span>
          {showPresence && (
            <span className="flex items-center gap-1 text-xs text-muted">
              <span
                className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-heart-green' : 'bg-midnight-border'}`}
                aria-hidden="true"
              />
              {online ? 'Online now' : lastSeen ? `Active ${timeAgo(lastSeen)}` : 'Offline'}
            </span>
          )}
        </div>
        <p className="text-sm text-muted mt-0.5">{config.detail}</p>
      </div>
    </div>
  )
}