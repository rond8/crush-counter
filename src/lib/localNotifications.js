import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

const isNative = Capacitor.isNativePlatform()

export async function requestNotificationPermission() {
  if (!isNative) return false

  const permission = await LocalNotifications.requestPermissions()
  return permission.display === 'granted'
}

export async function scheduleLocalNotification({ id = Date.now(), title, body }) {
  if (!isNative) return

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title,
          body,
        },
      ],
    })
  } catch {
    // Ignore scheduling failures on unsupported platforms.
  }
}
