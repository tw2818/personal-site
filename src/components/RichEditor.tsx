import { useEffect, useRef } from 'react'
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

  // Apply theme class to editor container
  useEffect(() => {
    const applyTheme = () => {
      if (!containerRef.current) return
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
      containerRef.current.classList.toggle('toastui-editor-dark', isDark)
    }

    applyTheme()

    // Watch for theme changes via MutationObserver
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'data-theme') applyTheme()
      }
    })
    observer.observe(document.documentElement, { attributes: true })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    import('@toast-ui/editor').then((mod) => {
      const E = mod.Editor
      if (containerRef.current && !editorRef.current) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
        if (isDark) containerRef.current.classList.add('toastui-editor-dark')

        const instance = new E({
          el: containerRef.current,
          initialEditType: 'markdown',
          previewStyle: 'vertical',
          height: '500px',
          placeholder: placeholder || '',
          initialValue: value,
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
      }
    })
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy()
        editorRef.current = null
      }
    }
  }, [])

  // Update content when value changes externally
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getMarkdown()) {
      editorRef.current.setMarkdown(value)
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
