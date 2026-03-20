import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [loading, setLoading] = useState(false)

  const handleGitHubLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + '/',
      },
    })
    if (error) {
      alert(error.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '2rem', border: '1px solid #ddd', borderRadius: '8px', maxWidth: '400px', width: '100%' }}>
        <h1>🔐 登录</h1>
        <p style={{ color: '#666', margin: '1rem 0' }}>使用 GitHub 账号登录</p>
        <button
          onClick={handleGitHubLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.8rem',
            fontSize: '1rem',
            background: '#24292e',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '跳转中...' : '✅ GitHub 登录'}
        </button>
      </div>
    </div>
  )
}
