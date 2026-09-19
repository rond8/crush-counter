/**
 * Searches for musical artists using the iTunes Search API.
 * Returns a list of artist names.
 */
export async function searchArtists(query) {
  if (!query || query.trim().length < 2) return []

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=musicArtist&limit=5`
    const response = await fetch(url)
    const data = await response.json()

    return data.results.map(artist => ({
      name: artist.artistName,
      genre: artist.primaryGenreName,
      url: artist.artistLinkUrl
    }))
  } catch (err) {
    console.error('iTunes API error:', err)
    return []
  }
}
