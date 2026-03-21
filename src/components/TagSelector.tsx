import { useState, useEffect, useRef } from 'react'

const SUPABASE_URL = 'https://osteeuwotaywuqsztipz.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdGVldXdvdGF5d3Vxc3p0aXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTk0MzMsImV4cCI6MjA4OTU3NTQzM30.wgHZxt9bDT4eWg6beHzZUMsMwnDoIexU_nHUudneSJM'

export interface Tag {
  id: string
  name: string
  slug: string
  color: string
}

interface TagSelectorProps {
  value: string[]           // array of tag slugs (stored in blogs.tags)
  onChange: (slugs: string[]) => void
  accessToken?: string | null
}

const RANDOM_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6',
]

function randomColor() {
  return RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)]
}

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function TagSelector({ value, onChange, accessToken }: TagSelectorProps) {
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [creating, setCreating] = useState(false)
  const [inputError, setInputError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch tags from the tags table
  const fetchTags = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/tags?select=*&order=name.asc`, {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      })
      const data = await res.json()
      if (Array.isArray(data)) setAllTags(data)
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTags()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectedSlugs = new Set(value)

  const filteredTags = inputValue.trim()
    ? allTags.filter(t => t.name.toLowerCase().includes(inputValue.toLowerCase()))
    : allTags

  const exactMatch = allTags.find(t => t.name.toLowerCase() === inputValue.trim().toLowerCase())
  const inputTrimmed = inputValue.trim()

  const handleInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setInputError('')

      if (!inputTrimmed) return

      // Check if already selected
      if (selectedSlugs.has(slugify(inputTrimmed))) {
        setInputValue('')
        setShowDropdown(false)
        return
      }

      // Check if exact match exists in allTags
      if (exactMatch) {
        // Select existing tag
        onChange([...value, exactMatch.slug])
        setInputValue('')
        setShowDropdown(false)
        return
      }

      // Create new tag
      if (!accessToken) {
        setInputError('需要登录才能创建标签')
        return
      }

      setCreating(true)
      const slug = slugify(inputTrimmed)
      const color = randomColor()
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/tags`, {
          method: 'POST',
          headers: {
            // No apikey — Authorization Bearer token establishes proper auth context for RLS
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({ name: inputTrimmed, slug, color }),
        })
        if (res.ok) {
          const [newTag] = await res.json()
          setAllTags(prev => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)))
          onChange([...value, slug])
          setInputValue('')
          setShowDropdown(false)
        } else {
          const err = await res.json()
          setInputError('创建失败: ' + (err.message || JSON.stringify(err)))
        }
      } catch (err: any) {
        setInputError('创建失败: ' + err.message)
      } finally {
        setCreating(false)
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag on backspace when input is empty
      onChange(value.slice(0, -1))
    }
  }

  const toggleTag = (tag: Tag) => {
    if (selectedSlugs.has(tag.slug)) {
      onChange(value.filter(s => s !== tag.slug))
    } else {
      onChange([...value, tag.slug])
    }
  }

  const removeTag = (slug: string) => {
    onChange(value.filter(s => s !== slug))
  }

  // Map selected slugs to full tag objects (preserve name even if tag was deleted from DB)
  const selectedTagObjects: Tag[] = value.map(slug => {
    const found = allTags.find(t => t.slug === slug)
    return found || { id: slug, name: slug, slug, color: '#6366f1' }
  })

  return (
    <div>
      {/* Selected tag pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem', minHeight: 8 }}>
        {selectedTagObjects.map(tag => (
          <span
            key={tag.slug}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              background: tag.color + '20',
              border: `1px solid ${tag.color}50`,
              borderRadius: 980,
              padding: '0.25rem 0.6rem',
              color: tag.color,
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: tag.color, display: 'inline-block' }} />
            {tag.name}
            <button
              type="button"
              onClick={() => removeTag(tag.slug)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: tag.color, opacity: 0.7, padding: 0, fontSize: '0.9rem',
                lineHeight: 1, marginLeft: '0.1rem',
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Input area */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => { setInputValue(e.target.value); setShowDropdown(true); setInputError('') }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleInputKeyDown}
          placeholder={loading ? '加载标签中...' : '输入标签名称，按 Enter 创建或选择'}
          style={{
            width: '100%', padding: '0.5rem 0.75rem',
            border: `1px solid ${inputError ? '#e94560' : 'var(--border)'}`,
            borderRadius: 8,
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: '0.9rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {inputError && (
          <span style={{ fontSize: '0.8rem', color: '#e94560', marginTop: '0.25rem', display: 'block' }}>{inputError}</span>
        )}

        {showDropdown && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            marginTop: '0.25rem',
            maxHeight: 240, overflowY: 'auto',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}>
            {filteredTags.length === 0 && !inputTrimmed && (
              <div style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                暂无标签，输入名称按 Enter 创建
              </div>
            )}
            {filteredTags.map(tag => {
              const isSelected = selectedSlugs.has(tag.slug)
              return (
                <div
                  key={tag.id}
                  onClick={() => { toggleTag(tag); setInputValue(''); setShowDropdown(false) }}
                  style={{
                    padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    gap: '0.5rem', fontSize: '0.9rem',
                    background: isSelected ? tag.color + '15' : 'transparent',
                    color: isSelected ? tag.color : 'var(--text)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = tag.color + '10')}
                  onMouseLeave={e => (e.currentTarget.style.background = isSelected ? tag.color + '15' : 'transparent')}
                >
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: tag.color, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{tag.name}</span>
                  {isSelected && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>✓</span>}
                  {!exactMatch && inputTrimmed && tag.name.toLowerCase().includes(inputTrimmed.toLowerCase()) && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>按 Enter 创建</span>
                  )}
                </div>
              )
            })}
            {inputTrimmed && !exactMatch && (
              <div style={{
                padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: '0.5rem', fontSize: '0.9rem', borderTop: '1px solid var(--border)',
                color: 'var(--accent)', fontWeight: 500,
              }}
              onClick={() => inputRef.current?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))}
              >
                {creating ? '创建中...' : <>+ 创建标签 "{inputTrimmed}"</>}
              </div>
            )}
          </div>
        )}
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
        从下拉列表选择已有标签，或输入新名称按 Enter 创建
      </p>
    </div>
  )
}
