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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    // Read session from localStorage directly - avoids supabase JS getSession() hang
    const readLocalSession = () => {
      try {
        const raw = localStorage.getItem('sb-osteeuwotaywuqsztipz-auth-token')
        if (raw) {
          const parsed = JSON.parse(raw)
          return parsed.access_token || null
        }
      } catch {}
      return null
    }

    const initAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')

        if (code) {
          window.history.replaceState({}, '', window.location.pathname)
          const { data } = await (supabase.auth as any).exchangeCodeForSession(code)
          if (!cancelled && data?.session) {
            setSession(data.session)
            setUser(data.session.user)
            setAccessToken(data.session.access_token)
            ensureProfile(data.session.user)
            window.location.href = '/'
            return
          }
          if (!cancelled) setLoading(false)
        }

        // Read token from localStorage immediately (sync, no hang)
        const localToken = readLocalSession()
        if (localToken) {
          // Decode JWT using URL-safe base64 (Supabase uses -_ instead of +/)
          try {
            const base64 = localToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
            const padded = base64 + '=='.slice(0, (4 - base64.length % 4) % 4)
            const payload = JSON.parse(atob(padded))
            const fakeUser = { id: payload.sub, email: payload.email, user_metadata: payload.user_metadata || {} } as User
            setAccessToken(localToken)
            setUser(fakeUser)
            setLoading(false)
          } catch {
            // Token corrupted — do NOT call getSession() (hangs due to deadlock bug).
            // Just log out gracefully and continue without auth.
            if (!cancelled) {
              setSession(null)
              setUser(null)
              setAccessToken(null)
              setLoading(false)
            }
          }
        } else {
          if (!cancelled) {
            setSession(null)
            setUser(null)
            setAccessToken(null)
            setLoading(false)
          }
        }
      } catch (err) {
        console.error('Auth init error:', err)
        if (!cancelled) {
          setSession(null)
          setUser(null)
          setAccessToken(null)
          setLoading(false)
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
      } catch {}
    }

    initAuth()

    // Safety timeout
    const timeout = setTimeout(() => { if (!cancelled) setLoading(false) }, 8000)

    // Listen for auth changes
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
