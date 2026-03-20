import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { uploadImage } from '../lib/storage'
import { uploadImage } from '../lib/storage'
import { useAuth } from '../contexts/AuthContext'

export default function Settings() {
  const { user } = useAuth()
  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [github, setGithub] = useState('')
  const [bilibili, setBilibili] = useState('')
  const [twitter, setTwitter] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    setAvatarError('')
    const url = await uploadImage(file)
    setUploadingAvatar(false)
    if (url) {
      setAvatarUrl(url)
    } else {
      setAvatarError('头像上传失败，请重试')
    }
  }

  useEffect(() => {
    if (!user) return
    setNickname(user.user_metadata?.full_name || '')
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    setAvatarError('')
    const url = await uploadImage(file)
    if (url) { setAvatarUrl(url) } else { setAvatarError('上传失败，请重试') }
    setUploadingAvatar(false)
  }

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

  if (!user) return <div className="page" style={{ textAlign: 'center', padding: '6rem' }}>请先登录</div>

  return (
    <div className="page">
      <div className="section" style={{ maxWidth: 640 }}>
        <motion.h1 className="section-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>设置</motion.h1>
        <motion.p className="section-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>编辑你的个人资料</motion.p>

        <motion.form
          onSubmit={handleSave}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}
        >
          {[
            { label: '头像', value: avatarUrl, set: setAvatarUrl, placeholder: 'https://...' },
            { label: '昵称', value: nickname, set: setNickname, placeholder: '你的昵称' },
            { label: '个人简介', value: bio, set: setBio, placeholder: '简单介绍一下自己' },
            { label: 'GitHub 用户名', value: github, set: setGithub, placeholder: 'username' },
            { label: 'B站 ID', value: bilibili, set: setBilibili, placeholder: '' },
            { label: 'Twitter/X 用户名', value: twitter, set: setTwitter, placeholder: '' },
          ].map(f => (
            <div className="form-group" key={f.label}>
              <label>{f.label}</label>
              {f.label === '头像' ? (
                <>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'block', marginBottom: '0.5rem' }} />
                  {uploadingAvatar && <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>上传中...</span>}
                  {avatarError && <span style={{ fontSize: '0.9rem', color: '#e94560' }}>{avatarError}</span>}
                  {f.value && <img src={f.value} alt="头像预览" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginTop: '0.5rem', display: 'block' }} />}
                  <input className="form-input" value={f.value} onChange={e => f.set(e.target.value)} placeholder="或直接输入头像 URL" style={{ marginTop: '0.5rem' }} />
                </>
              ) : f.label === '个人简介' ? (
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
      </div>
    </div>
  )
}
