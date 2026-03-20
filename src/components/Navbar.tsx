import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'

export default function Navbar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.getAttribute('data-theme') === 'dark'
  )

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
    setIsDark(!isDark)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link to="/" className="nav-brand">tweb.</Link>
      <ul className="nav-links">
        <li><Link to="/">首页</Link></li>
        <li><Link to="/blog">博客</Link></li>
        <li><Link to="/projects">项目</Link></li>
        <li><Link to="/profile">关于</Link></li>
        <li>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="切换主题">
            {isDark ? '🌙' : '☀️'}
          </button>
        </li>
        {user ? (
          <>
            {user.user_metadata?.user_name === 'tw2818' && (
              <>
                <li><Link to="/admin">管理</Link></li>
                <li><Link to="/tags">标签</Link></li>
              </>
            )}
            <li><button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>退出</button></li>
          </>
        ) : (
          <li><Link to="/login"><button className="btn btn-primary" style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem' }}>登录</button></Link></li>
        )}
      </ul>
    </motion.nav>
  )
}
