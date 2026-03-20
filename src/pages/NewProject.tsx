import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function NewProject() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [featured, setFeatured] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !name.trim()) return
    setSaving(true)
    const { error } = await supabase.from('projects').insert({
      user_id: user.id,
      name: name.trim(),
      description: description.trim(),
      cover_url: coverUrl.trim(),
      github_url: githubUrl.trim(),
      demo_url: demoUrl.trim(),
      featured,
    })
    setSaving(false)
    if (!error) navigate('/projects')
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>➕ 新增项目</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold' }}>项目名称 *</label>
          <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold' }}>描述</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold' }}>封面图 URL</label>
          <input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold' }}>GitHub 链接</label>
          <input value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/..." style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold' }}>演示链接</label>
          <input value={demoUrl} onChange={e => setDemoUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
          <span>⭐ 精选项目</span>
        </label>
        <button type="submit" disabled={saving} style={{ padding: '0.7rem', background: '#4a90d9', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          {saving ? '保存中...' : '💾 保存'}
        </button>
      </form>
    </div>
  )
}
