import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

interface Profile {
  id: string
  nickname: string
  avatar_url: string
  bio: string
  github: string
  bilibili: string
  twitter: string
}

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setProfile(data)
        setLoading(false)
      })
  }, [user])

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>加载中...</div>
  if (!user) return <div style={{ padding: '2rem', textAlign: 'center' }}>请先 <Link to="/login">登录</Link></div>

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <img
          src={profile?.avatar_url || `https://github.com/${user.user_metadata?.user_name || 'github'}.png`}
          alt="avatar"
          style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <h1 style={{ marginTop: '1rem' }}>{profile?.nickname || user.user_metadata?.full_name || user.user_metadata?.user_name || '未设置昵称'}</h1>
        <p style={{ color: '#666' }}>{profile?.bio || '这个人很懒，什么都没写'}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
          {profile?.github && <a href={`https://github.com/${profile.github}`} target="_blank" rel="noreferrer">🐙 GitHub</a>}
          {profile?.bilibili && <span>📺 B站: {profile.bilibili}</span>}
          {profile?.twitter && <span>🐦 Twitter: {profile.twitter}</span>}
        </div>
        <Link to="/settings" style={{ display: 'inline-block', marginTop: '1rem', color: '#4a90d9' }}>✏️ 编辑个人资料</Link>
      </div>
    </div>
  )
}
