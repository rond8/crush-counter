import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from './LoadingScreen'

export default function ProtectedRoute({ children }) {
  const { session, loading, isVerified } = useAuth()

  if (loading) return <LoadingScreen />

  if (!session) return <Navigate to="/login" replace />

  // If email is not verified, force them to the OTP page
  if (!isVerified) {
    return <Navigate to="/verify-otp" replace state={{ email: session.user.email }} />
  }

  return children
}
