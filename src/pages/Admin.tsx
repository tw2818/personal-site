import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface UserProfile {
  id: string
  email: string
  nickname: string
  github: string
  bilibili: string
  twitter: string
  avatar_url: string
  bio: string
  created_at: string
}

// ── Settings Tab ──────────────────────────────────────────
function SettingsTab() {
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
    setAvatarUrl(user.user_metadata?.avatar_url || '')
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
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
    await supabase.from('profiles').upsert({
      id: user.id, email: user.email, nickname, bio, github, bilibili, twitter, avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    setSaved(true)
  }

  return (
    <motion.form
      onSubmit={handleSave}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: 640 }}
    >
      <h2 style={{ fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>⚙️ 个人设置</h2>

      {[
        { label: '头像 URL', value: avatarUrl, set: setAvatarUrl, placeholder: 'https://...' },
        { label: '昵称', value: nickname, set: setNickname, placeholder: '你的昵称' },
        { label: '个人简介', value: bio, set: setBio, placeholder: '简单介绍一下自己', isTextarea: true },
        { label: 'GitHub 用户名', value: github, set: setGithub, placeholder: 'username' },
        { label: 'B站 ID', value: bilibili, set: setBilibili, placeholder: '' },
        { label: 'Twitter/X 用户名', value: twitter, set: setTwitter, placeholder: '' },
      ].map(f => (
        <div className="form-group" key={f.label}>
          <label>{f.label}</label>
          {f.isTextarea ? (
            <textarea className="form-input" value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} rows={3} />
          ) : (
            <input className="form-input" value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} />
          )}
        </div>
      ))}

      <motion.button
        type="submit"
        disabled={saving}
        className="btn btn-primary"
        style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {saving ? '💾 保存中...' : '💾 保存'}
      </motion.button>
      {saved && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#34c759', fontSize: '0.95rem' }}>✅ 保存成功</motion.p>}
    </motion.form>
  )
}

// ── Users Tab ────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    const { data } = await (supabase as any).rpc('get_users_admin')
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定删除用户 ${name}？这将同时删除其所有数据。`)) return
    setDeleting(id)
    await supabase.from('profiles').delete().eq('id', id)
    await supabase.from('blogs').delete().eq('user_id', id)
    await supabase.from('projects').delete().eq('user_id', id)
    setDeleting(null)
    fetchUsers()
  }

  const filtered = users.filter(u =>
    (u.email || '').includes(search) ||
    (u.nickname || '').includes(search) ||
    (u.github || '').includes(search)
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>👥 账号管理</h2>
        <button onClick={fetchUsers} disabled={loading} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.3rem 0.8rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>🔄 刷新</button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <input
          className="form-input"
          placeholder="搜索用户邮箱、昵称、GitHub..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>加载中...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                {['用户', 'GitHub', '注册时间', '操作'].map(h => (
                  <th key={h} style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>暂无用户</td></tr>
              ) : filtered.map((user, i) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 500 }}>{user.nickname || '未设置昵称'}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{user.email}</div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {user.github ? (
                      <a href={`https://github.com/${user.github}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>@{user.github}</a>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {new Date(user.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {user.github !== 'tw2818' ? (
                      <button
                        onClick={() => handleDelete(user.id, user.email || user.nickname || '该用户')}
                        disabled={deleting === user.id}
                        style={{
                          background: 'transparent', border: '1px solid #e94560', color: '#e94560',
                          borderRadius: 8, padding: '0.4rem 0.8rem', cursor: deleting === user.id ? 'not-allowed' : 'pointer',
                          opacity: deleting === user.id ? 0.5 : 1, fontSize: '0.85rem',
                        }}
                      >
                        {deleting === user.id ? '删除中...' : '🗑 删除'}
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>👑 站主</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>共 {filtered.length} 位用户</div>
    </motion.div>
  )
}

// ── Admin Page ────────────────────────────────────────────
export default function Admin() {
  const [tab, setTab] = useState<'settings' | 'users'>('settings')

  return (
    <div className="page">
      <div className="section">
        <motion.h1 className="section-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          管理后台
        </motion.h1>
        <motion.p className="section-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          在这里管理个人资料和所有用户
        </motion.p>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
          {[
            { key: 'settings', label: '⚙️ 个人设置' },
            { key: 'users', label: '👥 账号管理' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.95rem', fontWeight: 500, padding: '0.6rem 1rem',
                color: tab === t.key ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.2s',
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'settings' ? <SettingsTab key="settings" /> : <UsersTab key="users" />}
      </div>
    </div>
  )
}
