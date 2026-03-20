import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Settings() {
  const { user } = useAuth()
  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [github, setGithub] = useState('')
  const [bilibili, setBilibili] = useState('')
  const [twitter, setTwitter] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    setNickname(user.user_metadata?.full_name || '')
    setAvatarUrl(user.user_metadata?.avatar_url || '')
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setNickname(data.nickname || '')
          setBio(data.bio || '')
          setGithub(data.github || '')
          setBilibili(data.bilibili || '')
          setTwitter(data.twitter || '')
          setAvatarUrl(data.avatar_url || '')
        }
      })
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setSaved(false)
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        nickname,
        bio,
        github,
        bilibili,
        twitter,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
    setSaving(false)
    if (!error) setSaved(true)
  }

  if (!user) return <div style={{ padding: '2rem' }}>请先登录</div>

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>⚙️ 设置</h1>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold' }}>头像 URL</label>
          <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold' }}>昵称</label>
          <input value={nickname} onChange={e => setNickname(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold' }}>个人简介</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold' }}>GitHub 用户名</label>
          <input value={github} onChange={e => setGithub(e.target.value)} placeholder="username" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold' }}>B站 ID</label>
          <input value={bilibili} onChange={e => setBilibili(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold' }}>Twitter/X 用户名</label>
          <input value={twitter} onChange={e => setTwitter(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <button type="submit" disabled={saving} style={{ padding: '0.7rem', background: '#4a90d9', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' }}>
          {saving ? '保存中...' : '💾 保存'}
        </button>
        {saved && <p style={{ color: 'green' }}>✅ 保存成功</p>}
      </form>
    </div>
  )
}
