import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { SUPABASE_URL, ANON_KEY, ADMIN_USER } from '../lib/config'


interface Blog {
  id: string
  title: string
  content: string
  cover_url: string
  tags: string[]
  published: boolean
  created_at: string
}

interface Tag {
  id: string
  name: string
  slug: string
  color: string
}

export default function Blog() {
  const { user } = useAuth()
    const isAdmin = user?.user_metadata?.user_name === ADMIN_USER
  const navigate = useNavigate()
  const location = useLocation()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'published' | 'drafts'>('published')
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTag, setSelectedTag] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchBlogs = async () => {
    setLoading(true)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    try {
      const filter = tab === 'published' ? 'published=eq.true' : 'published=eq.false'
      const url = `${SUPABASE_URL}/rest/v1/blogs?${filter}&select=*&order=created_at.desc`
      const res = await fetch(url, {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`,
        },
        signal: controller.signal,
      })
      clearTimeout(timer)
      const data = await res.json()
      let results = Array.isArray(data) ? data : []
      results = results.map((b: any) => ({
        ...b,
        tags: (() => { try { return typeof b.tags === 'string' ? JSON.parse(b.tags) : (b.tags || []) } catch { return [] } })()
      }))
      // Tag filter is done client-side since cs. operator works differently
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        results = results.filter((b: any) =>
          b.title?.toLowerCase().includes(q) ||
          b.tags?.some((t: string) => t.toLowerCase().includes(q))
        )
      }
      setBlogs(results)
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
  }, [tab, searchQuery])

  const fetchTags = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/tags?select=*&order=name.asc`, {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      })
      const data = await res.json()
      if (Array.isArray(data)) setTags(data)
    } catch {}
  }

  useEffect(() => {
    fetchTags()
    // Refresh tags when page becomes visible or when a new tag is created on another page
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchTags() }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('tags-updated', fetchTags)
    const handleStorage = () => fetchTags()
    window.addEventListener('storage', handleStorage)
    // Poll every 5s as reliable fallback for tag sync
    const poll = setInterval(fetchTags, 5000)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('tags-updated', fetchTags)
      window.removeEventListener('storage', handleStorage)
      clearInterval(poll)
    }
  }, [location])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

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
              onClick={() => navigate('/blog/new')}
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

        {/* Tag filter */}
        {tags.length > 0 && (
          <div style={{
            marginBottom: '1.5rem',
            position: 'relative',
          }}>
            {/* Fade edges for scroll hint */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: 20, background: 'linear-gradient(to right, var(--bg), transparent)',
              pointerEvents: 'none', zIndex: 1,
              display: tags.length > 8 ? 'block' : 'none',
            }} />
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}>
              {/* All button */}
              <motion.button
                onClick={() => { setSelectedTag(''); setSearchQuery('') }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '0.3rem 0.9rem',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: selectedTag === '' ? 'var(--text)' : 'var(--bg-secondary)',
                  color: selectedTag === '' ? 'var(--bg)' : 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: selectedTag === '' ? 600 : 400,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
              >
                全部
              </motion.button>

              {/* Tag buttons - each uses its own color */}
              {tags.map(tag => {
                const isSelected = selectedTag === tag.slug
                return (
                  <motion.button
                    key={tag.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTag('')
                        setSearchQuery('')
                      } else {
                        setSelectedTag(tag.slug)
                        setSearchQuery(tag.slug)
                      }
                    }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: 999,
                      border: `1.5px solid ${isSelected ? tag.color : 'var(--border)'}`,
                      background: isSelected ? tag.color + '18' : 'var(--bg-secondary)',
                      color: isSelected ? tag.color : 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      fontWeight: isSelected ? 600 : 400,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: tag.color,
                      flexShrink: 0,
                      opacity: isSelected ? 1 : 0.5,
                    }} />
                    {tag.name}
                  </motion.button>
                )
              })}
            </div>
          </div>
        )}

        {/* Search input */}
        <motion.div
          style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: 400 }}
          animate={searchQuery ? { scale: [1, 1.01, 1] } : { scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.span
            style={{ position: 'absolute', left: '1rem', top: 0, bottom: 0, display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', zIndex: 1 }}
            animate={searchQuery ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          >🔍</motion.span>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="搜索标题或标签..."
            className="search-input"
            style={{
              width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem',
              border: '1px solid var(--border)', borderRadius: 12,
              background: 'var(--bg-secondary)', color: 'var(--text)',
              fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
              boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
          />
        </motion.div>

        {loading ? (
          <div className="item-list">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-item">
                <div className="skeleton-item-date" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="skeleton-item-title" />
                  <div className="skeleton-item-tags">
                    <div className="skeleton-tag" />
                    <div className="skeleton-tag" style={{ width: 40 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <motion.p
              className="empty-state-icon"
              style={{ fontSize: '3rem', marginBottom: '1rem' }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >🔍</motion.p>
            <p>{searchQuery ? '无结果' : (tab === 'published' ? '还没有已发布的文章' : '草稿箱是空的')}</p>
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
                <div className="item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/blog/${blog.id}`)}>
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
                      onClick={(e) => { e.stopPropagation(); navigate(`/blog/${blog.id}/edit`) }}
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
