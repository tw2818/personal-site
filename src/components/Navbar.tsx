import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav style={{ padding: '1rem', background: '#1a1a2e', color: '#fff', display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>🏠 首页</Link>
      <Link to="/blog" style={{ color: '#fff', textDecoration: 'none' }}>📝 博客</Link>
      <Link to="/projects" style={{ color: '#fff', textDecoration: 'none' }}>💼 项目</Link>
      <Link to="/profile" style={{ color: '#fff', textDecoration: 'none' }}>👤 关于</Link>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
        {user ? (
          <>
            <Link to="/settings" style={{ color: '#fff', textDecoration: 'none' }}>⚙️ 设置</Link>
            <button onClick={handleLogout} style={{ background: '#e94560', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>退出</button>
          </>
        ) : (
          <Link to="/login" style={{ color: '#fff', textDecoration: 'none' }}>🔐 登录</Link>
        )}
      </div>
    </nav>
  )
}
