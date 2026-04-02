import { useEffect, useRef, useState } from 'react'
import { uploadImage } from '../lib/storage'
import '@toast-ui/editor/dist/toastui-editor.css'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function RichEditor({ value, onChange, placeholder }: Props) {
  const editorRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Apply theme class to editor container
  useEffect(() => {
    const applyTheme = () => {
      if (!containerRef.current) return
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
      containerRef.current.classList.toggle('toastui-editor-dark', isDark)
    }

    applyTheme()

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'data-theme') applyTheme()
      }
    })
    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false

    import('@toast-ui/editor').then((mod) => {
      if (cancelled || !containerRef.current || editorRef.current) return

      const E = mod.Editor
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
      if (isDark) containerRef.current.classList.add('toastui-editor-dark')

      const instance = new E({
        el: containerRef.current,
        initialEditType: 'markdown',
        previewStyle: 'vertical',
        height: '500px',
        placeholder: placeholder || '',
        initialValue: value || '',
        hooks: {
          addImageBlobHook: async (blob: Blob, callback: (url: string, alt?: string) => void) => {
            const file = new File([blob], 'image.png', { type: blob.type })
            const url = await uploadImage(file)
            if (url) callback(url, 'image')
            else callback('', '')
          },
        },
      })

      instance.on('change', () => {
        onChange(instance.getMarkdown())
      })
      editorRef.current = instance
      setIsMounted(true)
    })

    return () => {
      cancelled = true
      // Guard destroy to prevent removeChild errors in React 18 StrictMode
      if (editorRef.current) {
        try {
          editorRef.current.destroy()
        } catch (e) {
          // Editor may already be destroyed by ToastUI internals
        }
        editorRef.current = null
      }
      setIsMounted(false)
    }
  }, [])

  // Update content when value changes externally (skip if we initiated the change)
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getMarkdown()) {
      editorRef.current.setMarkdown(value || '')
    }
  }, [value])

  return (
    <div>
      <div ref={containerRef} style={{ borderRadius: '8px', overflow: 'hidden' }} />
      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
        💡 支持 Markdown 语法，也可用工具栏插入图片（图片会自动上传）
      </p>
    </div>
  )
}
