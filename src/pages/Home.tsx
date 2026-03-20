import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <section style={{ textAlign: 'center', padding: '3rem 0' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👋 欢迎来到我的个人站</h1>
        <p style={{ color: '#666', fontSize: '1.1rem', lineHeight: 1.8 }}>
          这是一个基于 React + Supabase 构建的个人网站。
        </p>
        {user && (
          <p style={{ marginTop: '1rem', color: '#4a90d9' }}>
            已登录为：{user.email || user.user_metadata?.user_name || 'GitHub 用户'}
          </p>
        )}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem' }}>📝</div>
          <h3>博客</h3>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>分享技术与生活</p>
          <Link to="/blog" style={{ color: '#4a90d9' }}>查看博客 →</Link>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem' }}>💼</div>
          <h3>项目</h3>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>展示作品与实验</p>
          <Link to="/projects" style={{ color: '#4a90d9' }}>查看项目 →</Link>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem' }}>👤</div>
          <h3>关于</h3>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>了解我的背景</p>
          <Link to="/profile" style={{ color: '#4a90d9' }}>了解更多 →</Link>
        </div>
      </section>
    </div>
  )
}
