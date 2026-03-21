import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SUPABASE_URL, ANON_KEY } from '../lib/config'


function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayText, setDisplayText] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay * 1000)
    return () => clearTimeout(startTimer)
  }, [delay])

  useEffect(() => {
    if (!started) return
    let i = 0
    const interval = setInterval(() => {
      if (i <= text.length) {
        setDisplayText(text.slice(0, i))
        i++
      } else {
        clearInterval(interval)
      }
    }, 60)
    return () => clearInterval(interval)
  }, [started, text])

  return <span>{displayText}<motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} style={{ display: displayText.length < text.length ? 'inline' : 'none' }}>|</motion.span></span>
}


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
          <TypewriterText text="你好，我叫 twebery。" delay={0.5} />
        </motion.h1>
        <motion.p
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          医学牲 / 牛马 / AI 探索者。
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
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '4rem 2rem' }}>
        <h2 className="section-title" style={{ marginBottom: '2.5rem', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>最近的文章</h2>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>加载中...</div>
        ) : recentBlogs.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
            <p>还没有已发布的文章</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.2rem' }}>
            {recentBlogs.map((blog, i) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Link to={`/blog/${blog.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'rgba(var(--bg-rgb), 0.15)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '1.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
                  >
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {new Date(blog.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.4, color: 'var(--text)' }}>{blog.title}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--accent)', marginTop: 'auto' }}>阅读 →</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
        {recentBlogs.length > 0 && (
          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <Link to="/blog" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 2rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: 'rgba(var(--bg-rgb), 0.12)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: 'var(--text)',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
            }}>查看全部文章 →</Link>
          </div>
        )}
      </section>

      <footer className="footer">
        <p>© 2026 twebery. 用 React + Supabase + Vercel 构建。</p>
      </footer>
    </div>
  )
}
