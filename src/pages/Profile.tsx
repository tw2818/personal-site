import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [blogCount, setBlogCount] = useState(0)
  const [projectCount, setProjectCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      // Hardcode admin profile ID to avoid github lookup issues
      const ADMIN_ID = '0f673692-97e2-4208-9af1-3b82f038a982'
      const { data } = await supabase.from('profiles').select('*').eq('id', ADMIN_ID).single()
      setProfile(data)
      const adminId = data?.id
      if (adminId) {
        const [{ count: bc }, { count: pc }] = await Promise.all([
          supabase.from('blogs').select('*', { count: 'exact', head: true }).eq('user_id', adminId).eq('published', true),
          supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', adminId),
        ])
        setBlogCount(bc || 0)
        setProjectCount(pc || 0)
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
