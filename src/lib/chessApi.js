/**
 * Chess.com Public API Service
 * Reference: https://www.chess.com/news/view/published-data-api
 */

const CHESS_BASE_URL = 'https://api.chess.com/pub'

/**
 * Fetch basic profile data for a Chess.com user
 */
export async function getChessProfile(username) {
  if (!username) return null
  const player = encodeURIComponent(username.trim().toLowerCase())
  try {
    const res = await fetch(`${CHESS_BASE_URL}/player/${player}`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error('Chess.com profile not found')
    return await res.json()
  } catch (err) {
    console.error('Chess API Error (Profile):', err)
    return null
  }
}

/**
 * Fetch rating stats (Bullet, Blitz, Rapid, etc.) for a user
 */
export async function getChessStats(username) {
  if (!username) return null
  const player = encodeURIComponent(username.trim().toLowerCase())
  try {
    const res = await fetch(`${CHESS_BASE_URL}/player/${player}/stats`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error('Chess.com stats not found')
    return await res.json()
  } catch (err) {
    if (err.message !== 'Chess.com stats not found') console.error('Chess API Error (Stats):', err)
    return null
  }
}

/**
 * Build a lightweight rating history from the player's public monthly games.
 * Chess.com exposes current stats and game archives, but not a standalone
 * rating-history endpoint.
 */
export async function getChessRatingHistory(username) {
  if (!username) return []

  try {
    const player = username.trim().toLowerCase()
    const archivesRes = await fetch(`${CHESS_BASE_URL}/player/${player}/games/archives`)
    if (!archivesRes.ok) return []

    const archives = (await archivesRes.json()).archives || []
    const recentArchives = archives.slice(-12)
    const months = await Promise.all(recentArchives.map(async (archive) => {
      const response = await fetch(archive)
      if (!response.ok) return []
      const games = (await response.json()).games || []

      return games.flatMap((game) => {
        const side = game.white?.username?.toLowerCase() === player ? game.white : game.black
        return side?.rating ? [{ date: game.end_time, rating: side.rating }] : []
      })
    }))

    return months.flat().sort((a, b) => a.date - b.date).slice(-30)
  } catch (err) {
    console.error('Chess API Error (Rating History):', err)
    return []
  }
}

/**
 * Get a list of "titled" players (GM, IM, etc.) to show as featured challenges
 */
export async function getTitledPlayers(title = 'GM') {
  try {
    const res = await fetch(`${CHESS_BASE_URL}/titled/${title}`)
    const data = await res.json()
    // Just return first 20 for brevity
    return data.players?.slice(0, 20) || []
  } catch (err) {
    return []
  }
}

/**
 * Helper to generate a casual 1v1 challenge link
 * Note: Chess.com doesn't have an API to "start" a match directly for 3rd parties,
 * but we can link users to the "Play" page or specific challenge URLs.
 */
export function getCasualMatchLink(username) {
  if (!username) return 'https://www.chess.com/play/online'
  return `https://www.chess.com/play/${username.trim().toLowerCase()}`
}
