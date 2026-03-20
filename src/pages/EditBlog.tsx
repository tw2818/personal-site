import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { directWrite, useApiWrite } from '../lib/apiWrite'
import RichEditor from '../components/RichEditor'

export default function EditBlog() {
  const { id } = useParams<{ id: string }>()
  const { user, accessToken } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [tags, setTags] = useState('')
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    fetch(
      `https://osteeuwotaywuqsztipz.supabase.co/rest/v1/blogs?id=eq.${encodeURIComponent(id)}&select=*`,
      {
        headers: {
          apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdGVldXdvdGF5d3Vxc3p0aXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTk0MzMsImV4cCI6MjA4OTU3NTQzM30.wgHZxt9bDT4eWg6beHzZUMsMwnDoIexU_nHUudneSJM',
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdGVldXdvdGF5d3Vxc3p0aXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTk0MzMsImV4cCI6MjA4OTU3NTQzM30.wgHZxt9bDT4eWg6beHzZUMsMwnDoIexU_nHUudneSJM',
        },
        signal: controller.signal,
      }
    ).then(r => r.json()).then(data => {
      clearTimeout(timer)
      if (data?.[0]) {
        setTitle(data[0].title || '')
        setContent(data[0].content || '')
        setCoverUrl(data[0].cover_url || '')
        setTags((data[0].tags || []).join(', '))
        setPublished(data[0].published || false)
      }
      setLoading(false)
    }).catch(() => {
      clearTimeout(timer)
      setLoading(false)
    })
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !title.trim() || !accessToken) return
    setSaving(true)
    await directWrite(
      'PATCH', 'blogs',
      {
        title: title.trim(), content: content.trim(),
        cover_url: coverUrl.trim(), tags: tags.split(',').map(t => t.trim()).filter(Boolean), published,
        updated_at: new Date().toISOString(),
      },
      `id=eq.${encodeURIComponent(id)}`,
      accessToken
    )
    setSaving(false)
    navigate('/blog')
  }

  const handleDelete = async () => {
    if (!id || !accessToken || !confirm('确定删除这篇文章？')) return
    await directWrite('DELETE', 'blogs', undefined, `id=eq.${encodeURIComponent(id)}`, accessToken)
    navigate('/blog')
  }

  if (loading) return <div className="page" style={{ textAlign: 'center', padding: '4rem' }}>加载中...</div>

  return (
    <div className="page">
      <div className="section" style={{ maxWidth: 900 }}>
        <motion.h1 className="section-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>✏️ 编辑博客</motion.h1>
        <motion.form onSubmit={handleSave} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.5rem' }}>
          <div className="form-group"><label>标题 *</label><input className="form-input" value={title} onChange={e => setTitle(e.target.value)} required /></div>
          <div className="form-group"><label>封面图 URL</label><input className="form-input" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." /></div>
          <div className="form-group"><label>正文 *</label><RichEditor value={content} onChange={setContent} /></div>
          <div className="form-group"><label>标签（逗号分隔）</label><input className="form-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="react, typescript" /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} />
            <span style={{ fontSize: '0.95rem' }}>已发布</span>
          </label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <motion.button type="submit" disabled={saving} className="btn btn-primary" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              {saving ? '保存中...' : '💾 保存'}
            </motion.button>
            <motion.button type="button" onClick={handleDelete} className="btn" style={{ background: '#e94560', color: '#fff', border: 'none' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              🗑 删除
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  )
}
