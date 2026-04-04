import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { directWrite } from '../lib/apiWrite'
import { uploadImage, deleteImageIfUnused, cleanupOrphanImages } from '../lib/storage'
import RichEditor from '../components/RichEditor'
import TagSelector from '../components/TagSelector'
import { SUPABASE_URL, ANON_KEY } from '../lib/config'


export default function EditBlog() {
  const { id } = useParams<{ id: string }>()
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    fetch(
      `${SUPABASE_URL}/rest/v1/blogs?id=eq.${encodeURIComponent(id)}&select=*`,
      {
        headers: {
          apikey: ANON_KEY,
          Authorization: 'Bearer ' + ANON_KEY,
        },
        signal: controller.signal,
      }
    ).then(r => r.json()).then(data => {
      clearTimeout(timer)
      if (data?.[0]) {
        setTitle(data[0].title || '')
        setContent(data[0].content || '')
        setCoverUrl(data[0].cover_url || '')
        // Parse tags - can be JSON array or comma-separated string
        const rawTags = data[0].tags
        let parsed: string[] = []
        if (Array.isArray(rawTags)) {
          parsed = rawTags
        } else if (typeof rawTags === 'string') {
          try { parsed = JSON.parse(rawTags) } catch { parsed = rawTags.split(',').map((t: string) => t.trim()).filter(Boolean) }
        }
        setSelectedTags(parsed)
        setPublished(data[0].published || false)
      }
      setLoading(false)
    }).catch(() => {
      clearTimeout(timer)
      setLoading(false)
    })
  }, [id])

  // Cleanup orphan tags (usage_count=0) from DB - called after saving/deleting a blog
  const cleanupUnusedTags = async () => {
    try {
      // Use localStorage as token source (same as TagSelector) since accessToken prop may be null
      const rawToken = localStorage.getItem('sb-osteeuwotaywuqsztipz-auth-token')
      const token = rawToken
        ? (rawToken.startsWith('{') ? JSON.parse(rawToken)?.access_token : rawToken)
        : null
      if (!token) return
      // Get all published blog tags
      const res = await fetch(SUPABASE_URL + '/rest/v1/blogs?select=tags&published=eq.true', {
        headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY },
      })
      const blogs = await res.json()
      const usage: Record<string, number> = {}
      blogs.forEach((b: any) => b.tags?.forEach((t: string) => { usage[t] = (usage[t] || 0) + 1 }))
      // Get all tags from DB
      const allTagsRes = await fetch(SUPABASE_URL + '/rest/v1/tags?select=id,slug', {
        headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY },
      })
      const allTags: { id: string; slug: string }[] = await allTagsRes.json()
      const unused = allTags.filter((t: { id: string; slug: string }) =>
        !usage[t.slug] && !selectedTags.includes(t.slug)
      )
      if (unused.length > 0 && token) {
        const ids = unused.map((t: { id: string }) => t.id).join(',')
        await fetch(SUPABASE_URL + '/rest/v1/tags?id=in.(' + ids + ')', {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token, 'apikey': ANON_KEY },
        })
      }
    } catch (err) {
      console.error('EditBlog: cleanupUnusedTags failed:', err)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !title.trim() || !accessToken) return
    setSaving(true)
    await directWrite(
      'PATCH', 'blogs',
      {
        title: title.trim(), content: content.trim(),
        cover_url: coverUrl.trim(), tags: selectedTags, published,
        updated_at: new Date().toISOString(),
      },
      `id=eq.${encodeURIComponent(id)}`,
    )
    await cleanupUnusedTags()
    setSaving(false)
    await cleanupOrphanImages()
    navigate('/blog')
  }

  const handleDelete = async () => {
    if (!id || !confirm('确定删除这篇文章？')) return
    await directWrite('DELETE', 'blogs', undefined, `id=eq.${encodeURIComponent(id)}`)
    await cleanupUnusedTags()
    await deleteImageIfUnused(coverUrl)
    navigate('/blog')
  }

  if (loading) return <div className="page" style={{ textAlign: 'center', padding: '4rem' }}>加载中...</div>

  return (
    <div className="page">
      <div className="section" style={{ maxWidth: 900 }}>
        <button
          onClick={() => navigate('/blog')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', fontSize: '0.9rem', padding: '0.3rem 0',
            marginBottom: '1.2rem', transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >← 返回博客列表</button>
        <motion.h1 className="section-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>✏️ 编辑博客</motion.h1>
        <motion.form onSubmit={handleSave} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.5rem' }}>
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
