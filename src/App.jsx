import { useState, useEffect } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import MobileTopBar from './components/MobileTopBar'
import BottomTabBar from './components/BottomTabBar'
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
import Inventory from './pages/Inventory'
import Chat from './pages/Chat'
import Featured from './pages/Featured'
import Premium from './pages/Premium'
import NotificationsPage from './pages/NotificationsPage'
import CompleteProfile from './pages/CompleteProfile'
import LoadingScreen from './components/LoadingScreen'
import { useAuth } from './context/AuthContext'
import { initAds } from './lib/ads'

export default function App() {
  const { session, loading, profile } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    initAds()
  }, [])

  // Note: the launch ad is no longer triggered here. It now fires
  // only from an explicit login action (see AuthContext.signIn),
  // never from app foreground/visibility events — that felt spammy
  // when it fired on every app-switch or lock/unlock.

  // Close the mobile drawer automatically on every navigation.
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  if (loading) return <LoadingScreen />

  const needsProfileCompletion = session && profile === null && location.pathname !== '/complete-profile'
  if (needsProfileCompletion) {
    return (
      <div className="min-h-screen flex flex-col">
        <FloatingHearts />
        <Routes>
          <Route path="*" element={<CompleteProfile />} />
        </Routes>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:flex">
      <FloatingHearts />
      <Notifications />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <MobileTopBar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 pb-20 lg:pb-0">
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
              path="/inventory"
              element={
                <ProtectedRoute>
                  <Inventory />
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

        <footer className="hidden lg:block text-center text-xs text-muted py-6 space-y-1">
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

        <BottomTabBar />
      </div>
    </div>
  )
}
