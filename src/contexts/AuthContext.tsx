import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  accessToken: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  accessToken: null,
})

interface JWTPayload {
  sub: string
  email: string
  exp?: number
  user_metadata?: Record<string, unknown>
}

function isValidJWT(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as JWTPayload
    if (!payload.sub || !payload.email) return false
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return false
    return true
  } catch {
    return false
  }
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payloadStr = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = payloadStr + '=='.slice(0, (4 - payloadStr.length % 4) % 4)
    return JSON.parse(atob(padded)) as JWTPayload
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const readLocalSession = () => {
      try {
        const raw = localStorage.getItem('sb-osteeuwotaywuqsztipz-auth-token')
        if (!raw) return null
        const parsed = JSON.parse(raw)
        return parsed.access_token || null
      } catch {
        return null
      }
    }

    const initAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')

        if (code) {
          window.history.replaceState({}, '', window.location.pathname)
          ;(supabase.auth as any).exchangeCodeForSession(code)
            .then(({ data, error }: any) => {
              if (error) {
                console.error('OAuth code exchange error:', error)
                if (!cancelled) setLoading(false)
                return
              }
              if (data?.session) {
                localStorage.setItem('sb-osteeuwotaywuqsztipz-auth-token', JSON.stringify({
                  access_token: data.session.access_token,
                  refresh_token: data.session.refresh_token || '',
                  expires_at: Math.floor(Date.now() / 1000) + 3600,
                  expires_in: 3600,
                  token_type: 'bearer',
                  user: data.session.user,
                }))
                setSession(data.session)
                setUser(data.session.user)
                setAccessToken(data.session.access_token)
                ensureProfile(data.session.user)
                setTimeout(() => { window.location.replace('/') }, 50)
                return
              }
              if (!cancelled) setLoading(false)
            })
            .catch((err: any) => {
              console.error('OAuth exchange thrown:', err)
              if (!cancelled) setLoading(false)
            })
          return
        }

        const localToken = readLocalSession()
        if (localToken) {
          if (!isValidJWT(localToken)) {
            localStorage.removeItem('sb-osteeuwotaywuqsztipz-auth-token')
            if (!cancelled) {
              setSession(null)
              setUser(null)
              setAccessToken(null)
              setLoading(false)
            }
            return
          }
          try {
            const payload = decodeJWT(localToken)
            if (!payload) throw new Error('Invalid JWT payload')
            const fakeUser = { id: payload.sub, email: payload.email, user_metadata: payload.user_metadata || {} } as User
            setAccessToken(localToken)
            setUser(fakeUser)
          } catch {
            localStorage.removeItem('sb-osteeuwotaywuqsztipz-auth-token')
            if (!cancelled) {
              setSession(null)
              setUser(null)
              setAccessToken(null)
              setLoading(false)
            }
            return
          }
        } else {
          if (!cancelled) {
            setSession(null)
            setUser(null)
            setAccessToken(null)
          }
        }
        if (!cancelled) setLoading(false)
      } catch (err) {
        console.error('Auth init error:', err)
        if (!cancelled) {
          setSession(null)
          setUser(null)
          setAccessToken(null)
        }
      }
    }

    const ensureProfile = async (user: User) => {
      try {
        const { data: existing } = await supabase
          .from('profiles').select('id').eq('id', user.id).single()
        if (!existing) {
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            nickname: '',
            avatar_url: user.user_metadata?.avatar_url || '',
            github: user.user_metadata?.user_name || '',
          })
        }
      } catch {
        // Silently fail - profile creation is best effort
      }
    }

    initAuth()

    const timeout = setTimeout(() => { if (!cancelled) setLoading(false) }, 8000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return
      setSession(session)
      setUser(session?.user ?? null)
      setAccessToken(session?.access_token ?? null)
      if (session?.user) ensureProfile(session.user)
    })

    return () => {
      cancelled = true
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading, accessToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
