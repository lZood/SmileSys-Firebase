"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SelectPlanPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const sp = new URLSearchParams(window.location.search)
    setEmail(sp.get('email') ?? '')
  }, [])

  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0)

  async function resendActivation() {
    if (!email) return
    setIsLoading(true)
    setStatus('idle')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/auth/resend-activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus('sent')
        // set a cooldown to avoid hitting Supabase email rate limits (5 minutes)
        setCooldownSeconds(300)
      } else if (res.status === 429) {
        const data = await res.json().catch(() => ({}))
        setStatus('error')
        setErrorMsg(data?.error || data?.msg || 'Límite de envío alcanzado. Intenta más tarde.')
      } else {
        const data = await res.json().catch(() => ({}))
        setStatus('error')
        setErrorMsg(data?.error || 'No se pudo reenviar el correo')
      }
    } catch (err) {
      setStatus('error')
      setErrorMsg('Error de red')
    } finally {
      setIsLoading(false)
    }
  }

  // Countdown effect for cooldownSeconds
  useEffect(() => {
    if (!cooldownSeconds) return
    const t = setInterval(() => {
      setCooldownSeconds((s) => {
        if (s <= 1) {
          clearInterval(t)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [cooldownSeconds])

  return (
    <div className="max-w-xl mx-auto mt-24 px-6">
      <h1 className="text-2xl font-semibold mb-4">Revisa tu correo</h1>
      <p className="mb-6">Te hemos enviado un correo para activar tu cuenta y crear tu contraseña.</p>

      {email ? (
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">Correo:</p>
          <p className="font-medium">{email}</p>
        </div>
      ) : (
        <p className="mb-6 text-sm text-red-600">No se detectó correo en la URL. Puedes volver a la página de registro.</p>
      )}

      <div className="flex gap-3">
        <button
          className="px-4 py-2 bg-sky-600 text-white rounded disabled:opacity-50"
          onClick={() => router.push('/signup')}
        >
          Volver al registro
        </button>

        <button
          className="px-4 py-2 bg-emerald-600 text-white rounded disabled:opacity-50"
          onClick={resendActivation}
          disabled={!email || isLoading || cooldownSeconds > 0}
        >
          {isLoading ? 'Enviando...' : cooldownSeconds > 0 ? `Reenviar (${Math.floor(cooldownSeconds / 60)}:${String(cooldownSeconds % 60).padStart(2, '0')})` : 'Reenviar correo de activación'}
        </button>
      </div>

      {status === 'sent' && <p className="mt-4 text-green-600">Correo reenviado. Revisa tu bandeja y la carpeta de spam.</p>}
      {status === 'error' && <p className="mt-4 text-red-600">{errorMsg || 'Error al reenviar'}</p>}

      <div className="mt-8 text-sm text-gray-600">
        <p>Si no recibes el correo, asegúrate de que tu proveedor permita recibir correos desde nuestra dirección y revisa la carpeta de spam.</p>
      </div>
    </div>
  )
}
