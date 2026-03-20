import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const SUPABASE_URL = 'https://osteeuwotaywuqsztipz.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdGVldXdvdGF5d3Vxc3p0aXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTk0MzMsImV4cCI6MjA4OTU3NTQzM30.wgHZxt9bDT4eWg6beHzZUMsMwnDoIexU_nHUudneSJM'

// Direct REST API fetch with timeout - bypasses supabase client session issues
async function apiFetch(sql: string, params?: Record<string, string>): Promise<any> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
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
    const load = async () => {
      setLoading(true)
      try {
        const profileData = await apiFetch(`profiles?id=eq.${ADMIN_ID}&select=*`)
        setProfile(Array.isArray(profileData) ? profileData[0] : null)

        const bc = await apiFetch('blogs?select=id&user_id=eq.' + ADMIN_ID + '&published=eq.true&limit=1')
        const pc = await apiFetch('projects?select=id&user_id=eq.' + ADMIN_ID + '&limit=1')

        // Count from response headers
        setBlogCount(bc?.length || 0)
        setProjectCount(pc?.length || 0)
      } catch {
        // silently fail
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="page" style={{ textAlign: 'center', padding: '6rem' }}>加载中...</div>

  const avatar = profile?.avatar_url || 'https://github.com/github.png'
  const name = profile?.nickname || profile?.github || '未设置昵称'

  return (
    <div className="page">
      <div className="profile-header">
        <motion.img src={avatar} alt="avatar" className="avatar"
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }} />
        <motion.h1 className="section-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} style={{ marginBottom: '0.5rem' }}>
          {name}
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {profile?.bio || '这个人很懒，什么都没写'}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {profile?.github && <a href={`https://github.com/${profile.github}`} target="_blank" rel="noreferrer" className="btn btn-secondary">🐙 GitHub</a>}
          {profile?.bilibili && <span className="btn btn-secondary">📺 {profile.bilibili}</span>}
          {profile?.twitter && <span className="btn btn-secondary">🐦 {profile.twitter}</span>}
        </motion.div>
        {user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
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
            <motion.div key={item.title} className="card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }} whileHover={{ y: -4 }}>
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
