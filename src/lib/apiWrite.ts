import { useAuth } from '../contexts/AuthContext'

const SUPABASE_URL = 'https://osteeuwotaywuqsztipz.supabase.co'


// Get access token directly from localStorage (same key Supabase JS client uses)
export function getLocalToken(): string | null {
  try {
    const raw = localStorage.getItem('sb-osteeuwotaywuqsztipz-auth-token')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed.access_token || null
  } catch { return null }
}

// Use the user's access token for writes via hook (accessToken from React state)
export function useApiWrite() {
  const { accessToken } = useAuth()

  async function apiWrite(
    method: 'POST' | 'PATCH' | 'DELETE',
    table: string,
    body?: Record<string, any>,
    params?: string
  ) {
    const token = getLocalToken() || accessToken
    if (!token) return { error: 'not authenticated' }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)

    try {
      let url = `${SUPABASE_URL}/rest/v1/${table}`
      if (params) url += `?${params}`

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          // No apikey when we have a real token — apikey=anon would override JWT auth context
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

  return {
    insert: (table: string, body: Record<string, any>) => apiWrite('POST', table, body),
    update: (table: string, body: Record<string, any>, params?: string) => apiWrite('PATCH', table, body, params),
    delete: (table: string, params?: string) => apiWrite('DELETE', table, undefined, params),
  }
}

// Direct REST write (token fetched from localStorage internally)
export async function directWrite(
  method: 'POST' | 'PATCH' | 'DELETE',
  table: string,
  body: Record<string, any> | undefined,
  params?: string
) {
  const token = getLocalToken()
  if (!token) return { error: 'not authenticated' }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)

  try {
    let url = `${SUPABASE_URL}/rest/v1/${table}?${params}`
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // No apikey — Authorization Bearer token establishes proper auth context for RLS
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
