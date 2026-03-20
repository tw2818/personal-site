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
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        window.history.replaceState({}, '', window.location.pathname)
        const { data, error } = await (supabase.auth as any).exchangeCodeForSession(code)
        if (!error && data?.session) {
          setSession(data.session)
          setUser(data.session.user)
          // Auto-create profile for new user
          const { data: existing } = await supabase.from('profiles').select('id').eq('id', data.session.user.id).single()
          if (!existing) {
            await supabase.from('profiles').insert({
              id: data.session.user.id,
              email: data.session.user.email,
              nickname: '',
              avatar_url: data.session.user.user_metadata?.avatar_url || '',
              github: data.session.user.user_metadata?.user_name || '',
            })
          }
          setLoading(false)
          return
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Auto-create profile if missing
        const { data: existing } = await supabase.from('profiles').select('id').eq('id', session.user.id).single()
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
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: existing } = await supabase.from('profiles').select('id').eq('id', session.user.id).single()
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
