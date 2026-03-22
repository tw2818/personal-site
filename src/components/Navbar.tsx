import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ADMIN_USER } from '../lib/config'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.getAttribute('data-theme') === 'dark'
  )
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
    setIsDark(!isDark)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
    setMobileMenuOpen(false)
  }

  const navLinks = [
    { to: '/', label: '首页' },
    { to: '/blog', label: '博客' },
    { to: '/projects', label: '项目' },
    { to: '/profile', label: '关于' },
  ]

  return (
    <>
      <motion.nav
        className="navbar"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Link to="/" className="nav-brand">tweb.</Link>
        <ul className="nav-links">
          {navLinks.map(link => (
            <li key={link.to}><Link to={link.to}>{link.label}</Link></li>
          ))}
          {user && user.user_metadata?.user_name === ADMIN_USER && (
            <li><Link to="/admin">管理</Link></li>
          )}
          <li>
            <button className="theme-toggle" onClick={toggleTheme} aria-label="切换主题">
              {isDark ? '🌙' : '☀️'}
            </button>
          </li>
          {user ? (
            <li><button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>退出</button></li>
          ) : (
            <li><Link to="/login"><button className="btn btn-primary" style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem' }}>登录</button></Link></li>
          )}
        </ul>
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="菜单"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </motion.nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {navLinks.map((link, i) => (
              <motion.div
                key={link.to}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
            {user && user.user_metadata?.user_name === ADMIN_USER && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navLinks.length * 0.05 }}
              >
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>管理</Link>
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (navLinks.length + 1) * 0.05 }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <button
                onClick={() => { toggleTheme(); setMobileMenuOpen(false) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: '1rem' }}
              >
                {isDark ? '🌙' : '☀️'}
              </button>
            </motion.div>
            {user ? (
              <motion.button
                onClick={handleLogout}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (navLinks.length + 2) * 0.05 }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'left' }}
              >
                退出
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (navLinks.length + 2) * 0.05 }}
              >
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <button className="btn btn-primary" style={{ width: '100%' }}>登录</button>
                </Link>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
