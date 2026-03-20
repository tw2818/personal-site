import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
    await supabase.from('projects').insert({
      user_id: user.id, name: name.trim(), description: description.trim(),
      cover_url: coverUrl.trim(), github_url: githubUrl.trim(), demo_url: demoUrl.trim(), featured,
    })
    setSaving(false)
    navigate('/projects')
  }

  return (
    <div className="page">
      <div className="section" style={{ maxWidth: 640 }}>
        <motion.h1 className="section-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>➕ 新增项目</motion.h1>
        <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.5rem' }}>
          <div className="form-group"><label>项目名称 *</label><input className="form-input" value={name} onChange={e => setName(e.target.value)} required /></div>
          <div className="form-group"><label>描述</label><textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)} rows={3} /></div>
          <div className="form-group"><label>封面图 URL</label><input className="form-input" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." /></div>
          <div className="form-group"><label>GitHub 链接</label><input className="form-input" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/..." /></div>
          <div className="form-group"><label>演示链接</label><input className="form-input" value={demoUrl} onChange={e => setDemoUrl(e.target.value)} placeholder="https://..." /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
            <span style={{ fontSize: '0.95rem' }}>⭐ 精选项目</span>
          </label>
          <motion.button type="submit" disabled={saving} className="btn btn-primary" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            {saving ? '保存中...' : '💾 保存'}
          </motion.button>
        </motion.form>
      </div>
    </div>
  )
}
