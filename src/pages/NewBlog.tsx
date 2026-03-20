import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function NewBlog() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [tags, setTags] = useState('')
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title.trim() || !content.trim()) return
    setSaving(true)
    const { error } = await supabase.from('blogs').insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      cover_url: coverUrl.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      published,
    })
    setSaving(false)
    if (!error) navigate('/blog')
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>✏️ 新建博客</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold' }}>标题 *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold' }}>封面图 URL</label>
          <input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold' }}>正文 *</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} required rows={15} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'monospace' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold' }}>标签（逗号分隔）</label>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="react, typescript" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} />
          <span>立即发布</span>
        </label>
        <button type="submit" disabled={saving} style={{ padding: '0.7rem', background: '#4a90d9', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          {saving ? '保存中...' : '💾 保存'}
        </button>
      </form>
    </div>
  )
}
