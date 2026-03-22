import { supabase } from './supabase'
import { SUPABASE_URL, ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from './config'

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
    // Extract filename from URL: .../blog-images/filename.jpg
    const filename = imageUrl.split('/blog-images/')[1]
    if (!filename) return

    // Check which blogs currently use this image
    // Check blogs
    const blogsRes = await fetch(`${SUPABASE_URL}/rest/v1/blogs?select=id,cover_url&cover_url=eq.${encodeURIComponent(filename)}`, {
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` },
    })
    const blogs: { id: string; cover_url: string }[] = await blogsRes.json()
    // Check projects
    const projectsRes = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id,cover_url&cover_url=eq.${encodeURIComponent(filename)}`, {
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` },
    })
    const projects: { id: string; cover_url: string }[] = await projectsRes.json()
    // Combine and filter out the current item (if updating)
    const stillUsed = [...blogs, ...projects].filter(item => !currentBlogId || item.id !== currentBlogId)
    if (stillUsed.length > 0) return // Still referenced

    // Not used anywhere - delete from storage
    await fetch(`${SUPABASE_URL}/storage/v1/object/blog-images/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      },
    })
  } catch {}
}

export async function cleanupOrphanImages(): Promise<void> {
  try {
    // Get all blog cover images currently in use
    const blogsRes = await fetch(`${SUPABASE_URL}/rest/v1/blogs?select=id,cover_url`, {
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` },
    })
    const blogs: { id: string; cover_url: string }[] = await blogsRes.json()
    // Get all project cover images currently in use
    const projectsRes = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id,cover_url`, {
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` },
    })
    const projects: { id: string; cover_url: string }[] = await projectsRes.json()
    const inUse = new Set([
      ...blogs.map(b => b.cover_url?.split('/blog-images/')[1]),
      ...projects.map(p => p.cover_url?.split('/blog-images/')[1]),
    ].filter(Boolean))

    // List all files in storage
    const storageRes = await fetch(`${SUPABASE_URL}/storage/v1/object/blog-images/`, {
      headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'apikey': SUPABASE_SERVICE_ROLE_KEY },
    })
    const files: { name: string }[] = await storageRes.json()
    const toDelete = files.filter(f => f.name && !inUse.has(f.name))

    for (const file of toDelete) {
      await fetch(`${SUPABASE_URL}/storage/v1/object/blog-images/${encodeURIComponent(file.name)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'apikey': SUPABASE_SERVICE_ROLE_KEY },
      })
    }
  } catch {}
}

