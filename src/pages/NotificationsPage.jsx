import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../lib/notifications'
import { timeAgo } from '../lib/time'

const TYPE_CONFIG = {
  admirer: { icon: '❤️', accent: 'ring-heart-red/40' },
  admin_message: { icon: '📢', accent: 'ring-heart-purple/40' },
  mention: { icon: '📣', accent: 'ring-heart-yellow/40' },
  fame_gift: { icon: '🌟', accent: 'ring-heart-yellow/40' },
  priority: { icon: '⚔️', accent: 'ring-heart-yellow/40' },
  fame_loss: { icon: '🏹', accent: 'ring-heart-red/40' },
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { refreshUnreadCount } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const data = await getMyNotifications()
    setNotifications(data)
  }, [])

  useEffect(() => {
    refresh()
      .catch((err) => setError(err.message || 'Could not load notifications.'))
      .finally(() => setLoading(false))
  }, [refresh])

  const handleClick = async (n) => {
    if (!n.read_at) {
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
      )
      markNotificationRead(n.id)
        .then(refreshUnreadCount)
        .catch(() => {})
    }
    if (n.link) navigate(n.link)
  }

  const handleMarkAllRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    )
    try {
      await markAllNotificationsRead()
      await refreshUnreadCount()
    } catch (err) {
      setError(err.message || 'Could not mark all as read.')
    }
  }

  const hasUnread = notifications.some((n) => !n.read_at)

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl md:text-4xl">🔔 Notifications</h1>
        <p className="text-muted text-sm">Everything that's happened, in one place.</p>
      </section>

      {hasUnread && (
        <div className="text-right">
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-muted hover:text-ink transition-colors"
          >
            Mark all as read
          </button>
        </div>
      )}

      {error && <p className="text-heart-red text-sm text-center">{error}</p>}

      {loading ? (
        <p className="text-muted text-sm font-mono text-center">loading…</p>
      ) : notifications.length === 0 ? (
        <div className="card p-8 text-center text-muted text-sm">
          Nothing yet — new admirers, messages from the team, and mentions will show up here.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const config = TYPE_CONFIG[n.type] ?? {
              icon: '🔔',
              accent: 'ring-midnight-border',
            }
            const isUnread = !n.read_at
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left card p-4 flex items-start gap-3 ring-1 transition-shadow ${
                  isUnread ? config.accent : 'ring-midnight-border'
                } ${
                  n.link
                    ? 'hover:ring-heart-purple/40 cursor-pointer'
                    : 'cursor-default'
                }`}
              >
                <span className="text-2xl leading-none">{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <p
                      className={`text-sm ${
                        isUnread ? 'font-semibold text-ink' : 'text-muted'
                      }`}
                    >
                      {n.title}
                    </p>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-heart-purple shrink-0" />
                    )}
                  </div>
                  {n.body && <p className="text-sm text-muted mt-1">{n.body}</p>}
                  <p className="text-xs text-muted font-mono mt-1">
                    {timeAgo(n.created_at)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}