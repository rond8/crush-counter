import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { supabase } from '../supabaseClient'

/**
 * Full notification history for the current user, newest first.
 */
export async function getMyNotifications() {
  const { data, error } = await supabase.rpc('get_my_notifications')
  if (error) throw error
  return data ?? []
}

/**
 * Count of unread notifications, for a navbar badge.
 */
export async function getUnreadNotificationCount() {
  const { data, error } = await supabase.rpc('get_unread_notification_count')
  if (error) throw error
  return data ?? 0
}

export async function markNotificationRead(id) {
  const { error } = await supabase.rpc('mark_notification_read', { p_id: id })
  if (error) throw error
}

export async function markAllNotificationsRead() {
  const { error } = await supabase.rpc('mark_all_notifications_read')
  if (error) throw error
}

/**
 * Admin-only: send a personal notification to one specific user.
 */
export async function sendPersonalNotification(targetUsername, title, body) {
  const { error } = await supabase.rpc('send_personal_notification', {
    p_target_username: targetUsername.trim().toLowerCase(),
    p_title: title.trim(),
    p_body: body?.trim() || null,
  })
  if (error) throw error
}

/**
 * Admin-only: post an announcement. Any @username mentions in the
 * body that match real accounts get notified automatically.
 */
export async function postAnnouncement(title, body) {
  const { error } = await supabase.rpc('post_announcement', {
    p_title: title.trim(),
    p_body: body.trim(),
  })
  if (error) throw error
}

// ---------------------------------------------------------------
// Push notifications (Firebase Cloud Messaging via Capacitor)
// ---------------------------------------------------------------

let listenersAttached = false

/**
 * Request push permission and register this device.
 */
export async function setupPhoneNotifications(userId) {
  if (!Capacitor.isNativePlatform() || !userId) return

  let permStatus = await PushNotifications.checkPermissions()

  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions()
  }

  if (permStatus.receive !== 'granted') {
    return
  }

  if (!listenersAttached) {
    listenersAttached = true

    PushNotifications.addListener('registration', (token) => {
      savePushToken(userId, token.value).catch((err) => {
        console.error('Could not save push token:', err)
      })
    })

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err)
    })

    PushNotifications.addListener('pushNotificationReceived', () => {
    })

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const link = action.notification?.data?.link
      if (link) {
        window.location.href = link
      }
    })
  }

  await PushNotifications.register()
}

async function savePushToken(userId, token) {
  const platform = Capacitor.getPlatform()
  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      token,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token' }
  )
  if (error) throw error
}
