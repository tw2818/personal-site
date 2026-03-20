import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

interface UserProfile {
  id: string
  email: string
  nickname: string
  github: string
  created_at: string
}

export default function Admin() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await (supabase as any).rpc('get_users_admin')
    if (error) {
      const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      setUsers(profiles || [])
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`确定删除用户 ${email}？这将同时删除其所有数据。`)) return
    setDeleting(id)
    // Delete from profiles
    await supabase.from('profiles').delete().eq('id', id)
    // Delete from blogs
    await supabase.from('blogs').delete().eq('user_id', id)
    // Delete from projects
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
    <div className="page">
      <div className="section">
        <motion.h1 className="section-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          👥 账号管理
        </motion.h1>
        <motion.p className="section-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          管理所有注册用户
        </motion.p>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: '1.5rem' }}>
          <input
            className="form-input"
            placeholder="搜索用户邮箱、昵称、GitHub..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>加载中...</div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>用户</th>
                    <th style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>GitHub</th>
                    <th style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>注册时间</th>
                    <th style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>操作</th>
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
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 500 }}>{user.nickname || '未设置昵称'}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{user.email}</div>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {user.github ? (
                          <a href={`https://github.com/${user.github}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                            @{user.github}
                          </a>
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
                              background: 'transparent',
                              border: '1px solid #e94560',
                              color: '#e94560',
                              borderRadius: 8,
                              padding: '0.4rem 0.8rem',
                              cursor: deleting === user.id ? 'not-allowed' : 'pointer',
                              opacity: deleting === user.id ? 0.5 : 1,
                              fontSize: '0.85rem',
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
            <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              共 {filtered.length} 位用户
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
