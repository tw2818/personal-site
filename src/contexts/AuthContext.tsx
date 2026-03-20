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
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
      // Clean URL immediately
      window.history.replaceState({}, '', window.location.pathname)
      ;(supabase.auth as any).exchangeCodeForSession(code).then(({ data, error }: any) => {
        if (!error && data?.session) {
          setSession(data.session)
          setUser(data.session.user)
        }
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })
    }
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
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
