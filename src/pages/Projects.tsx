import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Project {
  id: string
  name: string
  description: string
  cover_url: string
  github_url: string
  demo_url: string
  featured: boolean
}

export default function Projects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('projects')
      .select('*')
      .order('featured', { ascending: false })
      .then(({ data }) => {
        setProjects(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>💼 项目展示</h1>
        {user && <Link to="/projects/new" style={{ background: '#4a90d9', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', textDecoration: 'none' }}>+ 新增项目</Link>}
      </div>

      {loading ? (
        <p>加载中...</p>
      ) : projects.length === 0 ? (
        <p style={{ color: '#666' }}>还没有项目，{user ? <Link to="/projects/new">添加一个</Link> : '敬请期待'}。</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {projects.map(project => (
            <div key={project.id} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
              {project.cover_url && <img src={project.cover_url} alt={project.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />}
              <div style={{ padding: '1rem' }}>
                <h3>{project.featured && '⭐ '}{project.name}</h3>
                <p style={{ color: '#666', fontSize: '0.9rem', margin: '0.5rem 0' }}>{project.description || '暂无描述'}</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {project.github_url && <a href={project.github_url} target="_blank" rel="noreferrer" style={{ color: '#24292e' }}>🐙 源码</a>}
                  {project.demo_url && <a href={project.demo_url} target="_blank" rel="noreferrer" style={{ color: '#4a90d9' }}>🔗 演示</a>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
