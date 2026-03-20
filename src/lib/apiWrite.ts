import { useAuth } from '../contexts/AuthContext'

const SUPABASE_URL = 'https://osteeuwotaywuqsztipz.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdGVldXdvdGF5d3Vxc3p0aXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTk0MzMsImV4cCI6MjA4OTU3NTQzM30.wgHZxt9bDT4eWg6beHzZUMsMwnDoIexU_nHUudneSJM'

// Use the user's access token (not anon key) for writes - bypasses supabase JS session deadlock
// while still being secure (RLS uses auth.uid() from the real JWT)
export function useApiWrite() {
  const { accessToken } = useAuth()

  async function apiWrite(
    method: 'POST' | 'PATCH' | 'DELETE',
    table: string,
    body?: Record<string, any>,
    params?: string // e.g. "id=eq.xxx"
  ) {
    if (!accessToken) return { error: 'not authenticated' }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)

    try {
      let url = `${SUPABASE_URL}/rest/v1/${table}`
      if (params) url += `?${params}`

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': method === 'POST' ? 'return=representation' : '',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })
      clearTimeout(timer)
      const data = await res.json()
      if (!res.ok) return { error: data?.message || `HTTP ${res.status}` }
      return { data }
    } catch {
      clearTimeout(timer)
      return { error: '请求失败，请重试' }
    }
  }

  return {
    insert: (table: string, body: Record<string, any>) => apiWrite('POST', table, body),
    update: (table: string, body: Record<string, any>, params: string) => apiWrite('PATCH', table, body, params),
    delete: (table: string, params: string) => apiWrite('DELETE', table, undefined, params),
  }
}

// Direct REST write without hook (for use in non-React contexts)
export async function directWrite(
  method: 'POST' | 'PATCH' | 'DELETE',
  table: string,
  body: Record<string, any> | undefined,
  params: string,
  token: string
) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)

  try {
    let url = `${SUPABASE_URL}/rest/v1/${table}?${params}`
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Prefer': method === 'POST' ? 'return=representation' : '',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    clearTimeout(timer)
    const data = await res.json()
    if (!res.ok) return { error: data?.message || `HTTP ${res.status}` }
    return { data }
  } catch {
    clearTimeout(timer)
    return { error: '请求失败，请重试' }
  }
}
