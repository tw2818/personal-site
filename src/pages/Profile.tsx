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
      <div className="profile-header">
        <motion.img src={avatar} alt="avatar" className="avatar"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} />
        <motion.h1 className="section-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} viewport={{ once: true }} style={{ marginBottom: '0.5rem' }}>
          {name}
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.4 }} viewport={{ once: true }} style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {profile?.bio || '这个人很懒，什么都没写'}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.4 }} viewport={{ once: true }} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {profile?.github && <a href={`https://github.com/${profile.github}`} target="_blank" rel="noreferrer" className="btn btn-secondary">🐙 GitHub</a>}
          {profile?.bilibili && <span className="btn btn-secondary">📺 {profile.bilibili}</span>}
          {profile?.twitter && <span className="btn btn-secondary">🐦 {profile.twitter}</span>}
        </motion.div>
        {user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.3 }} viewport={{ once: true }}>
            <Link to="/admin" className="btn btn-primary">✏️ 编辑资料</Link>
          </motion.div>
        )}
      </div>

      <div className="section">
        <div className="card-grid">
          {[
            { icon: '📝', title: `${blogCount} 篇博客`, desc: '技术思考与生活记录' },
            { icon: '💼', title: `${projectCount} 个项目`, desc: '有趣的实验与作品' },
            { icon: '🎓', title: '前端开发者', desc: '热爱技术，热爱生活' },
          ].map((item, i) => (
            <motion.div key={item.title} className="card" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + i * 0.1, duration: 0.4, ease: 'easeOut' }} viewport={{ once: true }} whileHover={{ scale: 1.02 }}>
              <div className="card-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
