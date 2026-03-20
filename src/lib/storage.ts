import { supabase } from './supabase'

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
