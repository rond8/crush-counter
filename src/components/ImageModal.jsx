import { useEffect } from 'react'

/**
 * A global, sleek lightbox to view images in full screen.
 */
export default function ImageModal({ src, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    // Prevent scrolling while modal is open
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'auto'
    }
  }, [onClose])

  if (!src) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 text-white hover:bg-white/10 rounded-full transition-all z-[110]"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>

      <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
        <img
          src={src}
          alt="Full screen preview"
          className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl animate-in zoom-in-95 duration-300"
        />

        <div className="absolute bottom-[-40px] left-0 right-0 text-center">
           <a
             href={src}
             target="_blank"
             rel="noopener noreferrer"
             className="text-[10px] font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors"
           >
             Open Original Image
           </a>
        </div>
      </div>
    </div>
  )
}
