'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect } from 'react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from './ui/button'
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NoteEditorProps {
  initialContent: string
  onSave: (content: string) => Promise<void>
  isSaving: boolean
  onExit?: () => void
}

export function NoteEditor({ initialContent, onSave, isSaving, onExit }: NoteEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    autofocus: 'end',
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your secret thoughts...',
        emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-slate-500 before:float-left before:pointer-events-none before:h-0',
      }),
    ],
    content: initialContent, // Note: Tiptap handles HTML string
    editorProps: {
        attributes: {
            class: 'prose prose-invert prose-yellow max-w-none focus:outline-none min-h-[60vh] p-4 text-base md:text-lg leading-relaxed'
        }
    }
  })

  // Handle Keyboard Shortcuts
  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (view: any, event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onExit?.()
            return true
        }
        return false
    }

    editor.setOptions({
        editorProps: {
            handleKeyDown
        }
    })
  }, [editor, onSave, onExit])

  if (!editor) return null

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 flex items-center justify-between p-2 bg-background/90 backdrop-blur border-b border-border">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(editor.isActive('bold') && 'bg-accent text-accent-foreground')}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(editor.isActive('italic') && 'bg-accent text-accent-foreground')}
          >
            <Italic className="w-4 h-4" />
          </Button>
           <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(editor.isActive('heading', { level: 1 }) && 'bg-accent text-accent-foreground')}
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(editor.isActive('heading', { level: 2 }) && 'bg-accent text-accent-foreground')}
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
           <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(editor.isActive('bulletList') && 'bg-accent text-accent-foreground')}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(editor.isActive('orderedList') && 'bg-accent text-accent-foreground')}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
        </div>

        <Button 
            onClick={() => onSave(editor.getHTML())} 
            disabled={isSaving}
            size="sm"
            className="font-bold ml-2 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
        >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
                <Save className="w-4 h-4 mr-2" />
                Save
            </>}
        </Button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
