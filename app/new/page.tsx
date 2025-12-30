'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers'
import { useKeys } from '@/components/key-provider'
import { encryptNote } from '@/lib/crypto'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { ArrowLeft, Loader2, Lock } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewNotePage() {
  const { user } = useAuth()
  const { setKey } = useKeys()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      toast.error('Password is required')
      return
    }
    if (!user) {
        toast.error('You must be logged in')
        return
    }

    setLoading(true)

    try {
      // 1. Encrypt empty content
      const { ciphertext, salt, iv } = await encryptNote('', password)

      // 2. Insert into DB
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title: title || formatTitleDate(),
          content_encrypted: ciphertext,
          salt: salt,
          iv: iv,
          user_id: user.id
        })
        .select()
        .single()

      if (error) throw error

      // 3. Set key in session
      setKey(data.id, password)
      
      toast.success('Note securely created')
      router.push(`/note/${data.id}`)
      
    } catch (err: any) {
      toast.error('Failed to create note', { description: err.message })
      setLoading(false)
    }
  }

  const formatTitleDate = () => {
    return new Date().toLocaleString('en-US', { 
       month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' 
    })
  }

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-md border-primary/20 bg-card">
        <CardHeader>
           <div className="flex items-center gap-2 mb-2">
               <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                   <ArrowLeft className="w-5 h-5"/>
               </Link>
           </div>
          <CardTitle className="text-2xl text-primary">New Secure Note</CardTitle>
          <CardDescription>
            Set a password to encrypt this note. <br/>
            <span className="text-yellow-500/80 font-bold">Don't lose it. We can't recover it.</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title (Optional)</label>
              <Input
                placeholder="My Secret Plans..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background/50"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-3 h-3 text-primary" /> 
                Encryption Password
              </label>
              <Input
                type="password"
                placeholder="CorrectHorseBatteryStaple"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50 border-primary/30 focus-visible:ring-primary"
              />
            </div>

            <Button type="submit" className="w-full font-bold text-md mt-4" disabled={loading}>
              {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              Create Encrypted Note
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
