import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const SUPABASE_URL = 'https://osteeuwotaywuqsztipz.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdGVldXdvdGF5d3Vxc3p0aXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTk0MzMsImV4cCI6MjA4OTU3NTQzM30.wgHZxt9bDT4eWg6beHzZUMsMwnDoIexU_nHUudneSJM'

interface RecentBlog {
  id: string
  title: string
  created_at: string
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as any },
  }),
}

const cards = [
  { icon: '📝', title: '博客', desc: '技术思考与生活记录', to: '/blog', color: '#0071e3' },
  { icon: '💼', title: '项目', desc: '有趣的实验与作品', to: '/projects', color: '#34c759' },
  { icon: '👤', title: '关于', desc: '了解我的背景与兴趣', to: '/profile', color: '#ff9500' },
]

export default function Home() {
  const [recentBlogs, setRecentBlogs] = useState<RecentBlog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecent = async () => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 5000)
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/blogs?select=id,title,created_at&published=eq.true&order=created_at.desc&limit=3`,
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
        setRecentBlogs(Array.isArray(data) ? data : [])
      } catch {
        clearTimeout(timer)
        setRecentBlogs([])
      } finally {
        setLoading(false)
      }
    }
    fetchRecent()
  }, [])

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero">
        <motion.h1
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          你好，我叫 twebery。
        </motion.h1>
        <motion.p
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          前端开发者 / AI 探索者 / 终身学习者。
          <br />在这里分享技术、项目与想法。
        </motion.p>
        <motion.div
          className="hero-cta"
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <Link to="/blog" className="btn btn-primary">📝 看看博客</Link>
          <Link to="/projects" className="btn btn-secondary">💼 项目展示</Link>
        </motion.div>
      </section>

      {/* Card Grid */}
      <section style={{ padding: '0 2rem 8rem', maxWidth: 1200, margin: '0 auto' }}>
        <div className="card-grid">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Link to={card.to} style={{ display: 'block' }}>
                <div className="card" style={{ height: '100%' }}>
                  <div className="card-icon">{card.icon}</div>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                  <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: card.color, fontSize: '0.9rem', fontWeight: 500 }}>
                    探索 <span style={{ transition: 'transform 0.2s' }}>→</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent blogs teaser */}
      <section className="section" style={{ background: 'var(--bg-secondary)', borderRadius: '24px', maxWidth: 1100, margin: '0 auto', border: '1px solid var(--border)' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ padding: '3rem' }}
        >
          <h2 className="section-title" style={{ marginBottom: '2rem' }}>最近的文章</h2>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>加载中...</div>
          ) : recentBlogs.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
              <p>还没有已发布的文章</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentBlogs.map((blog, i) => (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <Link to={`/blog/${blog.id}`}>
                    <div className="item">
                      <span className="item-date">{new Date(blog.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' })}</span>
                      <h3>{blog.title}</h3>
                      <span className="item-arrow">→</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <Link to="/blog" className="btn btn-secondary">查看全部 →</Link>
          </div>
        </motion.div>
      </section>

      <footer className="footer">
        <p>© 2026 twebery. 用 React + Supabase + Vercel 构建。</p>
      </footer>
    </div>
  )
}
