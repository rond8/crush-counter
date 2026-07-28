import { useState, useEffect } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import Sidebar from './components/Sidebar'
import MobileTopBar from './components/MobileTopBar'
import BottomTabBar from './components/BottomTabBar'
import FloatingHearts from './components/FloatingHearts'
import Notifications from './components/Notifications'
import PullToRefresh from './components/PullToRefresh'
import BannerAd from './components/BannerAd'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Home from './pages/Home'
import Register from './pages/Register'
import CompleteProfile from './pages/CompleteProfile'
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
import RandomChat from './pages/RandomChat'
import Missions from './pages/Missions'
import Event from './pages/Event'
import Shop from './pages/Shop'
import Chat from './pages/Chat'
import Featured from './pages/Featured'
import Premium from './pages/Premium'
import Verify from './pages/Verify'
import Radar from './pages/Radar'
import NotificationsPage from './pages/NotificationsPage'
import LoadingScreen from './components/LoadingScreen'
import { useAuth } from './context/AuthContext'
import { supabase } from './supabaseClient'
import { initAds } from './lib/ads'

export default function App() {
  const { session, loading, profileIncomplete } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    initAds()
  }, [])

  // Catch the app being reopened via the custom URL scheme after
  // Google Sign-In completes in the system browser, and hand the
  // returned tokens to Supabase to finish the session.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const subPromise = CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
      if (!url.includes('login-callback')) return
      try {
        const hashPart = url.split('#')[1]
        if (!hashPart) return
        const params = new URLSearchParams(hashPart)
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token })
        }
      } catch {
        // Ignore malformed callback URLs — user can retry sign-in.
      }
    })

    return () => {
      subPromise.then((sub) => sub.remove())
    }
  }, [])

  // Close the mobile drawer automatically on every navigation.
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  if (loading) return <LoadingScreen />

  if (profileIncomplete && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />
  }

  return (
    <div className="min-h-screen lg:flex">
      <FloatingHearts />
      <PullToRefresh />
      <BannerAd />
      <Notifications />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <MobileTopBar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 pb-with-banner">
          <Routes>
            <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/event" element={<Event />} />
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
              path="/verify"
              element={
                <ProtectedRoute>
                  <Verify />
                </ProtectedRoute>
              }
            />
            <Route
              path="/radar"
              element={
                <ProtectedRoute>
                  <Radar />
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
              path="/random-chat"
              element={
                <ProtectedRoute>
                  <RandomChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/missions"
              element={
                <ProtectedRoute>
                  <Missions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shop"
              element={
                <ProtectedRoute>
                  <Shop />
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
          <p>Crush Counter, anonymous, until it's mutual.</p>
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