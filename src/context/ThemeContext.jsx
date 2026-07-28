import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const THEME_STORAGE_KEY = 'crush-counter-theme'
const PREFERENCES_STORAGE_KEY = 'crush-counter-preferences'

const defaultPreferences = {
  soundEffects: true,
  reduceMotion: false,
  compactMode: false,
  showItemHints: true,
}

const ThemeContext = createContext(null)

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialPreferences() {
  if (typeof window === 'undefined') return defaultPreferences
  try {
    const stored = JSON.parse(window.localStorage.getItem(PREFERENCES_STORAGE_KEY) || 'null')
    return { ...defaultPreferences, ...(stored || {}) }
  } catch (err) {
    return defaultPreferences
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)
  const [preferences, setPreferences] = useState(getInitialPreferences)

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    document.documentElement.classList.toggle('light', theme === 'light')
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
    document.documentElement.classList.toggle('reduce-motion', preferences.reduceMotion)
    document.documentElement.classList.toggle('compact', preferences.compactMode)
  }, [preferences])

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))

  const setPreference = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const resetPreferences = () => setPreferences(defaultPreferences)

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme, preferences, setPreference, resetPreferences }),
    [theme, preferences],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
