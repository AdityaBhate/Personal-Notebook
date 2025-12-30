// lib/crypto.ts

export interface EncryptedNote {
  ciphertext: string
  salt: string
  iv: string
}

// Derive a CryptoKey from a password and salt using PBKDF2
export async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  const saltBuffer = Uint8Array.from(atob(salt), (c) => c.charCodeAt(0))

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Generate a random salt (exported as base64)
export function generateSalt(): string {
  const salt = window.crypto.getRandomValues(new Uint8Array(16))
  return btoa(String.fromCharCode(...salt))
}

export async function encryptNote(content: string, password: string): Promise<EncryptedNote> {
  const salt = generateSalt()
  const key = await deriveKey(password, salt)
  
  const iv = window.crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for AES-GCM
  const encodedContent = new TextEncoder().encode(content)

  const encryptedContent = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encodedContent
  )

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encryptedContent))),
    salt: salt, // Store salt with the note to derive the same key later
    iv: btoa(String.fromCharCode(...iv)),
  }
}

export async function decryptNote(
  encryptedNote: EncryptedNote,
  password: string
): Promise<string | null> {
  try {
    const key = await deriveKey(password, encryptedNote.salt)
    
    const iv = Uint8Array.from(atob(encryptedNote.iv), (c) => c.charCodeAt(0))
    const ciphertext = Uint8Array.from(atob(encryptedNote.ciphertext), (c) => c.charCodeAt(0))

    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertext
    )

    return new TextDecoder().decode(decryptedContent)
  } catch (error) {
    console.error("Decryption failed:", error)
    return null // Wrong password or corrupted data
  }
}
