// Service for external API integrations: TMDB & Dating Icebreakers

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '124cfbe3b497b7b137f8f94d3c64c76f' // Robust public/fallback demo key
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

/**
 * Fetch daily trending movies from TMDB for discovery
 */
export async function getTrendingMovies() {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/trending/movie/day?api_key=${TMDB_API_KEY}&language=en-US`)
    if (!res.ok) throw new Error('Failed to fetch trending movies')
    const data = await res.json()
    return (data.results || []).map(m => ({
      id: m.id,
      title: m.title,
      overview: m.overview,
      poster: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500',
      rating: m.vote_average?.toFixed(1) || '0.0',
      releaseDate: m.release_date
    }))
  } catch (err) {
    console.error(err)
    // Return high-quality mock fallbacks if the key/network fails
    return [
      { id: 1, title: 'La La Land', overview: 'A jazz pianist and an aspiring actress fall in love while pursuing their dreams in Los Angeles.', poster: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500', rating: '8.5', releaseDate: '2016-12-09' },
      { id: 2, title: 'About Time', overview: 'At the age of 21, Tim discovers he can travel in time and change what happens in his own life.', poster: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=500', rating: '8.1', releaseDate: '2013-09-04' },
      { id: 3, title: 'The Notebook', overview: 'An epic love story centered around an older man who reads aloud to a woman with Alzheimer\'s.', poster: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500', rating: '7.8', releaseDate: '2004-06-25' }
    ]
  }
}

/**
 * Search movies on TMDB based on user query
 */
export async function searchMovies(query) {
  if (!query.trim()) return []
  try {
    const res = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`)
    if (!res.ok) throw new Error('Failed to search movies')
    const data = await res.json()
    return (data.results || []).map(m => ({
      id: m.id,
      title: m.title,
      overview: m.overview,
      poster: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500',
      rating: m.vote_average?.toFixed(1) || '0.0',
      releaseDate: m.release_date
    }))
  } catch (err) {
    console.error(err)
    return []
  }
}

// Collection of pre-curated high-engagement conversation icebreakers and prompts
const ICEBREAKERS = [
  "If we could teleport anywhere in the world right now for a 1-hour date, where are we going? ✈️",
  "What is your ultimate comfort movie or series that you can recite line-by-line? 🍿",
  "Are you a morning coffee planner or a midnight random drive talker? ☕🌃",
  "What's a completely harmless conspiracy theory that you fully believe in? 👽",
  "If your current crush or vibe had a theme song, what would it be? 🎵",
  "What's the most adventurous or spontaneous thing you've ever done on a whim? 🌊",
  "Would you rather go to a high-end fancy restaurant or eat street food in pajamas? 🍕",
  "What is your absolute biggest green flag in a person's profile? 💚",
  "If you had 100 free coins in an app right now, would you spin the wheel or gift someone fame? 🪙"
]

/**
 * Returns a random conversational icebreaker to help users start chat threads
 */
export function getRandomIcebreaker() {
  const index = Math.floor(Math.random() * ICEBREAKERS.length)
  return ICEBREAKERS[index]
}

/**
 * Dynamically builds a contextual movie-night invitation pitch or question
 */
export function generateMovieIcebreaker(movieTitle) {
  const pitches = [
    `Hey! I was thinking about watching "${movieTitle}" this week. Have you seen it yet, or should we watch it together? 🎬`,
    `Scale of 1-10, how much do you love movies like "${movieTitle}"? Let's chat over some virtual popcorn! 🍿`,
    `If we were character archetypes in a movie like "${movieTitle}", would we be rivals, best friends, or the main couple? 😉`
  ]
  return pitches[Math.floor(Math.random() * pitches.length)]
}
