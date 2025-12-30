'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers'
import { useKeys } from '@/components/key-provider'
import { encryptNote, decryptNote, type EncryptedNote } from '@/lib/crypto'
import { NoteEditor } from '@/components/note-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Lock, Unlock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, loading: authLoading } = useAuth()
  const { setKey, getKey, removeKey } = useKeys()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [noteData, setNoteData] = useState<any>(null)
  
  // Decrypted State
  const [content, setContent] = useState<string | null>(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [decrypting, setDecrypting] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch Note Data
  useEffect(() => {
    // Security: Auto-lock note when leaving this page
    return () => {
        removeKey(id)
    }
  }, [id, removeKey])

  useEffect(() => {
    if (!authLoading && !user) {
        // Redirection handled by AuthProvider or layout usually, but safe guard here
        return 
    }
    if (user && id) {
        fetchNote()
    }
  }, [user, authLoading, id])

  const fetchNote = async () => {
    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single()
    
    if (error) {
        toast.error('Note not found')
        router.push('/')
        return
    }

    setNoteData(data)
    setLoading(false)

    // Attempt auto-decrypt if key exists
    const storedKey = getKey(id)
    if (storedKey) {
        attemptDecrypt(storedKey, data)
    }
  }

  const attemptDecrypt = async (password: string, note: any) => {
    setDecrypting(true)
    const encrypted: EncryptedNote = {
        ciphertext: note.content_encrypted,
        salt: note.salt,
        iv: note.iv
    }
    
    const decrypted = await decryptNote(encrypted, password)
    
    if (decrypted !== null) {
        setContent(decrypted)
        setKey(note.id, password) // Ensure key is refreshed in session
        toast.success('Note unlocked')
    } else {
        toast.error('Incorrect password')
    }
    setDecrypting(false)
  }

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteData) return
    attemptDecrypt(passwordInput, noteData)
  }

  const handleSave = async (newContent: string) => {
    const password = getKey(id)
    if (!password || !noteData) return

    setSaving(true)
    try {
        const { ciphertext, salt, iv } = await encryptNote(newContent, password)
        
        const { error } = await supabase
            .from('notes')
            .update({
                content_encrypted: ciphertext,
                salt,
                iv,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
        
        if (error) throw error
        toast.success('Changes saved')
    } catch (err: any) {
        toast.error('Save failed', { description: err.message })
    }
    setSaving(false)
  }

  if (loading || authLoading) {
    return <div className="h-screen flex items-center justify-center text-primary"><Loader2 className="animate-spin w-8 h-8"/></div>
  }

  if (content === null) {
      // Locked View
      return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-background">
              <Card className="w-full max-w-sm border-destructive/20 shadow-2xl shadow-yellow-500/5">
                <CardHeader>
                    <Link href="/" className="mb-4 inline-block text-muted-foreground hover:text-primary">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-primary" />
                        Locked Note
                    </CardTitle>
                    <CardDescription>
                        Enter password to View: <span className="font-bold text-foreground block mt-1">{noteData?.title}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUnlock} className="space-y-4">
                        <Input
                            type="password"
                            placeholder="Password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            autoFocus
                            className="text-center tracking-widest"
                        />
                        <Button type="submit" className="w-full" disabled={decrypting}>
                            {decrypting ? <Loader2 className="animate-spin w-4 h-4"/> : <Unlock className="w-4 h-4 mr-2"/>}
                            Unlock
                        </Button>
                    </form>
                </CardContent>
              </Card>
          </div>
      )
  }

  // Unlocked View
  return (
      <div className="h-screen flex flex-col">
         {/* Custom header for navigation back */}
         <div className="flex items-center px-4 py-2 border-b border-border/50 bg-background/50">
             <Link href="/" className="mr-3 text-muted-foreground hover:text-primary transition-colors">
                 <ArrowLeft className="w-5 h-5" />
             </Link>
             <h1 className="font-semibold text-lg truncate flex-1">{noteData?.title}</h1>
             <div className="text-xs text-muted-foreground flex items-center gap-1">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 Decrypted
             </div>
         </div>
         
         <div className="flex-1 overflow-hidden">
            <NoteEditor 
                initialContent={content} 
                onSave={handleSave} 
                isSaving={saving} 
            />
         </div>
      </div>
  )
}
