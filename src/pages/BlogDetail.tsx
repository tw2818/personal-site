import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import { useAuth } from '../contexts/AuthContext'
import { SUPABASE_URL, ANON_KEY, ADMIN_USER } from '../lib/config'

interface Heading {
  id: string
  text: string
  level: number
}

function parseHeadings(content: string): Heading[] {
  const lines = content.split('\n')
  const result: Heading[] = []
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].replace(/[*_`~]/g, '').trim()
      const id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      result.push({ id, text, level })
    }
  }
  return result
}

// Read token directly from localStorage to avoid stale/null React state
const getLocalToken = () => {
  try {
    const raw = localStorage.getItem('sb-osteeuwotaywuqsztipz-auth-token')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed.access_token || null
  } catch { return null }
}

const refreshToken = async (): Promise<string | null> => {
  try {
    const raw = localStorage.getItem('sb-osteeuwotaywuqsztipz-auth-token')
    if (!raw) return null
    const { refresh_token } = JSON.parse(raw)
    if (!refresh_token) return null
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
        body: JSON.stringify({ refresh_token }),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const newToken = data?.access_token
    if (newToken) {
      const old = JSON.parse(raw)
      localStorage.setItem('sb-osteeuwotaywuqsztipz-auth-token', JSON.stringify({
        ...old,
        access_token: newToken,
        refresh_token: data.refresh_token || old.refresh_token,
        expires_at: Date.now() + (data.expires_in || 3600) * 1000,
      }))
    }
    return newToken
  } catch { return null }
}


interface Comment {
  id: string
  blog_id: string
  user_id: string
  nickname: string
  avatar_url: string
  content: string
  pinned: boolean
  created_at: string
}

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [blog, setBlog] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentError, setCommentError] = useState('')
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeHeading, setActiveHeading] = useState('')

    const isAdmin = user?.user_metadata?.user_name === ADMIN_USER
  const isAuthor = blog?.user_id === user?.id
  const canModerate = isAdmin || isAuthor

  // Reading progress & scroll spy
  useEffect(() => {
    const updateProgress = () => {
      const el = document.documentElement
      const scrollTop = el.scrollTop || document.body.scrollTop
      const height = el.scrollHeight - el.clientHeight
      setReadingProgress(height > 0 ? Math.round((scrollTop / height) * 100) : 0)
      setShowBackToTop(scrollTop > 400)
      // Scroll spy: find the heading currently in view
      const headingEls = document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4')
      let current = ''
      for (const h of headingEls) {
        if ((h as HTMLElement).offsetTop - 120 <= scrollTop) {
          current = h.id
        }
      }
      setActiveHeading(current)
    }
    window.addEventListener('scroll', updateProgress, { passive: true })
    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  // Fetch blog
  useEffect(() => {
    if (!id) { setLoading(false); return }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)

    const doFetch = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/blogs?id=eq.${encodeURIComponent(id)}&select=*`,
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
        if (data?.length > 0) {
          setBlog(data[0])
          const parsed = parseHeadings(data[0].content || '')
          setHeadings(parsed)
        }
        setLoading(false)
      } catch {
        clearTimeout(timer)
        setLoading(false)
      }
    }
    doFetch()

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [id])

  // Fetch comments
  const fetchComments = async () => {
    if (!id) return
    setCommentsLoading(true)
    setCommentError('')
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/comments?blog_id=eq.${encodeURIComponent(id)}&order=created_at.asc`,
        {
          headers: {
            apikey: ANON_KEY,
            Authorization: `Bearer ${ANON_KEY}`,
          },
        }
      )
      if (!res.ok) throw new Error('Failed to fetch comments')
      const data = await res.json()
      setComments(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setCommentError(err.message || 'Failed to load comments')
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchComments()
  }, [id])

  // Submit new comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    // Get token — try refresh if no token found (handles expired tokens)
    let token = getLocalToken()
    if (!token) token = await refreshToken()
    if (!token) { setSubmitError('请先登录'); return }

    setSubmitting(true)
    setSubmitError('')
    setSubmitSuccess(false)

    try {
      const nickname = user?.user_metadata?.nickname || user?.user_metadata?.user_name || user?.email?.split('@')[0] || 'Anonymous'
      const avatar_url = user?.user_metadata?.avatar_url || ''

      const res = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
          Authorization: `Bearer ${token}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          blog_id: id,
          nickname,
          avatar_url,
          content: newComment.trim(),
        }),
      })

      if (res.status === 401) {
        const newToken = await refreshToken()
        if (newToken) {
          const retryRes = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${newToken}`,
              Prefer: 'return=representation',
            },
            body: JSON.stringify({ blog_id: id, nickname, avatar_url, content: newComment.trim() }),
          })
          if (!retryRes.ok) throw new Error(`评论失败 (${retryRes.status})`)
          const created = await retryRes.json()
          setComments(prev => [...prev, ...(Array.isArray(created) ? created : [created])])
          setNewComment('')
          setSubmitSuccess(true)
          setTimeout(() => setSubmitSuccess(false), 3000)
          setSubmitting(false)
          return
        } else {
          throw new Error('登录已过期，请重新登录')
        }
      } else if (!res.ok) {
        const errBody = await res.text()
        let errObj: { message?: string } = {}
        try { errObj = JSON.parse(errBody) } catch { errObj = { message: errBody } }
        throw new Error(errObj.message || `评论失败 (${res.status})`)
      } else {
        const created = await res.json()
        setComments(prev => [...prev, ...(Array.isArray(created) ? created : [created])])
        setNewComment('')
        setSubmitSuccess(true)
        setTimeout(() => setSubmitSuccess(false), 3000)
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    let token = getLocalToken()
    if (!token) token = await refreshToken()
    if (!token) return
    if (!confirm('Delete this comment?')) return

    try {
      let res = await fetch(`${SUPABASE_URL}/rest/v1/comments?id=eq.${commentId}`, {
        method: 'DELETE',
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        const newToken = await refreshToken()
        if (newToken) {
          res = await fetch(`${SUPABASE_URL}/rest/v1/comments?id=eq.${commentId}`, {
            method: 'DELETE',
            headers: { apikey: ANON_KEY, Authorization: `Bearer ${newToken}` },
          })
        } else {
          throw new Error('登录已过期，请重新登录')
        }
      }
      if (!res.ok) throw new Error('Failed to delete comment')
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (err: any) {
      alert(err.message || 'Failed to delete comment')
    }
  }

  // Pin/unpin comment
  const handlePinComment = async (comment: Comment) => {
    let token = getLocalToken()
    if (!token) token = await refreshToken()
    if (!token) return

    try {
      let res = await fetch(`${SUPABASE_URL}/rest/v1/comments?id=eq.${comment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
          Authorization: `Bearer ${token}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ pinned: !comment.pinned }),
      })
      if (res.status === 401) {
        const newToken = await refreshToken()
        if (newToken) {
          res = await fetch(`${SUPABASE_URL}/rest/v1/comments?id=eq.${comment.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              apikey: ANON_KEY,
              Authorization: `Bearer ${newToken}`,
              Prefer: 'return=representation',
            },
            body: JSON.stringify({ pinned: !comment.pinned }),
          })
        } else {
          throw new Error('登录已过期，请重新登录')
        }
      }
      if (!res.ok) throw new Error('Failed to update comment')
      const updated = await res.json()
      const newPinned = Array.isArray(updated) ? updated[0]?.pinned : false
      setComments(prev => prev.map(c => c.id === comment.id ? { ...c, pinned: newPinned } : c))
    } catch (err: any) {
      alert(err.message || 'Failed to update comment')
    }
  }

  // Sort: pinned first, then by created_at asc
  const sortedComments = [...comments].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    if (days > 7) return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    if (days > 0) return `${days}天前`
    if (hours > 0) return `${hours}小时前`
    if (minutes > 0) return `${minutes}分钟前`
    return '刚刚'
  }

  const getAvatar = (comment: Comment) => {
    if (comment.avatar_url) return comment.avatar_url
    // Generate initials avatar - nickname is sanitized before use
    const rawName = comment.nickname || '?'
    // Strip any HTML/XML characters to prevent XSS in SVG
    const name = rawName.replace(/[<>&"']/g, '')
    const initials = name.slice(0, 2).toUpperCase()
    // Generate a consistent color from name
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    const hue = Math.abs(hash % 360)
    // Build SVG with textContent for safe text insertion
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="hsl(${hue},60%,60%)"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-family="system-ui" font-size="14" font-weight="600"></text></svg>`
    // Use DOMParser to safely insert text content
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(svg, 'image/svg+xml')
      const textEl = doc.querySelector('text')
      if (textEl) textEl.textContent = initials
      const serializer = new XMLSerializer()
      const safeSvg = serializer.serializeToString(doc.documentElement)
      return `data:image/svg+xml,${encodeURIComponent(safeSvg)}`
    } catch {
      return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="hsl(200,60%,60%)"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-family="system-ui" font-size="14" font-weight="600">??</text></svg>`)}`
    }
  }

  if (loading) return <div className="page" style={{ textAlign: 'center', padding: '4rem' }}>加载中...</div>
  if (!blog) return <div className="page" style={{ textAlign: 'center', padding: '4rem' }}>文章不存在</div>

  return (
    <div className="page">
      {/* Reading progress bar */}
      <div style={{ position: 'fixed', top: 0, height: 3, width: readingProgress + '%', background: 'var(--accent)', zIndex: 200 }} />
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'rgba(var(--bg-rgb), 0.1)', zIndex: 199 }} />

      {/* Left TOC sidebar: fixed overlay, does not affect article width */}
      <div style={{
        position: 'fixed',
        left: '2rem',
        top: 80,
        width: 180,
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}>
        {/* Sidebar card */}
        <div style={{
          background: 'rgba(var(--bg-rgb), 0.14)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          {/* Back button */}
          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.8rem',
              borderRadius: 8,
              background: 'rgba(var(--bg-rgb), 0.2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
              width: '100%',
              justifyContent: 'center',
            }}
          >
            ← 返回
          </motion.button>

          {headings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, paddingLeft: '0.4rem' }}>目录</div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                {headings.map(h => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    onClick={e => {
                      e.preventDefault()
                      const el = document.getElementById(h.id)
                      if (el) {
                        const top = el.getBoundingClientRect().top + window.scrollY - 90
                        window.scrollTo({ top, behavior: 'smooth' })
                      }
                    }}
                    style={{
                      display: 'block',
                      fontSize: h.level === 1 ? '0.82rem' : h.level === 2 ? '0.78rem' : '0.75rem',
                      fontWeight: h.level === 1 ? 500 : 400,
                      color: activeHeading === h.id ? 'var(--accent)' : 'var(--text-secondary)',
                      paddingLeft: h.level === 1 ? '0.4rem' : h.level === 2 ? '0.8rem' : '1.2rem',
                      paddingTop: '0.25rem',
                      paddingBottom: '0.25rem',
                      borderRadius: 6,
                      background: activeHeading === h.id ? 'rgba(var(--accent), 0.1)' : 'transparent',
                      transition: 'all 0.15s ease',
                      textDecoration: 'none',
                      lineHeight: 1.4,
                    }}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Main content: centered article */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem' }}>

        {/* Article content */}
        <div>
          {/* Cover image */}
          {blog.cover_url && (
            <div
              style={{
                width: '100%',
                aspectRatio: '21 / 9',
                borderRadius: 12,
                marginBottom: '2rem',
                background: 'linear-gradient(135deg, rgba(var(--bg-rgb), 0.4) 0%, rgba(var(--bg-rgb), 0.7) 100%)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={blog.cover_url}
                alt={blog.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
          )}

          {/* Title */}
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '1rem', lineHeight: 1.2, color: 'var(--text)' }}>{blog.title}</h1>

          {/* Meta info: date + tags + draft + edit */}
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '2.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>{new Date(blog.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            {blog.tags?.length > 0 && (
              <div className="tags">
                {blog.tags.map((t: string) => <span key={t} className="tag">{t}</span>)}
              </div>
            )}
            {!blog.published && <span style={{ background: '#ff9500', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.75rem' }}>草稿</span>}
            {isAdmin && (
              <a href={`/blog/${id}/edit`} style={{ marginLeft: 'auto', padding: '0.3rem 0.8rem', fontSize: '0.8rem', background: 'rgba(var(--bg-rgb), 0.12)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', textDecoration: 'none', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>✏️ 编辑</a>
            )}
          </div>

          {/* Article body */}
          <div className="markdown-body" style={{ lineHeight: 1.9, fontSize: '1.05rem', color: 'var(--text)' }} id="article-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>{blog.content || ''}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Right column: floating info panel */}
      <div style={{ position: 'fixed', top: 80, right: '2rem', width: 160, background: 'rgba(var(--bg-rgb), 0.14)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 50 }}>
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>阅读</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{Math.max(1, Math.round(blog.content ? blog.content.split(/\s+/).length / 200 : 0))}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>分钟</div>
        </div>
        <div style={{ height: 1, background: 'var(--border)' }} />
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>字数</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>{blog.content ? blog.content.replace(/\s+/g, '').length.toLocaleString() : 0}</div>
        </div>
        <div style={{ height: 1, background: 'var(--border)' }} />
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>发布</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text)' }}>{new Date(blog.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Comments section */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 4rem' }}>
        <div style={{ padding: '2.5rem', background: 'rgba(var(--bg-rgb), 0.18)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid var(--border)', borderRadius: 24 }}>
          {/* Comment header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>评论</h2>
            <span style={{ background: 'rgba(var(--bg-rgb), 0.3)', color: 'var(--text-secondary)', padding: '0.15rem 0.6rem', borderRadius: 12, fontSize: '0.8rem' }}>{comments.length}</span>
          </div>

          {/* Comment Form */}
          {user ? (
              <form onSubmit={handleSubmitComment} style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <img
                    src={getAvatar({ nickname: user.user_metadata?.nickname || user.user_metadata?.user_name || user.email?.split('@')[0] || '?', avatar_url: user.user_metadata?.avatar_url || '', content: '', created_at: '', pinned: false, id: '', blog_id: '', user_id: '' })}
                    alt="avatar"
                    style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, marginTop: 4, border: '2px solid var(--border)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="写下你的评论..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.85rem 1.1rem',
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text)',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                    />
                    {submitError && <p style={{ color: '#ff3b30', fontSize: '0.85rem', marginTop: '0.5rem' }}>{submitError}</p>}
                    {submitSuccess && <p style={{ color: '#34c759', fontSize: '0.85rem', marginTop: '0.5rem' }}>评论发布成功！</p>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                      <button
                        type="submit"
                        disabled={!newComment.trim() || submitting}
                        style={{
                          padding: '0.5rem 1.2rem',
                          borderRadius: 10,
                          border: 'none',
                          background: (!newComment.trim() || submitting) ? 'var(--bg-secondary)' : 'var(--accent)',
                          color: (!newComment.trim() || submitting) ? 'var(--text-secondary)' : '#fff',
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          cursor: (!newComment.trim() || submitting) ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {submitting ? '发布中...' : '发布评论'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2.5rem', padding: '1rem 1.25rem', background: 'rgba(var(--bg-rgb), 0.12)', border: '1px solid var(--border)', borderRadius: 12 }}>
                登录后可以发表评论
              </p>
            )}

            {/* Comments List */}
            {commentsLoading ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>加载评论...</p>
            ) : commentError ? (
              <p style={{ color: '#ff3b30', textAlign: 'center', padding: '1rem' }}>{commentError}</p>
            ) : sortedComments.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem', fontSize: '0.95rem' }}>
                还没有评论，来抢沙发！
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {sortedComments.map(comment => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      padding: '1.25rem',
                      borderRadius: 16,
                      background: comment.pinned ? 'rgba(0,113,227,0.08)' : 'rgba(var(--bg-rgb), 0.12)',
                      border: comment.pinned ? '1px solid rgba(0,113,227,0.2)' : '1px solid transparent',
                      transition: 'box-shadow 0.2s',
                    }}
                    onMouseEnter={e => { if (!comment.pinned) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)' }}
                    onMouseLeave={e => { if (!comment.pinned) (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                  >
                    <img
                      src={getAvatar(comment)}
                      alt={comment.nickname}
                      style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, border: '2px solid var(--border)' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{comment.nickname || '匿名用户'}</span>
                        {comment.pinned && (
                          <span style={{ background: 'var(--accent)', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 500 }}>
                            置顶
                          </span>
                        )}
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: 'auto' }}>
                          {formatTime(comment.created_at)}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text)', wordBreak: 'break-word' }}>
                        {comment.content}
                      </p>
                      {canModerate && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                          <button
                            onClick={() => handlePinComment(comment)}
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem 0.5rem',
                              borderRadius: 6,
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg)' }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'none' }}
                          >
                            {comment.pinned ? '取消置顶' : '置顶'}
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="btn-delete"
                            style={{
                              fontSize: '0.75rem',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem 0.5rem',
                              borderRadius: 6,
                              transition: 'all 0.2s',
                            }}
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* Back to top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="回到顶部"
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(var(--bg-rgb), 0.15)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.3s',
              zIndex: 100,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            ↑
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
