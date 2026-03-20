import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { directWrite } from '../lib/apiWrite'
import RichEditor from '../components/RichEditor'

export default function NewBlog() {
  const { user, accessToken } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [tags, setTags] = useState('')
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title.trim() || !accessToken) return
    setSaving(true)
    const { error } = await directWrite('POST', 'blogs', {
      user_id: user.id, title: title.trim(), content: content.trim(),
      cover_url: coverUrl.trim(), tags: tags.split(',').map(t => t.trim()).filter(Boolean), published,
    }, '', accessToken)
    setSaving(false)
    if (!error) navigate('/blog')
  }

  return (
    <div className="page">
      <div className="section" style={{ maxWidth: 900 }}>
        <motion.h1 className="section-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>✏️ 新建博客</motion.h1>
        <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.5rem' }}>
          <div className="form-group"><label>标题 *</label><input className="form-input" value={title} onChange={e => setTitle(e.target.value)} required /></div>
          <div className="form-group"><label>封面图 URL</label><input className="form-input" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." /></div>
          <div className="form-group"><label>正文 *</label><RichEditor value={content} onChange={setContent} /></div>
          <div className="form-group"><label>标签（逗号分隔）</label><input className="form-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="react, typescript" /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} />
            <span style={{ fontSize: '0.95rem' }}>立即发布（不勾选则存为草稿）</span>
          </label>
          <motion.button type="submit" disabled={saving} className="btn btn-primary" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            {saving ? '保存中...' : '💾 保存'}
          </motion.button>
        </motion.form>
      </div>
    </div>
  )
}
