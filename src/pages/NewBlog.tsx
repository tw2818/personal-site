import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { directWrite } from '../lib/apiWrite'
import { uploadImage } from '../lib/storage'
import RichEditor from '../components/RichEditor'
import TagSelector from '../components/TagSelector'

export default function NewBlog() {
  const { user, accessToken } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverError, setCoverError] = useState('')

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    setCoverError('')
    const url = await uploadImage(file)
    setUploadingCover(false)
    if (url) {
      setCoverUrl(url)
    } else {
      setCoverError('封面上传失败，请重试')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title.trim() || !accessToken) return
    setSaving(true)
    const { error } = await directWrite('POST', 'blogs', {
      user_id: user.id, title: title.trim(), content: content.trim(),
      cover_url: coverUrl.trim(), tags: selectedTags, published,
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
          <div className="form-group">
            <label>封面图</label>
            <input type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: 'block', marginBottom: '0.5rem' }} />
            {uploadingCover && <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>上传中...</span>}
            {coverError && <span style={{ fontSize: '0.9rem', color: '#e94560' }}>{coverError}</span>}
            {coverUrl && <img src={coverUrl} alt="封面预览" style={{ maxWidth: 200, maxHeight: 120, borderRadius: 8, marginTop: '0.5rem', display: 'block' }} />}
            <input className="form-input" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="或直接输入封面图 URL" style={{ marginTop: '0.5rem' }} />
          </div>
          <div className="form-group"><label>正文 *</label><RichEditor value={content} onChange={setContent} /></div>
          <div className="form-group">
            <label>标签</label>
            <TagSelector value={selectedTags} onChange={setSelectedTags} accessToken={accessToken} />
          </div>
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
