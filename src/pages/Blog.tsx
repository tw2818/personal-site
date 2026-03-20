import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Blog {
  id: string
  title: string
  content: string
  cover_url: string
  tags: string[]
  created_at: string
}

export default function Blog() {
  const { user } = useAuth()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('blogs')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setBlogs(data || []); setLoading(false) })
  }, [])

  return (
    <div className="page">
      <div className="section">
        <motion.h1
          className="section-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          博客
        </motion.h1>
        <motion.p
          className="section-sub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          思考、实践、记录
        </motion.p>

        {user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ marginBottom: '2rem' }}
          >
            <Link to="/blog/new" className="btn btn-primary">✏️ 新建文章</Link>
          </motion.div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem' }}>加载中...</div>
        ) : blogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}
          >
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</p>
            <p>还没有文章，{user ? <Link to="/blog/new" style={{ color: 'var(--accent)' }}>写一篇</Link> : '敬请期待'}。</p>
          </motion.div>
        ) : (
          <div className="item-list">
            {blogs.map((blog, i) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ x: 6 }}
              >
                <Link to={`/blog/${blog.id}`}>
                  <div className="item">
                    <span className="item-date">{new Date(blog.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' })}</span>
                    <div style={{ flex: 1 }}>
                      <h3>{blog.title}</h3>
                      {blog.tags?.length > 0 && (
                        <div className="tags">
                          {blog.tags.map(t => <span key={t} className="tag">{t}</span>)}
                        </div>
                      )}
                    </div>
                    <span className="item-arrow">→</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
