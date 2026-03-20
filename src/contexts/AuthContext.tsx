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
    let cancelled = false

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
            // Ensure profile exists for new user
            const { data: existing } = await supabase
              .from('profiles').select('id').eq('id', data.session.user.id).single()
            if (!existing) {
              await supabase.from('profiles').insert({
                id: data.session.user.id,
                email: data.session.user.email,
                nickname: '',
                avatar_url: data.session.user.user_metadata?.avatar_url || '',
                github: data.session.user.user_metadata?.user_name || '',
              })
            }
          }
          if (!cancelled) setLoading(false)
          return
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (!cancelled && session?.user) {
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
        if (!cancelled) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      } catch (err) {
        console.error('Auth init error:', err)
        if (!cancelled) {
          setSession(null)
          setUser(null)
          setLoading(false)
        }
      }
    }

    initAuth()

    // Safety timeout: force loading off after 8s
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 8000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return
      setSession(session)
      setUser(session?.user ?? null)
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

    return () => {
      cancelled = true
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
