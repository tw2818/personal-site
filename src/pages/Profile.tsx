import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { SUPABASE_URL, ANON_KEY } from '../lib/config'


// Direct REST API fetch with 5s timeout - bypasses supabase client session issues
async function apiFetch(sql: string, params?: Record<string, string>): Promise<any> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    let url = `${SUPABASE_URL}/rest/v1/${sql}`
    if (params) {
      const qs = new URLSearchParams(params).toString()
      url += '?' + qs
    }
    const res = await fetch(url, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      signal: controller.signal,
    })
    const data = await res.json()
    clearTimeout(timer)
    return data
  } catch {
    clearTimeout(timer)
    return null
  }
}

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [blogCount, setBlogCount] = useState(0)
  const [projectCount, setProjectCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Admin ID hardcoded
  const ADMIN_ID = '92781200-e8ad-4271-aa1e-b90b9fcc091c'

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        // Parallelize all fetches into one Promise.all
        const [profileData, bc, pc] = await Promise.all([
          apiFetch(`profiles?id=eq.${ADMIN_ID}&select=*`),
          apiFetch(`blogs?select=id&user_id=eq.${ADMIN_ID}&published=eq.true&limit=1`),
          apiFetch(`projects?select=id&user_id=eq.${ADMIN_ID}&limit=1`),
        ])
        if (cancelled) return
        setProfile(Array.isArray(profileData) ? profileData[0] : null)
        setBlogCount(bc?.length || 0)
        setProjectCount(pc?.length || 0)
      } catch {
        // silently fail
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="page" style={{ textAlign: 'center', padding: '4rem' }}>
        加载中...
      </div>
    )
  }

  const avatar = profile?.avatar_url || 'https://github.com/github.png'
  const name = profile?.nickname || profile?.github || '未设置昵称'

  return (
    <div className="page">
      {/* Hero section - centered glass card */}
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '4rem 2rem 3rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          style={{
            textAlign: 'center',
            background: 'rgba(var(--bg-rgb), 0.18)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border)',
            borderRadius: 28,
            padding: '3rem 2.5rem',
            marginBottom: '2rem',
          }}
        >
          {/* Avatar */}
          <motion.img
            src={avatar}
            alt="avatar"
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              objectFit: 'cover',
              marginBottom: '1.5rem',
              border: '3px solid var(--border)',
              display: 'block',
              margin: '0 auto 1.5rem',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          />
          {/* Name */}
          <motion.h1
            style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.6rem', color: 'var(--text)' }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            {name}
          </motion.h1>
          {/* Bio */}
          <motion.p
            style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '2rem', maxWidth: 480, margin: '0 auto 2rem' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            {profile?.bio || '这个人很懒，什么都没写'}
          </motion.p>
          {/* Social links */}
          <motion.div
            style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: user ? '1.5rem' : 0 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            {profile?.github && (
              <a href={`https://github.com/${profile.github}`} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', background: 'rgba(var(--bg-rgb), 0.15)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: '0.88rem', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(var(--bg-rgb), 0.25)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(var(--bg-rgb), 0.15)'; e.currentTarget.style.transform = '' }}
              >🐙 GitHub</a>
            )}
            {profile?.bilibili && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', background: 'rgba(var(--bg-rgb), 0.15)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: '0.88rem' }}>📺 {profile.bilibili}</span>
            )}
            {profile?.twitter && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', background: 'rgba(var(--bg-rgb), 0.15)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: '0.88rem' }}>🐦 {profile.twitter}</span>
            )}
          </motion.div>
          {user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.3 }}
            >
              <Link to="/admin"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.2rem', background: 'var(--accent)', border: 'none', borderRadius: 10, color: '#fff', fontSize: '0.88rem', textDecoration: 'none', fontWeight: 500 }}
              >✏️ 编辑资料</Link>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Stats row */}
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 2rem 4rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { label: '博客', value: blogCount, icon: '📝' },
          { label: '项目', value: projectCount, icon: '💼' },
          { label: '身份', value: '开发者', icon: '🎓' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
            style={{
              background: 'rgba(var(--bg-rgb), 0.18)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              padding: '1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <div style={{ fontSize: '1.8rem' }}>{item.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{item.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
