const STORAGE_KEY = 'crush-counter:game-leaderboards'

function readBoards() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function getGameLeaderboard(gameKey) {
  const boards = readBoards()
  const entries = boards[gameKey] || []
  return entries.sort((a, b) => gameKey === 'heart_match' ? a.score - b.score : b.score - a.score).slice(0, 10)
}

export function recordGameScore(gameKey, playerName, score) {
  const cleanName = playerName.trim().slice(0, 24)
  if (!cleanName) return

  const boards = readBoards()
  boards[gameKey] = [...(boards[gameKey] || []), {
    id: `${Date.now()}-${Math.random()}`,
    playerName: cleanName,
    score,
    playedAt: new Date().toISOString(),
  }]
    .sort((a, b) => gameKey === 'heart_match' ? a.score - b.score : b.score - a.score)
    .slice(0, 20)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boards))
  } catch {
    // Scores are optional and should never block a completed game.
  }
}

export function getGamePlayCount(gameKey) {
  return readBoards().plays?.[gameKey] || 0
}

export function recordGamePlay(gameKey) {
  const boards = readBoards()
  boards.plays = { ...(boards.plays || {}), [gameKey]: (boards.plays?.[gameKey] || 0) + 1 }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boards))
  } catch {
    // Play counts are optional and should never block a game.
  }
}

export function getGameQualification(gameKey, score) {
  if (gameKey === 'heart_match') {
    if (score <= 20) return 'Lightning'
    if (score <= 40) return 'Speedrunner'
    return 'Finisher'
  }
  if (gameKey === 'think_same') {
    if (score >= 5) return 'Mindreader'
    if (score >= 3) return 'Synced'
    return 'Warm-up'
  }
  return score > 0 ? 'Match winner' : 'Draw'
}