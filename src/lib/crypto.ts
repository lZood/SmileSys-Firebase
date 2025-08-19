import crypto from 'crypto'

// Simple AES-256-GCM helper for temporary secrets (password before verification)
// WARNING: This is for short-lived storage (minutes). Do NOT use to store long-term passwords.

const ALGO = 'aes-256-gcm'

function getKey() {
  let key = process.env.PENDING_SIGNUP_AES_KEY
  if (typeof key === 'string') key = key.trim().replace(/^"|"$/g, '') // trim and strip accidental quotes
  if (!key) {
    // Generate ephemeral key (dev fallback). Warn so production sets a stable key.
    if (!(globalThis as any).__EPHEMERAL_SIGNUP_AES_KEY) {
      (globalThis as any).__EPHEMERAL_SIGNUP_AES_KEY = crypto.randomBytes(32)
      console.warn('[signup-crypto] PENDING_SIGNUP_AES_KEY missing. Generated ephemeral key (dev only). Set a 64-char hex key in env for persistence.')
    }
    return (globalThis as any).__EPHEMERAL_SIGNUP_AES_KEY as Buffer
  }
  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(`PENDING_SIGNUP_AES_KEY invalid format. Expect 64 hex chars, got length=${key.length}`)
  }
  const buf = Buffer.from(key, 'hex')
  if (buf.length !== 32) throw new Error(`PENDING_SIGNUP_AES_KEY decode mismatch. Expect 32 bytes, got ${buf.length}`)
  return buf
}

export function encryptEphemeral(plain: string) {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decryptEphemeral(payload: string) {
  const raw = Buffer.from(payload, 'base64')
  const iv = raw.subarray(0, 12)
  const tag = raw.subarray(12, 28)
  const data = raw.subarray(28)
  const key = getKey()
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(data), decipher.final()])
  return dec.toString('utf8')
}
