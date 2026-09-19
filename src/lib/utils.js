/**
 * Ensures an image URL is properly formatted and adds a small cache-busting
 * timestamp if requested.
 */
export function normalizeImageUrl(url) {
  if (!url) return null;
  // Adds a cache-busting parameter to ensure the latest version is loaded
  // especially if the user just updated their photo.
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

/**
 * Handle image loading errors by providing a fallback or hiding the element.
 */
export function handleImageError(e) {
  // If the error was already handled or it's a 404, show fallback
  e.target.style.display = 'none';
  const parent = e.target.parentElement;
  if (parent) {
    const fallback = parent.querySelector('.avatar-fallback');
    if (fallback) {
      fallback.style.display = 'flex';
      // Ensure the fallback takes up the same space
      fallback.style.width = e.target.style.width || '100%';
      fallback.style.height = e.target.style.height || '100%';
    }
  }
}
