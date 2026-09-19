const STORAGE_PREFIX = 'crush-counter:engagement:'

export const ACHIEVEMENTS = [
  { key: 'first_heart', title: 'First Spark', description: 'Send your first heart', event: 'send_heart', target: 1, icon: '💜' },
  { key: 'heart_collector', title: 'Heart Collector', description: 'Send 3 hearts', event: 'send_heart', target: 3, icon: '💌' },
  { key: 'mission_maker', title: 'Mission Maker', description: 'Claim 3 mission rewards', event: 'claim_mission', target: 3, icon: '🎯' },
  { key: 'week_warrior', title: 'Week Warrior', description: 'Check in on 7 different days', event: 'active_day', target: 7, icon: '🔥' },
]

function emptySnapshot() {
  return { events: {}, activeDays: [], streak: 0, lastActiveDate: null }
}

function storageKey(userId) {
  return `${STORAGE_PREFIX}${userId}`
}

function readSnapshot(userId) {
  if (!userId) return emptySnapshot()
  try {
    return { ...emptySnapshot(), ...JSON.parse(localStorage.getItem(storageKey(userId)) || '{}') }
  } catch {
    return emptySnapshot()
  }
}

function writeSnapshot(userId, snapshot) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(snapshot))
  } catch {
    // Engagement should never block the core action when storage is unavailable.
  }
}

export function getGamificationSnapshot(userId) {
  const snapshot = readSnapshot(userId)
  const achievements = ACHIEVEMENTS.map((achievement) => {
    const progress = achievement.event === 'active_day'
      ? snapshot.activeDays.length
      : snapshot.events[achievement.event] || 0
    return { ...achievement, progress: Math.min(progress, achievement.target), unlocked: progress >= achievement.target }
  })
  return { ...snapshot, achievements }
}

export function recordEngagementEvent(userId, event) {
  if (!userId) return getGamificationSnapshot(userId)
  const snapshot = readSnapshot(userId)
  const today = new Date().toISOString().slice(0, 10)

  snapshot.events[event] = (snapshot.events[event] || 0) + 1
  if (!snapshot.activeDays.includes(today)) {
    const yesterday = new Date(`${today}T00:00:00`)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = yesterday.toISOString().slice(0, 10)
    snapshot.streak = snapshot.lastActiveDate === yesterdayKey ? snapshot.streak + 1 : 1
    snapshot.lastActiveDate = today
    snapshot.activeDays = [...snapshot.activeDays, today].slice(-30)
  }

  writeSnapshot(userId, snapshot)
  return getGamificationSnapshot(userId)
}