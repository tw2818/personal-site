import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [blog, setBlog] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    let cancelled = false
    const timer = setTimeout(() => { cancelled = true; setLoading(false) }, 8000)

    const doFetch = async () => {
      try {
        const { data } = await supabase.from('blogs').select('*').eq('id', id).single()
        if (!cancelled) { setBlog(data); setLoading(false) }
      } catch {
        if (!cancelled) setLoading(false)
      } finally {
        clearTimeout(timer)
      }
    }
    doFetch()
  }, [id])

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
            {user?.user_metadata?.user_name === 'tw2818' && (
              <a href={`/blog/${id}/edit`} className="btn btn-secondary" style={{ marginLeft: 'auto', padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>✏️ 编辑</a>
            )}
          </div>
          <div className="markdown-body" style={{ lineHeight: 1.8, fontSize: '1.05rem' }}>
            <ReactMarkdown>{blog.content || ''}</ReactMarkdown>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
