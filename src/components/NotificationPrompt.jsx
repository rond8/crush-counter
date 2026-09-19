// src/components/NotificationPrompt.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { setupPhoneNotifications } from '../lib/notifications'

export default function NotificationPrompt() {
  const { user } = useAuth()
  const [showPrompt, setShowPrompt] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Only ask if notifications are supported and permission hasn't been decided yet
    if ('Notification' in window && Notification.permission === 'default') {
      // Check if user previously dismissed this banner in local storage
      const dismissed = localStorage.getItem('notif_prompt_dismissed')
      if (!dismissed) {
        setShowPrompt(true)
      }
    }
  }, [])

  const handleEnable = async () => {
    setLoading(true)
    try {
      const token = await setupPhoneNotifications(user?.id)
      if (token) {
        setShowPrompt(false)
      }
    } catch (err) {
      console.error('Permission denied or failed setup:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    // Remember dismissal so we don't spam the user
    localStorage.setItem('notif_prompt_dismissed', 'true')
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-midnight-surface/95 border border-heart-purple/40 p-4 rounded-2xl shadow-2xl backdrop-blur-md z-50 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-heart-purple/20 text-heart-purple">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-ink">Turn on Notifications?</h4>
          <p className="text-xs text-muted mt-0.5">
            Get instant alerts when someone likes your profile, sends a message, or matches with you!
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end mt-1">
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 text-xs text-muted hover:text-ink transition-colors"
        >
          Not now
        </button>
        <button
          onClick={handleEnable}
          disabled={loading}
          className="px-4 py-1.5 text-xs bg-heart-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          {loading ? 'Enabling...' : 'Enable Notifications'}
        </button>
      </div>
    </div>
  )
}