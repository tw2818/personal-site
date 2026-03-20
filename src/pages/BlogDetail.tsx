import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { useAuth } from '../contexts/AuthContext'

const SUPABASE_URL = 'https://osteeuwotaywuqsztipz.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdGVldXdvdGF5d3Vxc3p0aXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTk0MzMsImV4cCI6MjA4OTU3NTQzM30.wgHZxt9bDT4eWg6beHzZUMsMwnDoIexU_nHUudneSJM'

const decodeJWT = (token: string): string | null => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.sub
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
  const { user, accessToken } = useAuth()
  const [blog, setBlog] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentError, setCommentError] = useState('')
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const isAdmin = user?.user_metadata?.user_name === 'tw2818'
  const isAuthor = blog?.user_id === user?.id
  const canModerate = isAdmin || isAuthor

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
    if (!newComment.trim() || !accessToken || submitting) return

    setSubmitting(true)
    setSubmitError('')
    setSubmitSuccess(false)

    try {
      const uid = decodeJWT(accessToken) || user?.id || 'MISSING_ID'
      console.debug('[Comment Debug] accessToken present:', !!accessToken, '| decoded uid:', uid, '| user.id:', user?.id)
      const res = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          blog_id: id,
          user_id: decodeJWT(accessToken) || user?.id || '',
          nickname: user?.user_metadata?.nickname || user?.user_metadata?.user_name || user?.email?.split('@')[0] || 'Anonymous',
          avatar_url: user?.user_metadata?.avatar_url || '',
          content: newComment.trim(),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to post comment')
      }

      const created = await res.json()
      setComments(prev => [...prev, ...(Array.isArray(created) ? created : [created])])
      setNewComment('')
      setSubmitSuccess(true)
      setTimeout(() => setSubmitSuccess(false), 3000)
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!accessToken) return
    if (!confirm('Delete this comment?')) return

    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/comments?id=eq.${commentId}`,
        {
          method: 'DELETE',
          headers: {
            apikey: ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      if (!res.ok) throw new Error('Failed to delete')
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (err: any) {
      alert(err.message || 'Failed to delete comment')
    }
  }

  // Pin/unpin comment
  const handlePinComment = async (comment: Comment) => {
    if (!accessToken) return

    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/comments?id=eq.${comment.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
            Prefer: 'return=representation',
          },
          body: JSON.stringify({ pinned: !comment.pinned }),
        }
      )
      if (!res.ok) throw new Error('Failed to update')
      const updated = await res.json()
      if (Array.isArray(updated) && updated[0]) {
        setComments(prev => prev.map(c => c.id === comment.id ? { ...c, pinned: updated[0].pinned } : c))
      }
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
    // Generate initials avatar
    const name = comment.nickname || '?'
    const initials = name.slice(0, 2).toUpperCase()
    // Generate a consistent color from nickname
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    const hue = hash % 360
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="hsl(${hue},60%,60%)"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-family="system-ui" font-size="14" font-weight="600">${initials}</text></svg>`)}`
  }

  if (loading) return <div className="page" style={{ textAlign: 'center', padding: '4rem' }}>加载中...</div>
  if (!blog) return <div className="page" style={{ textAlign: 'center', padding: '4rem' }}>文章不存在</div>

  return (
    <div className="page">
      <div className="section" style={{ maxWidth: 720 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          {blog.cover_url && (
            <img src={blog.cover_url} alt={blog.title} style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 16, marginBottom: '2rem' }} />
          )}
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '1rem', lineHeight: 1.2 }}>{blog.title}</h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>{new Date(blog.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            {blog.tags?.length > 0 && (
              <div className="tags">
                {blog.tags.map((t: string) => <span key={t} className="tag">{t}</span>)}
              </div>
            )}
            {!blog.published && <span style={{ background: '#ff9500', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.75rem' }}>草稿</span>}
            {isAdmin && (
              <a href={`/blog/${id}/edit`} className="btn btn-secondary" style={{ marginLeft: 'auto', padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>✏️ 编辑</a>
            )}
          </div>
          <div className="markdown-body" style={{ lineHeight: 1.8, fontSize: '1.05rem' }}>
            <ReactMarkdown>{blog.content || ''}</ReactMarkdown>
          </div>

          {/* Comments Section */}
          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>评论</h2>
              <span style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '0.15rem 0.6rem', borderRadius: 12, fontSize: '0.8rem' }}>
                {comments.length}
              </span>
            </div>

            {/* Comment Form */}
            {user ? (
              <form onSubmit={handleSubmitComment} style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <img
                    src={getAvatar({ nickname: user.user_metadata?.nickname || user.user_metadata?.user_name || user.email?.split('@')[0] || '?', avatar_url: user.user_metadata?.avatar_url || '', content: '', created_at: '', pinned: false, id: '', blog_id: '', user_id: '' })}
                    alt="avatar"
                    style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, marginTop: 4 }}
                  />
                  <div style={{ flex: 1 }}>
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="写下你的评论..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text)',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                    {submitError && <p style={{ color: '#ff3b30', fontSize: '0.85rem', marginTop: '0.5rem' }}>{submitError}</p>}
                    {submitSuccess && <p style={{ color: '#34c759', fontSize: '0.85rem', marginTop: '0.5rem' }}>评论发布成功！</p>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
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
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 12 }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sortedComments.map(comment => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      padding: '1rem',
                      borderRadius: 12,
                      background: comment.pinned ? 'rgba(0,113,227,0.06)' : 'var(--bg-secondary)',
                      border: comment.pinned ? '1px solid rgba(0,113,227,0.2)' : '1px solid transparent',
                    }}
                  >
                    <img
                      src={getAvatar(comment)}
                      alt={comment.nickname}
                      style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{comment.nickname || '匿名用户'}</span>
                        {comment.pinned && (
                          <span style={{ background: 'var(--accent)', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 500 }}>
                            置顶
                          </span>
                        )}
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: 'auto' }}>
                          {formatTime(comment.created_at)}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text)', wordBreak: 'break-word' }}>
                        {comment.content}
                      </p>
                      {canModerate && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button
                            onClick={() => handlePinComment(comment)}
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.2rem 0.4rem',
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
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.2rem 0.4rem',
                              borderRadius: 6,
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#ff3b30'; e.currentTarget.style.background = 'var(--bg)' }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'none' }}
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
        </motion.div>
      </div>
    </div>
  )
}
