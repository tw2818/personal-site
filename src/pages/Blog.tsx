import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Blog {
  id: string
  title: string
  content: string
  cover_url: string
  tags: string[]
  created_at: string
}

export default function Blog() {
  const { user } = useAuth()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('blogs')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBlogs(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>📝 博客</h1>
        {user && <Link to="/blog/new" style={{ background: '#4a90d9', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', textDecoration: 'none' }}>+ 新建文章</Link>}
      </div>

      {loading ? (
        <p>加载中...</p>
      ) : blogs.length === 0 ? (
        <p style={{ color: '#666' }}>还没有文章，{user ? <Link to="/blog/new">写一篇</Link> : '敬请期待'}。</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {blogs.map(blog => (
            <article key={blog.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem' }}>
              {blog.cover_url && <img src={blog.cover_url} alt={blog.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '6px', marginBottom: '1rem' }} />}
              <h2 style={{ marginBottom: '0.5rem' }}>{blog.title}</h2>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>{new Date(blog.created_at).toLocaleDateString('zh-CN')}</p>
              <p style={{ marginTop: '0.5rem', color: '#444', lineHeight: 1.6 }}>{blog.content.slice(0, 200)}{blog.content.length > 200 ? '...' : ''}</p>
              {blog.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {blog.tags.map(tag => <span key={tag} style={{ background: '#eee', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem' }}>{tag}</span>)}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
