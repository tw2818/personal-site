import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to get session from URL params (OAuth callback)
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')

        if (code) {
          // Clean URL first
          window.history.replaceState({}, '', window.location.pathname)
          const { data, error } = await (supabase.auth as any).exchangeCodeForSession(code)
          if (error) throw error
          if (data?.session) {
            setSession(data.session)
            setUser(data.session.user)
            setLoading(false)
            return
          }
        }

        // Normal session check
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      } catch (err) {
        console.error('Auth init error:', err)
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      // New user logged in: auto-create profile if not exists
      if (session?.user) {
        const { data: existing } = await supabase
          .from('profiles').select('id').eq('id', session.user.id).single()
        if (!existing) {
          await supabase.from('profiles').insert({
            id: session.user.id,
            email: session.user.email,
            nickname: '',
            avatar_url: session.user.user_metadata?.avatar_url || '',
            github: session.user.user_metadata?.user_name || '',
          })
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
