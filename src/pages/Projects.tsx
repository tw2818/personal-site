import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const SUPABASE_URL = 'https://osteeuwotaywuqsztipz.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdGVldXdvdGF5d3Vxc3p0aXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTk0MzMsImV4cCI6MjA4OTU3NTQzM30.wgHZxt9bDT4eWg6beHzZUMsMwnDoIexU_nHUudneSJM'

interface Project {
  id: string
  name: string
  description: string
  cover_url: string
  github_url: string
  demo_url: string
  featured: boolean
}

export default function Projects() {
  const { user } = useAuth()
  const isAdmin = user?.user_metadata?.user_name === 'tw2818'
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)

    const doFetch = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/projects?select=*&order=featured.desc`,
          {
            headers: {
              apikey: ANON_KEY,
              Authorization: `Bearer ${ANON_KEY}`,
            },
            signal: controller.signal,
          }
        )
        clearTimeout(timer)
        const data = await res.json()
        setProjects(Array.isArray(data) ? data : [])
      } catch {
        clearTimeout(timer)
        setProjects([])
      } finally {
        setLoading(false)
      }
    }
    doFetch()

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [])

  return (
    <div className="page">
      <div className="section">
        <motion.h1 className="section-title" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>项目</motion.h1>
        <motion.p className="section-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>实验、作品与折腾</motion.p>

        {isAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ marginBottom: '2rem' }}>
            <Link to="/projects/new" className="btn btn-primary">➕ 新增项目</Link>
          </motion.div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem' }}>加载中...</div>
        ) : projects.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>💼</p>
            <p>还没有项目，{user ? <Link to="/projects/new" style={{ color: 'var(--accent)' }}>添加一个</Link> : '敬请期待'}。</p>
          </motion.div>
        ) : (
          <div className="card-grid">
            {projects.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -6, scale: 1.01 }}
              >
                <div className="card">
                  {p.cover_url && <img src={p.cover_url} alt={p.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, marginBottom: '1rem' }} />}
                  <h3>{p.featured ? '⭐ ' : ''}{p.name}</h3>
                  <p>{p.description || '暂无描述'}</p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    {p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>🐙 源码</a>}
                    {p.demo_url && <a href={p.demo_url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>🔗 演示</a>}
                    {isAdmin && <a href={`/projects/${p.id}/edit`} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>✏️ 编辑</a>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
