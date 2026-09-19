import React from 'react'
import { Link } from 'react-router-dom'

const DEFAULT_PURPLE_HEART = '/images/hearts/purple.png'

export default function MutualMatchOverlay({ matches = [], myCrush, onClose, onAction }) {
  // 1. Resolve primary match object
  const primaryMatch = matches[0] || {}

  // 2. Safely grab avatar_url from whichever key it was stored in
  const avatarUrl =
    primaryMatch.avatar_url ||
    primaryMatch.target_avatar_url ||
    primaryMatch.avatar ||
    myCrush?.target_avatar_url ||
    myCrush?.avatar_url ||
    myCrush?.avatar

  // 3. Resolve username & initial
  const username =
    primaryMatch.username ||
    myCrush?.target_username ||
    'Crush'

  const initial = username[0]?.toUpperCase() || 'C'

  // 4. Generate background floating particles
  const particles = Array.from({ length: 14 }).map((_, i) => {
    const left = Math.floor(Math.random() * 88) + 4
    const delay = (Math.random() * 2).toFixed(2)
    const dur = (2.5 + Math.random() * 3).toFixed(2)
    const size = 32 + Math.floor(Math.random() * 20)

    const style = {
      left: `${left}%`,
      bottom: `${-10 - Math.random() * 10}vh`,
      width: `${size}px`,
      height: `${size}px`,
      animationDuration: `${dur}s`,
      animationDelay: `${delay}s`,
    }

    return (
      <div
        key={i}
        className="absolute animate-floatUp rounded-full ring-2 ring-purple-500/60 bg-slate-900 overflow-hidden shadow-lg flex items-center justify-center text-xs font-bold text-purple-300 opacity-80"
        style={style}
      >
        {i % 2 === 0 && avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={DEFAULT_PURPLE_HEART}
            alt="Purple Heart"
            className="w-full h-full object-contain p-1"
          />
        )}
      </div>
    )
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md transition-opacity animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      {/* Floating particles background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {particles}
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-purple-500/30 p-6 text-center shadow-2xl shadow-purple-900/50 space-y-5 animate-scaleUp">
        
        {/* Main Profile Avatar Ring */}
        <div className="relative mx-auto w-20 h-20 rounded-full ring-4 ring-purple-500 bg-slate-800 overflow-hidden flex items-center justify-center font-bold text-2xl text-purple-300 shadow-xl shadow-purple-500/30 animate-bounce">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initial}</span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-1">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-wide">
            It's a Match!
          </h2>
          <p className="text-sm text-slate-400">
            You and <span className="font-semibold text-purple-400">@{username}</span> liked each other.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {onAction && (
            <button
              onClick={() => onAction(primaryMatch)}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-600/30 active:scale-[0.98]"
            >
              Send Message
            </button>
          )}

          <Link
            to="/purple-heart"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-heart-purple/20 hover:bg-heart-purple/30 text-purple-100 font-semibold text-sm transition-all border border-heart-purple/30"
          >
            Open Shared Purple Heart
          </Link>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-sm transition-colors border border-slate-700/50"
          >
            Keep Exploring
          </button>
        </div>
      </div>
    </div>
  )
}