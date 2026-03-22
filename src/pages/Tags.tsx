import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { SUPABASE_URL, ANON_KEY, ADMIN_USER } from '../lib/config'


interface Tag {
  id: string
  name: string
  slug: string
  color: string
  created_at: string
  usage_count?: number
}

export default function Tags() {
  const { user, accessToken } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.user_metadata?.user_name === ADMIN_USER
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6366f1')
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Redirect non-admins
  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/')
    }
  }, [loading, isAdmin, navigate])

  const fetchTags = async () => {
    setLoading(true)
    try {
      // Fetch tags
      const tagsRes = await fetch(`${SUPABASE_URL}/rest/v1/tags?select=*&order=name.asc`, {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      })
      const tagsData = await tagsRes.json()
      if (!Array.isArray(tagsData)) throw new Error('Failed to fetch tags')

      // Fetch usage counts from blogs
      const blogsRes = await fetch(`${SUPABASE_URL}/rest/v1/blogs?select=tags&published=eq.true`, {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      })
      const blogsData = await blogsRes.json()
      const usageMap: Record<string, number> = {}
      if (Array.isArray(blogsData)) {
        blogsData.forEach((blog: { tags?: string[] }) => {
          blog.tags?.forEach((t: string) => {
            usageMap[t] = (usageMap[t] || 0) + 1
          })
        })
      }

      // Match by slug (blog tags are strings, tags table uses slug)
      const tagsWithCount = tagsData.map((tag: Tag) => ({
        ...tag,
        usage_count: usageMap[tag.slug] || 0,
      }))

      // Auto-delete tags with zero usage
      const unusedTags = tagsWithCount.filter(t => t.usage_count === 0)
      if (unusedTags.length > 0 && accessToken) {
        const unusedIds = unusedTags.map(t => t.id).join(',')
        await fetch(`${SUPABASE_URL}/rest/v1/tags?id=in.(${unusedIds})`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        })
        // Remove deleted tags from state
        setTags(tagsWithCount.filter(t => t.usage_count > 0))
      } else {
        setTags(tagsWithCount)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) fetchTags()
    else setLoading(false)
  }, [isAdmin])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !accessToken) return
    setCreating(true)
    const slug = newName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/tags`, {
        method: 'POST',
        headers: {
          // No apikey — Authorization Bearer token establishes proper auth context for RLS
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ name: newName.trim(), slug, color: newColor }),
      })
      if (res.ok) {
        setNewName('')
        setNewColor('#6366f1')
        fetchTags()
      } else {
        const err = await res.json()
        alert('创建失败: ' + (err.message || JSON.stringify(err)))
      }
    } catch (err: any) {
      alert('创建失败: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (tag: Tag) => {
    if (tag.usage_count && tag.usage_count > 0) {
      alert(`标签 "${tag.name}" 正在被 ${tag.usage_count} 篇文章使用，无法删除。`)
      return
    }
    if (!confirm(`确定要删除标签 "${tag.name}" 吗？`)) return
    setDeletingId(tag.id)
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/tags?id=eq.${tag.id}`, {
        method: 'DELETE',
        headers: {
          // No apikey — Authorization Bearer token establishes proper auth context for RLS
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      if (res.ok || res.status === 204) {
        fetchTags()
      } else {
        const err = await res.json()
        alert('删除失败: ' + (err.message || JSON.stringify(err)))
      }
    } catch (err: any) {
      alert('删除失败: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  if (!isAdmin && !loading) return null

  return (
    <div className="page">
      <div className="section">
        <motion.h1 className="section-title" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>标签管理</motion.h1>
        <motion.p className="section-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>统一管理博客标签</motion.p>

        {/* Add tag form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ marginBottom: '2rem' }}>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '1rem 1.25rem', borderRadius: 12, border: '1px solid var(--border)' }}>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="标签名称"
              style={{
                flex: 1, minWidth: 140, padding: '0.5rem 0.75rem',
                border: '1px solid var(--border)', borderRadius: 8,
                background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', outline: 'none',
              }}
            />
            <input
              type="color"
              value={newColor}
              onChange={e => setNewColor(e.target.value)}
              style={{ width: 40, height: 36, padding: 2, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: 'none' }}
            />
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              style={{
                background: creating ? 'var(--text-secondary)' : 'var(--accent)',
                color: '#fff', border: 'none', borderRadius: 8,
                padding: '0.5rem 1.25rem', fontSize: '0.9rem', cursor: creating ? 'not-allowed' : 'pointer',
                fontWeight: 500,
              }}
            >
              {creating ? '创建中...' : '+ 添加标签'}
            </button>
          </form>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>加载中...</div>
        ) : tags.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏷️</p>
            <p>还没有标签</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {tags.map(tag => (
              <div
                key={tag.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: tag.color + '20',
                  border: `1px solid ${tag.color}50`,
                  borderRadius: 980,
                  padding: '0.4rem 0.75rem',
                  color: tag.color,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: tag.color, display: 'inline-block', flexShrink: 0 }} />
                <span>{tag.name}</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({tag.usage_count || 0})</span>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(tag)}
                    disabled={deletingId === tag.id}
                    style={{
                      background: 'none', border: 'none', cursor: deletingId === tag.id ? 'not-allowed' : 'pointer',
                      color: 'var(--text-secondary)', opacity: 1, padding: '0 2px', fontSize: '1rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center',
                    }}
                    title="删除标签"
                  >
                    {deletingId === tag.id ? '...' : '×'}
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
