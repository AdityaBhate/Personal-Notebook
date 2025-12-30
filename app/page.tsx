'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, LogOut, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

interface NoteMetadata {
  id: string
  title: string
  created_at: string
}

export default function Dashboard() {
  const { user, signOut, loading } = useAuth()
  const [notes, setNotes] = useState<NoteMetadata[]>([])
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return;
    }

    if (user) {
      fetchNotes()
    }
  }, [user, loading, router])

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
    
    if (data) setNotes(data)
  }

  if (loading) return <div className="p-8 text-center text-primary animate-pulse">Loading Identity...</div>

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary tracking-tight">Notes</h1>
        <Button variant="ghost" size="icon" onClick={signOut}>
          <LogOut className="w-5 h-5" />
        </Button>
      </header>
      
      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-20 opacity-50 space-y-4">
             <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Lock className="w-8 h-8"/>
             </div>
             <p>No secured notes yet.</p>
          </div>
        ) : (
          <div className="grid gap-3">
             {notes.map((note) => (
                <Link key={note.id} href={`/note/${note.id}`}>
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer active:scale-[0.99] transition-transform">
                        <CardHeader className="p-4 pb-2">
                           <CardTitle className="text-lg leading-tight truncate">{note.title || 'Untitled'}</CardTitle>
                        </CardHeader>
                        <CardFooter className="p-4 pt-0">
                            <span className="text-xs text-muted-foreground">
                                {format(new Date(note.created_at), 'MMM d, yyyy • h:mm a')}
                            </span>
                        </CardFooter>
                    </Card>
                </Link>
             ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6">
        <Link href="/new">
            <Button size="icon" className="h-14 w-14 rounded-full shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-6 h-6" />
            </Button>
        </Link>
      </div>
    </div>
  )
}
