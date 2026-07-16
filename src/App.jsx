import { Link, Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import FloatingHearts from './components/FloatingHearts'
import Notifications from './components/Notifications'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Home from './pages/Home'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Announcements from './pages/Announcements'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import Messages from './pages/Messages'
import UserProfile from './pages/UserProfile'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Support from './pages/Support'
import Settings from './pages/Settings'
import Thoughts from './pages/Thoughts'
import Polls from './pages/Polls'
import Spin from './pages/Spin'
import Chat from './pages/Chat'
import Featured from './pages/Featured'
import Premium from './pages/Premium'
import NotificationsPage from './pages/NotificationsPage'
import LoadingScreen from './components/LoadingScreen'
import { useAuth } from './context/AuthContext'
import { useEffect } from 'react'
import { initAds, maybeShowLaunchAd } from './lib/ads'

export default function App() {
  const { session, loading, profile } = useAuth()

  useEffect(() => {
    initAds()
  }, [])

  useEffect(() => {
    if (!profile) return
    const isPremium = (profile.fame ?? 0) >= 500 || Boolean(profile.premium_unlocked)
    if (isPremium) return

    maybeShowLaunchAd()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') maybeShowLaunchAd()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [profile])

  if (loading) return <LoadingScreen />

  return (
    <div className="min-h-screen flex flex-col">
      <FloatingHearts />
      <Notifications />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/support" element={<Support />} />
          <Route path="/thoughts" element={<Thoughts />} />
          <Route path="/polls" element={<Polls />} />
          <Route path="/featured" element={<Featured />} />
          <Route
            path="/premium"
            element={
              <ProtectedRoute>
                <Premium />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:username"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/spin"
            element={
              <ProtectedRoute>
                <Spin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/u/:username"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-muted py-6 space-y-1">
        <p>Crush Counter — anonymous, until it’s mutual.</p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="https://privpol.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink hover:underline"
          >
            Privacy Policy
          </a>
          <Link to="/support" className="hover:text-ink hover:underline">
            Support
          </Link>
        </div>
      </footer>
    </div>
  )
}
