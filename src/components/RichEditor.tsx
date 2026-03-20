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
  

  useEffect(() => {
    import('@toast-ui/editor').then((mod) => {
      const E = mod.Editor
      if (containerRef.current && !editorRef.current) {
        const instance = new E({
          el: containerRef.current,
          initialEditType: 'wysiwyg',
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
