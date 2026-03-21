import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { directWrite } from '../lib/apiWrite'
import { uploadImage } from '../lib/storage'
import { SUPABASE_URL, ANON_KEY } from '../lib/config'

export default function EditProject() {
  const { id } = useParams<{ id: string }>()
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverError, setCoverError] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [featured, setFeatured] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    fetch(
      `${SUPABASE_URL}/rest/v1/projects?id=eq.${encodeURIComponent(id)}&select=*`,
      {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`,
        },
        signal: controller.signal,
      }
    ).then(r => r.json()).then(data => {
      clearTimeout(timer)
      if (data?.[0]) {
        setName(data[0].name || '')
        setDescription(data[0].description || '')
        setCoverUrl(data[0].cover_url || '')
        setGithubUrl(data[0].github_url || '')
        setDemoUrl(data[0].demo_url || '')
        setFeatured(data[0].featured || false)
      }
      setLoading(false)
    }).catch(() => { clearTimeout(timer); setLoading(false) })
  }, [id])

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    setCoverError('')
    const url = await uploadImage(file)
    if (url) { setCoverUrl(url) } else { setCoverError('上传失败') }
    setUploadingCover(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !name.trim() || !accessToken) return
    setSaving(true)
    await directWrite('PATCH', 'projects', { name: name.trim(), description: description.trim(), cover_url: coverUrl.trim(), github_url: githubUrl.trim(), demo_url: demoUrl.trim(), featured }, `id=eq.${encodeURIComponent(id)}`)
    setSaving(false)
    navigate('/projects')
  }

  const handleDelete = async () => {
    if (!id || !accessToken || !confirm('确定删除这个项目？')) return
    await directWrite('DELETE', 'projects', undefined, `id=eq.${encodeURIComponent(id)}`)
    navigate('/projects')
  }

  if (loading) return <div className="page" style={{ textAlign: 'center', padding: '4rem' }}>加载中...</div>

  return (
    <div className="page">
      <div className="section" style={{ maxWidth: 640 }}>
        <button
          onClick={() => navigate('/projects')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', fontSize: '0.9rem', padding: '0.3rem 0',
            marginBottom: '1.2rem', transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >← 返回项目列表</button>
        <motion.h1 className="section-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>✏️ 编辑项目</motion.h1>
        <motion.form onSubmit={handleSave} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.5rem' }}>
          <div className="form-group"><label>项目名称 *</label><input className="form-input" value={name} onChange={e => setName(e.target.value)} required /></div>
          <div className="form-group"><label>描述</label><textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)} rows={3} /></div>
          <div className="form-group">
            <label>封面图</label>
            {coverUrl && <img src={coverUrl} alt="cover" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: '0.5rem' }} />}
            <input type="file" accept="image/*" onChange={handleCoverUpload} disabled={uploadingCover} style={{ marginBottom: '0.3rem' }} />
            {uploadingCover && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>上传中...</span>}
            {coverError && <span style={{ fontSize: '0.85rem', color: '#e94560' }}>{coverError}</span>}
            <input className="form-input" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="或直接输入图片URL" style={{ marginTop: '0.3rem' }} />
          </div>
          <div className="form-group"><label>GitHub 链接</label><input className="form-input" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/..." /></div>
          <div className="form-group"><label>演示链接</label><input className="form-input" value={demoUrl} onChange={e => setDemoUrl(e.target.value)} placeholder="https://..." /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
            <span style={{ fontSize: '0.95rem' }}>⭐ 精选项目</span>
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
