import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {['使用 Supabase 构建个人网站', 'React 19 新特性解析', 'AI Agent 开发实战'].map((title, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Link to="/blog">
                  <div className="item">
                    <span className="item-date">2026.03</span>
                    <h3>{title}</h3>
                    <span className="item-arrow">→</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
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
