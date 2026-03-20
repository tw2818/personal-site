import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const SUPABASE_URL = 'https://osteeuwotaywuqsztipz.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdGVldXdvdGF5d3Vxc3p0aXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTk0MzMsImV4cCI6MjA4OTU3NTQzM30.wgHZxt9bDT4eWg6beHzZUMsMwnDoIexU_nHUudneSJM'

interface Blog {
  id: string
  title: string
  content: string
  cover_url: string
  tags: string[]
  published: boolean
  created_at: string
}

export default function Blog() {
  const { user } = useAuth()
  const isAdmin = user?.user_metadata?.user_name === 'tw2818'
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'published' | 'drafts'>('published')

  const fetchBlogs = async () => {
    setLoading(true)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    try {
      const filter = tab === 'published' ? 'published=eq.true' : 'published=eq.false'
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/blogs?${filter}&select=*&order=created_at.desc`,
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
      setBlogs(Array.isArray(data) ? data : [])
    } catch {
      clearTimeout(timer)
      setBlogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'drafts' && !isAdmin) {
      setTab('published')
    } else {
      fetchBlogs()
    }
  }, [tab])

  const togglePublish = async (blog: Blog) => {
    await supabase.from('blogs').update({ published: !blog.published }).eq('id', blog.id)
    fetchBlogs()
  }

  return (
    <div className="page">
      <div className="section">
        <motion.h1 className="section-title" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>博客</motion.h1>
        <motion.p className="section-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>思考、实践、记录</motion.p>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {([
            { key: 'published', label: '📖 已发布' },
            ...(isAdmin ? [{ key: 'drafts', label: '📝 草稿箱' }] : []),
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.95rem', fontWeight: 500, padding: '0.6rem 1rem',
                color: tab === t.key ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.2s', marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
          {isAdmin && (
            <button
              onClick={() => window.location.href = '/blog/new'}
              style={{
                marginLeft: 'auto', background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: 980, padding: '0.4rem 1.2rem',
                cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
              }}
            >
              ✏️ 新建文章
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem' }}>加载中...</div>
        ) : blogs.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>{tab === 'published' ? '📖' : '📝'}</p>
            <p>{tab === 'published' ? '还没有已发布的文章' : '草稿箱是空的'}</p>
          </motion.div>
        ) : (
          <div className="item-list">
            {blogs.map((blog, i) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <div className="item" style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/blog/${blog.id}`}>
                  <span className="item-date">{new Date(blog.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' })}</span>
                  <div style={{ flex: 1 }}>
                    <h3>{blog.title}</h3>
                    {blog.tags?.length > 0 && (
                      <div className="tags">
                        {blog.tags.map(t => <span key={t} className="tag">{t}</span>)}
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePublish(blog) }}
                      style={{
                        background: blog.published ? 'transparent' : '#34c759',
                        border: '1px solid ' + (blog.published ? 'var(--border)' : '#34c759'),
                        color: blog.published ? 'var(--text-secondary)' : '#fff',
                        borderRadius: 8, padding: '0.25rem 0.6rem',
                        fontSize: '0.75rem', cursor: 'pointer', marginRight: '0.5rem',
                      }}
                      title={blog.published ? '撤回为草稿' : '发布'}
                    >
                      {blog.published ? '📮 存草稿' : '✅ 发布'}
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); window.location.href = `/blog/${blog.id}/edit` }}
                      style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '0.25rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', marginRight: '0.5rem' }}
                    >✏️</button>
                  )}
                  <span className="item-arrow">→</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
