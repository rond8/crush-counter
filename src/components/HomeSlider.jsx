import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { watchRewardedAd } from '../lib/ads'
import { useAuth } from '../context/AuthContext'

export default function HomeSlider() {
  const { profile, refreshProfile } = useAuth()
  const [slides, setSlides] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  const [watchingAd, setWatchingAd] = useState(false)
  const [adRewardChoice, setAdRewardChoice] = useState(null) // 'coins' or 'spin'

  useEffect(() => {
    async function fetchSlides() {
      const { data, error } = await supabase
        .from('home_slides')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true })

      if (!error && data) {
        setSlides(data)
      }
      setLoading(false)
    }
    fetchSlides()
  }, [])

  useEffect(() => {
    if (slides.length <= 1 || adRewardChoice) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, 4000)

    return () => clearInterval(timer)
  }, [slides, adRewardChoice])

  const handleAction = async (action) => {
    if (action === 'rewarded_ad') {
      setAdRewardChoice('coins') // Default or show a small selection
      return
    }
  }

  const handleWatchAd = async (type) => {
    if (watchingAd) return
    setWatchingAd(true)
    try {
      await watchRewardedAd(type)
      await refreshProfile()
      setAdRewardChoice(null)
      alert(type === 'coins' ? '🎬 +5 coins added!' : '🎬 +1 free spin added!')
    } catch (err) {
      alert(err.message)
    } finally {
      setWatchingAd(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full aspect-[21/9] bg-midnight-surface animate-pulse rounded-3xl mb-8" />
    )
  }

  if (slides.length === 0) return null

  return (
    <div className="relative w-full overflow-hidden rounded-3xl mb-8 group bg-midnight-surface border border-midnight-border shadow-2xl">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="w-full flex-shrink-0 relative aspect-[21/9]">
            {slide.image_url && (
              <img
                src={slide.image_url}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover opacity-60"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent p-6 flex flex-col justify-end">
              <h2 className="text-2xl font-display font-black text-ink italic leading-tight">
                {slide.title}
              </h2>
              {slide.description && (
                <p className="text-muted text-sm mt-1 line-clamp-2 max-w-[80%]">
                  {slide.description}
                </p>
              )}

              {adRewardChoice && slide.button_link === 'action:rewarded_ad' ? (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleWatchAd('coins')}
                    disabled={watchingAd}
                    className="btn-primary py-2 px-4 text-[10px] font-black italic uppercase tracking-widest inline-block"
                  >
                    {watchingAd ? '...' : '🪙 +5 Coins'}
                  </button>
                  <button
                    onClick={() => handleWatchAd('spin')}
                    disabled={watchingAd}
                    className="btn-primary py-2 px-4 text-[10px] font-black italic uppercase tracking-widest inline-block"
                  >
                    {watchingAd ? '...' : '🎡 Free Spin'}
                  </button>
                  <button
                    onClick={() => setAdRewardChoice(null)}
                    disabled={watchingAd}
                    className="btn-ghost py-2 px-3 text-[10px] font-bold uppercase tracking-widest"
                  >
                    X
                  </button>
                </div>
              ) : slide.button_text && slide.button_link && (
                <div className="mt-4">
                  {slide.button_link.startsWith('http') ? (
                    <a
                      href={slide.button_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary py-2 px-6 text-xs font-black italic uppercase tracking-widest inline-block"
                    >
                      {slide.button_text}
                    </a>
                  ) : slide.button_link.startsWith('action:') ? (
                    <button
                      onClick={() => handleAction(slide.button_link.replace('action:', ''))}
                      className="btn-primary py-2 px-6 text-xs font-black italic uppercase tracking-widest inline-block"
                    >
                      {slide.button_text}
                    </button>
                  ) : (
                    <Link
                      to={slide.button_link}
                      className="btn-primary py-2 px-6 text-xs font-black italic uppercase tracking-widest inline-block"
                    >
                      {slide.button_text}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === currentIndex ? 'bg-heart-purple w-4' : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
