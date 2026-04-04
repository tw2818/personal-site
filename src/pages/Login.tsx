import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function Login() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'idle' | 'redirecting' | 'exchanging'>('idle')
  const [error, setError] = useState<string | null>(null)

  // Redirect to home if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/')
    }
  }, [user, loading, navigate])

  // Detect OAuth code in URL — AuthContext handles exchange, we just show UI
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('code')) {
      setStatus('exchanging')
      setError(null)
    }
  }, [])

  const handleGitHubLogin = async () => {
    setStatus('redirecting')
    setError(null)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    })
    if (oauthError) {
      setError(oauthError.message)
      setStatus('idle')
    }
  }

  return (
    <div className="auth-container page">
      <motion.div
        className="auth-box"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}
        >
          🔐
        </motion.div>
        <h1>欢迎回来</h1>
        <p>使用 GitHub 账号登录，开始写博客和管理项目</p>

        {/* Error display */}
        {error && (
          <motion.div
            className="auth-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            ⚠️ {error}
          </motion.div>
        )}

        {/* Idle: show login button */}
        {status === 'idle' && (
          <motion.button
            className="github-btn github-btn--prominent"
            onClick={handleGitHubLogin}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            用 GitHub 登录
          </motion.button>
        )}

        {/* Redirecting: user clicked button, navigating to GitHub */}
        {status === 'redirecting' && (
          <motion.div
            className="auth-status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="spinner" />
            <span>正在跳转到 GitHub...</span>
          </motion.div>
        )}

        {/* Exchanging: code detected in URL, AuthContext is exchanging it */}
        {status === 'exchanging' && (
          <motion.div
            className="auth-status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="spinner" />
            <span>登录中，请稍候...</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
