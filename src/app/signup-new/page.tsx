"use client";
import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export default function NewSignupPage() {
  const { toast } = useToast()
  const [step, setStep] = useState<1|2>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [clinicName, setClinicName] = useState('')
  const [code, setCode] = useState(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  React.useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  const startSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, clinicName }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast({ title: 'Code sent', description: 'Check your email for the 6-digit code.' })
      setStep(2)
      setResendCooldown(60)
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message })
    } finally { setLoading(false) }
  }

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const codeStr = code.join('')
    if (codeStr.length !== 6) { toast({ variant: 'destructive', title: 'Código incompleto' }); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code: codeStr }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast({ title: 'Cuenta creada', description: 'Ahora puedes iniciar sesión.' })
      window.location.href = '/?signup=success'
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message })
    } finally { setLoading(false) }
  }

  const resend = async () => {
    if (resendCooldown > 0) return
    try {
      const res = await fetch('/api/auth/resend-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast({ title: 'Código reenviado' })
      setResendCooldown(60)
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message }) }
  }

  return (
    <div className='flex items-center justify-center min-h-screen bg-background p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>{step === 1 ? 'Crear cuenta' : 'Verificar correo'}</CardTitle>
          <CardDescription>
            {step === 1 ? 'Ingresa tus datos para crear tu cuenta.' : 'Introduce el código de 6 dígitos enviado a tu correo.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form onSubmit={startSignup} className='space-y-4'>
              <div>
                <Label>Email</Label>
                <Input type='email' value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label>Contraseña</Label>
                <Input type='password' value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div>
                <Label>Nombre de la Clínica</Label>
                <Input value={clinicName} onChange={e => setClinicName(e.target.value)} required />
              </div>
              <Button type='submit' className='w-full' disabled={loading}>{loading ? 'Enviando...' : 'Continuar'}</Button>
            </form>
          )}
          {step === 2 && (
            <form onSubmit={verifyCode} className='space-y-6'>
              <div className='flex gap-2 justify-between'>
                {code.map((c,i) => (
                  <Input key={i} maxLength={1} className='text-center' value={c} onChange={e => {
                    const v = e.target.value.replace(/[^0-9]/g,'')
                    setCode(prev => prev.map((p,idx)=> idx===i? v : p))
                    if (v && i < 5) (document.getElementById('code-'+(i+1)) as HTMLInputElement)?.focus()
                  }} id={'code-'+i} />
                ))}
              </div>
              <Button type='submit' className='w-full' disabled={loading}>{loading ? 'Verificando...' : 'Verificar'}</Button>
              <div className='text-sm text-center'>
                {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : <button type='button' className='underline' onClick={resend}>Reenviar código</button>}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
