import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function EditBlog() {
  const { id } = useParams<{ id: string }>()
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
    supabase.from('blogs').select('*').eq('id', id).single()
      .then(({ data }) => {
        if (data) {
          setTitle(data.title || '')
          setContent(data.content || '')
          setCoverUrl(data.cover_url || '')
          setTags((data.tags || []).join(', '))
          setPublished(data.published || false)
        }
        setLoading(false)
      })
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !title.trim()) return
    setSaving(true)
    await supabase.from('blogs').update({
      title: title.trim(), content: content.trim(),
      cover_url: coverUrl.trim(), tags: tags.split(',').map(t => t.trim()).filter(Boolean), published,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    setSaving(false)
    navigate('/blog')
  }

  const handleDelete = async () => {
    if (!id || !confirm('确定删除这篇文章？')) return
    await supabase.from('blogs').delete().eq('id', id)
    navigate('/blog')
  }

  if (loading) return <div className="page" style={{ textAlign: 'center', padding: '4rem' }}>加载中...</div>

  return (
    <div className="page">
      <div className="section" style={{ maxWidth: 800 }}>
        <motion.h1 className="section-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>✏️ 编辑博客</motion.h1>
        <motion.form onSubmit={handleSave} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.5rem' }}>
          <div className="form-group"><label>标题 *</label><input className="form-input" value={title} onChange={e => setTitle(e.target.value)} required /></div>
          <div className="form-group"><label>封面图 URL</label><input className="form-input" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." /></div>
          <div className="form-group"><label>正文 *</label><textarea className="form-input" value={content} onChange={e => setContent(e.target.value)} required rows={15} style={{ fontFamily: 'monospace', fontSize: '0.9rem' }} /></div>
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
