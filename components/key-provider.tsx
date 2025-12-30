'use client'

import { createContext, useContext, useState, useCallback } from 'react'

type KeyContextType = {
  keys: Record<string, string> // noteId -> password
  setKey: (noteId: string, password: string) => void
  getKey: (noteId: string) => string | undefined
  clearKeys: () => void
  removeKey: (noteId: string) => void
}

const KeyContext = createContext<KeyContextType>({
  keys: {},
  setKey: () => {},
  getKey: () => undefined,
  clearKeys: () => {},
  removeKey: () => {},
})

export const useKeys = () => useContext(KeyContext)

export function KeyProvider({ children }: { children: React.ReactNode }) {
  const [keys, setKeys] = useState<Record<string, string>>({})

  const setKey = useCallback((noteId: string, password: string) => {
    setKeys(prev => ({ ...prev, [noteId]: password }))
  }, [])

  const getKey = useCallback((noteId: string) => keys[noteId], [keys])

  const clearKeys = useCallback(() => setKeys({}), [])

  /* New function to security clear a key */
  const removeKey = useCallback((noteId: string) => {
    setKeys(prev => {
        const newKeys = { ...prev }
        delete newKeys[noteId]
        return newKeys
    })
  }, [])

  return (
    <KeyContext.Provider value={{ keys, setKey, getKey, clearKeys, removeKey }}>
      {children}
    </KeyContext.Provider>
  )
}


