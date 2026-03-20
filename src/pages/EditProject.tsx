import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function EditProject() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [featured, setFeatured] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase.from('projects').select('*').eq('id', id).single()
      .then(({ data }) => {
        if (data) {
          setName(data.name || '')
          setDescription(data.description || '')
          setCoverUrl(data.cover_url || '')
          setGithubUrl(data.github_url || '')
          setDemoUrl(data.demo_url || '')
          setFeatured(data.featured || false)
        }
        setLoading(false)
      })
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !name.trim()) return
    setSaving(true)
    await supabase.from('projects').update({
      name: name.trim(), description: description.trim(),
      cover_url: coverUrl.trim(), github_url: githubUrl.trim(), demo_url: demoUrl.trim(), featured,
    }).eq('id', id)
    setSaving(false)
    navigate('/projects')
  }

  const handleDelete = async () => {
    if (!id || !confirm('确定删除这个项目？')) return
    await supabase.from('projects').delete().eq('id', id)
    navigate('/projects')
  }

  if (loading) return <div className="page" style={{ textAlign: 'center', padding: '4rem' }}>加载中...</div>

  return (
    <div className="page">
      <div className="section" style={{ maxWidth: 640 }}>
        <motion.h1 className="section-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>✏️ 编辑项目</motion.h1>
        <motion.form onSubmit={handleSave} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.5rem' }}>
          <div className="form-group"><label>项目名称 *</label><input className="form-input" value={name} onChange={e => setName(e.target.value)} required /></div>
          <div className="form-group"><label>描述</label><textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)} rows={3} /></div>
          <div className="form-group"><label>封面图 URL</label><input className="form-input" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." /></div>
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
