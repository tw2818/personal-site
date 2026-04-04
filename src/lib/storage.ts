import { supabase } from './supabase'
import { SUPABASE_URL, ANON_KEY } from './config'

function getLocalToken(): string | null {
  try {
    const raw = localStorage.getItem('sb-osteeuwotaywuqsztipz-auth-token')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed.access_token || null
  } catch { return null }
}

export async function uploadImage(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from('blog-images')
    .upload(filename, file, { upsert: false })

  if (error || !data) {
    console.error('Upload failed:', error)
    return null
  }

  const { data: urlData } = supabase.storage
    .from('blog-images')
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

export async function deleteImageIfUnused(imageUrl: string, currentBlogId?: string): Promise<void> {
  if (!imageUrl) return
  try {
    const filename = imageUrl.split('/blog-images/')[1]
    if (!filename) return

    const blogsRes = await fetch(`${SUPABASE_URL}/rest/v1/blogs?select=id,cover_url&cover_url=eq.${encodeURIComponent(filename)}`, {
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` },
    })
    const blogs: { id: string; cover_url: string }[] = await blogsRes.json()
    const projectsRes = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id,cover_url&cover_url=eq.${encodeURIComponent(filename)}`, {
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` },
    })
    const projects: { id: string; cover_url: string }[] = await projectsRes.json()
    const stillUsed = [...blogs, ...projects].filter(item => !currentBlogId || item.id !== currentBlogId)
    if (stillUsed.length > 0) return

    const token = getLocalToken()
    if (!token) {
      console.error('deleteImageIfUnused: No auth token available')
      return
    }

    const { error } = await supabase.storage
      .from('blog-images')
      .remove([filename])

    if (error) {
      console.error('deleteImageIfUnused: Failed to delete image:', error)
    }
  } catch (err) {
    console.error('deleteImageIfUnused: Unexpected error:', err)
  }
}

export async function cleanupOrphanImages(): Promise<void> {
  try {
    const blogsRes = await fetch(`${SUPABASE_URL}/rest/v1/blogs?select=id,cover_url`, {
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` },
    })
    const blogs: { id: string; cover_url: string }[] = await blogsRes.json()
    const projectsRes = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id,cover_url`, {
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` },
    })
    const projects: { id: string; cover_url: string }[] = await projectsRes.json()
    const inUse = new Set([
      ...blogs.map(b => b.cover_url?.split('/blog-images/')[1]),
      ...projects.map(p => p.cover_url?.split('/blog-images/')[1]),
    ].filter(Boolean))

    const storageRes = await supabase.storage
      .from('blog-images')
      .list()

    if (storageRes.error) {
      console.error('cleanupOrphanImages: Failed to list storage:', storageRes.error)
      return
    }

    const files = storageRes.data?.filter(f => f.name) || []
    const toDelete = files.filter(f => f.name && !inUse.has(f.name))

    if (toDelete.length === 0) return

    const token = getLocalToken()
    if (!token) {
      console.error('cleanupOrphanImages: No auth token available')
      return
    }

    const { error } = await supabase.storage
      .from('blog-images')
      .remove(toDelete.map(f => f.name))

    if (error) {
      console.error('cleanupOrphanImages: Failed to delete images:', error)
    }
  } catch (err) {
    console.error('cleanupOrphanImages: Unexpected error:', err)
  }
}