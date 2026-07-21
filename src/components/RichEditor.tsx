'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { useEffect, useCallback } from 'react'

interface RichEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

function promptUrl(label: string): string | null {
  // eslint-disable-next-line no-alert
  const result = window.prompt(label)
  return result?.trim() || null
}

export default function RichEditor({
  value,
  onChange,
  placeholder,
  className,
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank' } }),
      Placeholder.configure({ placeholder: placeholder ?? 'Начните писать...' }),
      Underline,
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
    ],
    content: value,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'rich-editor-content',
      },
    },
  })

  // Sync external value changes (e.g. form reset) without causing re-render loops
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
    // Only run when `value` changes externally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const execLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href as string | undefined
    const url = promptUrl(
      prev ? 'Редактировать ссылку (URL):' : 'Вставить ссылку (URL):',
    )
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run()
    }
  }, [editor])

  const execImage = useCallback(() => {
    if (!editor) return
    const url = promptUrl('Вставить изображение (URL):')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  if (!editor) {
    return (
      <div className="card-ss p-3">
        <div className="h-[250px] flex items-center justify-center text-[color:var(--ink-4)] text-sm">
          Загрузка редактора...
        </div>
      </div>
    )
  }

  const toolbarGroups: Array<Array<{
    label: string
    action: () => void
    isActive: boolean
  }>> = [
    [
      {
        label: '**Ж**',
        action: () => editor.chain().focus().toggleBold().run(),
        isActive: editor.isActive('bold'),
      },
      {
        label: '*К*',
        action: () => editor.chain().focus().toggleItalic().run(),
        isActive: editor.isActive('italic'),
      },
      {
        label: '_Ч_',
        action: () => editor.chain().focus().toggleUnderline().run(),
        isActive: editor.isActive('underline'),
      },
    ],
    [
      {
        label: 'H2',
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: editor.isActive('heading', { level: 2 }),
      },
      {
        label: 'H3',
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        isActive: editor.isActive('heading', { level: 3 }),
      },
    ],
    [
      {
        label: '\u2022 Список',
        action: () => editor.chain().focus().toggleBulletList().run(),
        isActive: editor.isActive('bulletList'),
      },
      {
        label: '1. Список',
        action: () => editor.chain().focus().toggleOrderedList().run(),
        isActive: editor.isActive('orderedList'),
      },
    ],
    [
      {
        label: '\uD83D\uDD17',
        action: execLink,
        isActive: editor.isActive('link'),
      },
      {
        label: '\uD83D\uDDBC\uFE0F',
        action: execImage,
        isActive: false,
      },
    ],
    [
      {
        label: '\u201C \u201D',
        action: () => editor.chain().focus().toggleBlockquote().run(),
        isActive: editor.isActive('blockquote'),
      },
      {
        label: '\u2015',
        action: () => editor.chain().focus().setHorizontalRule().run(),
        isActive: false,
      },
    ],
  ]

  return (
    <div className={`card-ss flex flex-col ${className ?? ''}`}>
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-[color:var(--hairline)]"
        role="toolbar"
        aria-label="Текстовый редактор"
      >
        {toolbarGroups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {gi > 0 && (
              <span
                className="inline-block h-5 w-px bg-[color:var(--hairline)] mx-1"
                aria-hidden
              />
            )}
            {group.map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={btn.action}
                title={btn.label}
                className={`btn btn-quiet btn-sm ${
                  btn.isActive ? 'bg-white/[0.06]' : ''
                }`}
                aria-pressed={btn.isActive}
              >
                {btn.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />

      {/* Scoped styles for editor content */}
      <style>{`
        .rich-editor-content {
          min-height: 250px;
          max-height: 500px;
          overflow-y: auto;
          padding: 16px 20px;
          background: var(--surface);
          color: var(--ink);
          font-size: 14px;
          line-height: 1.65;
          outline: none;
        }
        .rich-editor-content:focus {
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
        }

        /* Headings */
        .rich-editor-content h2 {
          font-size: 1.35em;
          font-weight: 600;
          letter-spacing: -0.02em;
          margin: 1.2em 0 0.5em;
          color: var(--ink);
        }
        .rich-editor-content h3 {
          font-size: 1.15em;
          font-weight: 600;
          letter-spacing: -0.02em;
          margin: 1em 0 0.4em;
          color: var(--ink);
        }
        .rich-editor-content h2:first-child,
        .rich-editor-content h3:first-child {
          margin-top: 0;
        }

        /* Paragraphs */
        .rich-editor-content p {
          margin: 0.4em 0;
        }

        /* Lists */
        .rich-editor-content ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .rich-editor-content ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .rich-editor-content li {
          margin: 0.2em 0;
        }
        .rich-editor-content li p {
          margin: 0;
        }

        /* Links */
        .rich-editor-content a {
          color: var(--accent);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .rich-editor-content a:hover {
          color: var(--accent-strong);
        }

        /* Images */
        .rich-editor-content img {
          max-width: 100%;
          height: auto;
          border-radius: var(--r-sm);
          margin: 0.8em 0;
        }

        /* Blockquote */
        .rich-editor-content blockquote {
          border-left: 3px solid var(--hairline-strong);
          padding-left: 1em;
          margin: 0.8em 0;
          color: var(--ink-2);
          font-style: italic;
        }

        /* Code */
        .rich-editor-content code {
          font-family: ui-monospace, 'SF Mono', 'Cascadia Mono', 'Consolas', monospace;
          font-size: 0.88em;
              background: rgba(255, 255, 255, 0.06);
          padding: 0.15em 0.4em;
          border-radius: 4px;
          color: var(--ink);
        }
        .rich-editor-content pre {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--hairline);
          border-radius: var(--r-sm);
          padding: 1em;
          margin: 0.8em 0;
          overflow-x: auto;
        }
        .rich-editor-content pre code {
          background: none;
          padding: 0;
          border-radius: 0;
        }

        /* Horizontal rule */
        .rich-editor-content hr {
          border: none;
          border-top: 1px solid var(--hairline);
          margin: 1em 0;
        }

        /* Placeholder */
        .rich-editor-content p.is-editor-empty:first-child::before {
          color: var(--ink-4);
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
