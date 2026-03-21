import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { ANON_KEY, ADMIN_USER } from '../lib/config'

const SUPABASE_URL = 'https://osteeuwotaywuqsztipz.supabase.co'

function TiltCard({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springX = useSpring(x, { stiffness: 200, damping: 25 })
  const springY = useSpring(y, { stiffness: 200, damping: 25 })

  const rotateX = useTransform(springY, [-0.5, 0.5], [8, -8])
  const rotateY = useTransform(springX, [-0.5, 0.5], [-8, 8])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) / rect.width)
    y.set((e.clientY - centerY) / rect.height)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 }}
      whileHover={{ scale: 1.02, y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className={className} style={{ ...style, transform: 'translateZ(20px)' }}>
        {children}
      </div>
    </motion.div>
  )
}

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
    const isAdmin = user?.user_metadata?.user_name === ADMIN_USER
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
            <motion.p
              className="empty-state-icon"
              style={{ fontSize: '3rem', marginBottom: '1rem' }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >💼</motion.p>
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
              >
                <TiltCard className="card">
                  {p.cover_url && <img src={p.cover_url} alt={p.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, marginBottom: '1rem' }} />}
                  <h3>{p.featured ? '⭐ ' : ''}{p.name}</h3>
                  <p>{p.description || '暂无描述'}</p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    {p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>🐙 源码</a>}
                    {p.demo_url && <a href={p.demo_url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>🔗 演示</a>}
                    {isAdmin && <a href={`/projects/${p.id}/edit`} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>✏️ 编辑</a>}
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
