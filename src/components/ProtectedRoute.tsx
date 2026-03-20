import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ALLOWED_USER = 'tw2818'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>加载中...</div>
  if (!user) return <Navigate to="/login" replace />

  const githubUsername = user.user_metadata?.user_name || user.user_metadata?.preferred_username || ''
  if (githubUsername.toLowerCase() !== ALLOWED_USER) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>⚠️ 无权限访问</h2>
        <p style={{ color: 'var(--text-secondary)' }}>你没有管理权限，如需访问请联系站主。</p>
      </div>
    )
  }

  return <>{children}</>
}
