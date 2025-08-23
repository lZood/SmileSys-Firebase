"use client";
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Progress } from '@/components/ui/progress'
import { z } from 'zod'

// Zod schemas for onboarding validation
const basicSchema = z.object({
  legalName: z.string().min(1, 'El nombre de la clínica es requerido').trim(),
  phone: z.string().min(1, 'Teléfono es requerido').regex(/^\+?[0-9\s\-()]+$/, 'Teléfono inválido'),
  address: z.string().min(1, 'Dirección es requerida').trim(),
  city: z.string().optional().transform(v => (v || '').trim()),
  country: z.string().optional().transform(v => (v || '').trim()),
  terms: z.string().optional(),
})

const adminSchema = z.object({
  firstName: z.string().min(1, 'Nombre es requerido').trim(),
  lastName: z.string().min(1, 'Apellido es requerido').trim(),
  jobTitle: z.string().optional().transform(v => (v || '').trim()),
  roles: z.object({ doctor: z.boolean(), staff: z.boolean() })
})

interface ClinicInfoForm {
  legalName: string
  phone: string
  address: string
  city: string
  country: string
  // can be a File (new upload), a public URL (string) or null
  logoFile: File | string | null
  terms: string
}
interface ScheduleInterval { start: string; end: string }
interface MemberForm { firstName: string; lastName: string; jobTitle: string; roles: { doctor: boolean; staff: boolean } }

export default function OnboardingPage() {
  const supabase = createClient()
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<1|2|3>(1)
  const [basic, setBasic] = useState<ClinicInfoForm>({ legalName: '', phone: '', address: '', city: '', country: '', logoFile: null, terms: '' })
  const defaultSchedule: Record<string, ScheduleInterval[]> = { monday:[{start:'09:00',end:'17:00'}], tuesday:[{start:'09:00',end:'17:00'}], wednesday:[{start:'09:00',end:'17:00'}], thursday:[{start:'09:00',end:'17:00'}], friday:[{start:'09:00',end:'17:00'}], saturday:[], sunday:[] }
  const [schedule, setSchedule] = useState<Record<string, ScheduleInterval[]>>(defaultSchedule)
  const [adminMember, setAdminMember] = useState<MemberForm>({ firstName:'', lastName:'', jobTitle:'', roles: { doctor:false, staff:false } })
  const [addingExtra, setAddingExtra] = useState(false)
  const [extraMembers, setExtraMembers] = useState<MemberForm[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  useEffect(()=>{
    if (typeof window === 'undefined') return
    const sp = new URLSearchParams(window.location.search)
    setToken(sp.get('token'))
  }, [])

  const daysOrder = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const
  const dayNames: Record<string,string> = { monday:'Lunes', tuesday:'Martes', wednesday:'Miércoles', thursday:'Jueves', friday:'Viernes', saturday:'Sábado', sunday:'Domingo' }

  useEffect(() => {
    const run = async () => {
      // 0. If token provided, try to preload pending signup data
      try {
        if (token) {
          const { data: pending, error: pErr } = await supabase.from('pending_signups').select('*, onboarding_data').eq('token', token).maybeSingle()
          if (!pErr && pending) {
            // Map possible fields into basic and schedule
            const onboarding = (pending.onboarding_data) ? pending.onboarding_data : {}
            if (onboarding.basic) setBasic((prev:any)=> ({ ...prev, ...onboarding.basic }))
            if (onboarding.schedule) setSchedule(onboarding.schedule)
            // also try common columns
            if ((pending as any).clinic_name && !(onboarding && onboarding.basic && onboarding.basic.legalName)) {
              setBasic(b => ({ ...b, legalName: (pending as any).clinic_name }))
            }
          }
        }
      } catch (e) {
        console.warn('No se pudo precargar pending_signups:', e)
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }
      const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).maybeSingle()
      if (!profile?.clinic_id) { router.replace('/'); return }
      const { data: clinic } = await supabase.from('clinics').select('id, first_setup_required, onboarding_data').eq('id', profile.clinic_id).single()
      if (!clinic) { router.replace('/'); return }
      if (!clinic.first_setup_required) { router.replace('/dashboard'); return }
      if (clinic.onboarding_data) {
        // merge existing partial data if any
        if (clinic.onboarding_data.schedule) setSchedule(clinic.onboarding_data.schedule)
        if (clinic.onboarding_data.basic) setBasic((prev:any)=>({...prev,...clinic.onboarding_data.basic}))
      }
      setLoading(false)
    }
    run()
  }, [supabase, router])

  useEffect(()=>{
    // create preview only for File objects; if logoFile is a string assume it's a public URL
    let objectUrl: string | null = null
    if (!basic.logoFile) { setLogoPreview(null); return }
    if (typeof basic.logoFile === 'string') {
      setLogoPreview(basic.logoFile)
      return
    }
    // basic.logoFile is a File/Blob
    objectUrl = URL.createObjectURL(basic.logoFile)
    setLogoPreview(objectUrl)
    return () => { if (objectUrl) { URL.revokeObjectURL(objectUrl) } }
  },[basic.logoFile])

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setBasic(b => ({ ...b, [id]: value }))
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setBasic(b => ({ ...b, logoFile: file }))
  }

  const handleMemberChange = (field: keyof MemberForm, value: any) => {
    setAdminMember(m => ({ ...m, [field]: value }))
  }

  const copyPreviousDay = (day:string) => {
    const idx = daysOrder.indexOf(day as any)
    if (idx <= 0) return
    const prev = daysOrder[idx-1]
    setSchedule(s => ({ ...s, [day]: s[prev] ? s[prev].map(i=> ({...i})) : [] }))
  }

  const addInterval = (day: string) => {
    setSchedule(s => ({ ...s, [day]: [...s[day], { start: '09:00', end: '17:00' }] }))
  }
  const removeInterval = (day: string, idx: number) => {
    setSchedule(s => ({ ...s, [day]: s[day].filter((_,i)=> i!==idx) }))
  }

  const uploadLogoIfAny = async (clinicId: string) => {
    if (!basic.logoFile) return null
    // if it's already a public URL, no need to upload
    if (typeof basic.logoFile === 'string') return basic.logoFile
    const { error: upErr } = await supabase.storage.from('clinic-logos').upload(`logos/${clinicId}`, basic.logoFile, { upsert: true })
    if (upErr) throw upErr
    const { data } = supabase.storage.from('clinic-logos').getPublicUrl(`logos/${clinicId}`)
    return data.publicUrl
  }

  const saveBasic = async () => {
    const parsed = basicSchema.safeParse(basic)
    if (!parsed.success) {
      throw new Error(parsed.error.errors.map(e=> e.message).join('; '))
    }
    const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error('Sesión inválida')
    const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single(); if (!profile?.clinic_id) throw new Error('Perfil sin clínica')
    const logoUrl = await uploadLogoIfAny(profile.clinic_id).catch(e=> { console.warn('logo upload', e); return null })
    const { error } = await supabase.from('clinics').update({
      name: basic.legalName,
      phone: basic.phone,
      address: basic.address,
      logo_url: logoUrl || undefined,
      terms_and_conditions: basic.terms,
      onboarding_data: { basic: { ...basic, logoFile: undefined } }
    }).eq('id', profile.clinic_id)
    if (error) throw error
    setStep(2)
  }

  const saveSchedule = async () => {
    // No validation for schedule UI as requested, but ensure storage format is consistent:
    // - times stored as 'HH:mm' 24-hour
    // - intervals with end > start
    // - intervals sorted by start
    // - days always present as arrays
    const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error('Sesión inválida')
    const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single(); if (!profile?.clinic_id) throw new Error('Perfil sin clínica')

    const normalizeTime = (t: string) => {
      if (!t) return t
      const hhmm = t.trim()
      // if already HH:mm
      const m = hhmm.match(/^(\d{1,2}):(\d{2})$/)
      if (m) {
        const hh = String(Number(m[1])).padStart(2,'0')
        return `${hh}:${m[2]}`
      }
      // handle formats like '08:00 a.m.' or '03:00 p.m.'
      const cleaned = hhmm.replace(/\./g,'').toLowerCase()
      const am = cleaned.includes('a')
      const pm = cleaned.includes('p')
      const digits = cleaned.replace(/[^0-9:]/g,'').trim()
      const parts = digits.split(':')
      let hr = Number(parts[0] || 0)
      const mn = parts[1] || '00'
      if (pm && hr < 12) hr += 12
      if (am && hr === 12) hr = 0
      return `${String(hr).padStart(2,'0')}:${String(mn).padStart(2,'0')}`
    }

    const normalized: Record<string, ScheduleInterval[]> = {}
    const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
    for (const day of days) {
      const arr = Array.isArray((schedule as any)[day]) ? (schedule as any)[day] : []
      const converted = arr.map((iv: any) => ({ start: normalizeTime(String(iv.start || '')), end: normalizeTime(String(iv.end || '')) }))
        .filter((iv: any) => {
          if (!iv.start || !iv.end) return false
          const [sh, sm] = iv.start.split(':').map(Number)
          const [eh, em] = iv.end.split(':').map(Number)
          const smins = sh * 60 + sm
          const emins = eh * 60 + em
          return emins > smins
        })
        .sort((a: any, b: any) => {
          return a.start.localeCompare(b.start)
        })
      normalized[day] = converted
    }

    const { error } = await supabase.from('clinics').update({ schedule: normalized, onboarding_data: { basic, schedule: normalized } }).eq('id', profile.clinic_id)
    if (error) throw error
    setSchedule(normalized)
    setStep(3)
  }

  const finalizeOnboarding = async () => {
    const parsed = adminSchema.safeParse(adminMember)
    if (!parsed.success) {
      throw new Error(parsed.error.errors.map(e=> e.message).join('; '))
    }
    const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error('Sesión inválida')
    const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single(); if (!profile?.clinic_id) throw new Error('Perfil sin clínica')
    const rolesArr = ['admin'].concat(adminMember.roles.doctor?['doctor']:[]).concat(adminMember.roles.staff?['staff']:[])
    // update profile
    const { error: pErr } = await supabase.from('profiles').update({ first_name: adminMember.firstName.trim(), last_name: adminMember.lastName.trim(), job_title: adminMember.jobTitle || null, roles: rolesArr }).eq('id', user.id)
    if (pErr) throw pErr
    // ensure member row
    const { error: mErr } = await supabase.from('members').upsert({ clinic_id: profile.clinic_id, user_id: user.id, role: 'admin', job_title: adminMember.jobTitle || null, is_active: true, roles: rolesArr }).select()
    if (mErr) console.warn('member upsert', mErr)
    // optional extra members loop (simplified, only names captured)
    for (const em of extraMembers) {
      if (!em.firstName || !em.lastName) continue
      // In real flow would create auth user invite; placeholder stores in onboarding_data
    }
    const { error: cErr } = await supabase.from('clinics').update({ first_setup_required: false }).eq('id', profile.clinic_id)
    if (cErr) throw cErr
    toast({ title: 'Onboarding completado' })
    router.replace('/dashboard')
  }

  const handleContinue = () => {
    if (step === 1) {
      setSubmitting(true)
      saveBasic().catch(err=> toast({variant:'destructive',title:'Error',description: err.message||'No se pudo guardar'})).finally(()=> setSubmitting(false))
    } else if (step === 2) {
      setSubmitting(true)
      saveSchedule().catch(err=> toast({variant:'destructive',title:'Error',description: err.message||'No se pudo guardar'})).finally(()=> setSubmitting(false))
    } else if (step === 3) {
      setSubmitting(true)
      finalizeOnboarding().catch(err=> toast({variant:'destructive', title:'Error', description: err.message||'No se pudo finalizar'})).finally(()=> setSubmitting(false))
    }
  }

  if (loading) return <div className='flex items-center justify-center min-h-screen'>Cargando...</div>

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-background'>
      <Card className='w-full max-w-3xl'>
        <CardHeader>
          <CardTitle>Configuración Inicial</CardTitle>
          <CardDescription>
            {step===1 && 'Datos básicos de la clínica'}
            {step===2 && 'Horarios de atención e intervalos'}
            {step===3 && 'Crea el miembro administrador y miembros opcionales'}
          </CardDescription>
          <div className='mt-4'>
            <Progress value={(step/3)*100} />
            <p className='mt-2 text-xs text-muted-foreground'>Podrás modificar toda esta información más adelante en Ajustes de la clínica.</p>
          </div>
        </CardHeader>
        <CardContent>
          {step===1 && (
            <form id='step1Form' onSubmit={e => { e.preventDefault(); handleContinue() }} className='grid gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='legalName'>Nombre de la Clínica *</Label>
                <Input id='legalName' value={basic.legalName} onChange={handleBasicChange} required />
              </div>
              <div className='grid md:grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='phone'>Teléfono *</Label>
                  <Input id='phone' value={basic.phone} onChange={handleBasicChange} required inputMode='tel' />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='address'>Dirección *</Label>
                  <Input id='address' value={basic.address} onChange={handleBasicChange} required />
                </div>
              </div>
              <div className='grid md:grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='city'>Ciudad</Label>
                  <Input id='city' value={basic.city} onChange={handleBasicChange} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='country'>País</Label>
                  <Input id='country' value={basic.country} onChange={handleBasicChange} />
                </div>
              </div>
              <div className='grid gap-2'>
                <Label>Logo</Label>
                <div onClick={()=> fileInputRef.current?.click()} onDragOver={e=> e.preventDefault()} onDrop={e=> { e.preventDefault(); const f=e.dataTransfer.files?.[0]; if(f) setBasic(b=>({...b,logoFile:f})) }} className='border border-dashed rounded p-6 text-center cursor-pointer'>
                  <input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={e=> { const f=e.target.files?.[0]; if(f) setBasic(b=>({...b,logoFile:f})) }} />
                  {logoPreview ? (
                    <div className='flex flex-col items-center gap-2'>
                      <img src={logoPreview} alt='Vista previa logo' className='w-32 h-32 object-contain rounded' />
                      <span className='text-sm text-muted-foreground'>{typeof basic.logoFile === 'string' ? basic.logoFile.split('/').pop() : basic.logoFile?.name}</span>
                    </div>
                  ) : (
                    <span>Arrastre o haga click aquí para seleccionar la imagen del logo</span>
                  )}
                </div>
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='terms'>Términos y Condiciones</Label>
                <Textarea id='terms' value={basic.terms} onChange={handleBasicChange} placeholder={'Estos términos se usarán para generar los consentimientos informados digitales. Puedes modificarlos más tarde en Ajustes.'} />
              </div>
              <Button type='submit' className='hidden'>Continuar</Button>
            </form>
          )}
          {step===2 && (
            <div className='space-y-6'>
              <div className='space-y-4'>
                {daysOrder.map((day) => {
                  const intervals = schedule[day] ?? []
                  return (
                    <div key={day} className='border rounded p-4 space-y-2'>
                      <div className='flex justify-between items-center'>
                        <h4 className='font-medium'>{dayNames[day] || day}</h4>
                        <div className='text-sm text-muted-foreground'>{intervals.length} intervalo(s)</div>
                      </div>
                      {intervals.length===0 && <div className='text-sm text-muted-foreground'>Sin intervalos (cerrado)</div>}
                      {intervals.map((intv, idx) => (
                        <div key={idx} className='flex items-center gap-2'>
                          <div className='flex flex-col'>
                            <Label className='text-xs'>Inicio</Label>
                            <Input type='time' value={intv.start} onChange={e=> setSchedule(s=> ({...s,[day]: s[day].map((x,i)=> i===idx? {...x,start:e.target.value}: x)}))} className='h-9'/>
                          </div>
                          <div className='flex flex-col'>
                            <Label className='text-xs'>Fin</Label>
                            <Input type='time' value={intv.end} onChange={e=> setSchedule(s=> ({...s,[day]: s[day].map((x,i)=> i===idx? {...x,end:e.target.value}: x)}))} className='h-9'/>
                          </div>
                          {intervals.length>1 && <Button type='button' variant='outline' size='sm' className='border border-destructive text-destructive mt-5' onClick={()=> removeInterval(day, idx)}>Eliminar</Button>}
                        </div>
                      ))}
                      <div className='flex justify-between items-center'>
                        <div className='flex gap-2'>
                          <Button type='button' variant='secondary' size='sm' onClick={()=> addInterval(day)}>Añadir intervalo</Button>
                          {day !== 'monday' && (
                            <Button type='button' variant='ghost' size='sm' onClick={()=> copyPreviousDay(day)}>Repetir horario del día anterior</Button>
                          )}
                        </div>
                        <div>
                          {intervals.length>0 ? (
                            <Button type='button' variant='outline' size='sm' onClick={()=> setSchedule(s=> ({...s,[day]:[]}))}>Cerrar día</Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {step===3 && (
            <div className='space-y-6'>
              <form id='step3Form' onSubmit={e=> { e.preventDefault(); handleContinue() }} className='space-y-4'>
                <h4 className='font-medium'>Administrador de la Cuenta</h4>
                <div className='grid md:grid-cols-2 gap-4'>
                  <div className='grid gap-2'>
                    <Label>Nombre *</Label>
                    <Input value={adminMember.firstName} onChange={e=> handleMemberChange('firstName', e.target.value)} required />
                  </div>
                  <div className='grid gap-2'>
                    <Label>Apellido *</Label>
                    <Input value={adminMember.lastName} onChange={e=> handleMemberChange('lastName', e.target.value)} required />
                  </div>
                </div>
                <div className='grid gap-2'>
                  <Label>Puesto (opcional)</Label>
                  <Input value={adminMember.jobTitle} onChange={e=> handleMemberChange('jobTitle', e.target.value)} />
                </div>
                <div className='flex gap-6 items-center'>
                  <div className='flex items-center gap-2'>
                    <Checkbox checked disabled /> <span className='text-sm'>Admin</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Checkbox checked={adminMember.roles.doctor} onCheckedChange={(v:any)=> setAdminMember(m=> ({...m, roles:{...m.roles, doctor: !!v}}))} /> <span className='text-sm'>Doctor</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Checkbox checked={adminMember.roles.staff} onCheckedChange={(v:any)=> setAdminMember(m=> ({...m, roles:{...m.roles, staff: !!v}}))} /> <span className='text-sm'>Staff</span>
                  </div>
                </div>
                {/* hidden submit kept for accessibility, real actions are in footer */}
                <div className='hidden'><Button type='submit'>Finalizar</Button></div>
              </form>
            </div>
          )}
        </CardContent>
        <div className='px-6 pb-6'>
          <div className='flex justify-between'>
            <Button variant='outline' disabled={step===1 || submitting} onClick={()=> !submitting && step>1 && setStep((s)=> (s-1) as any)}>Atrás</Button>
            {step < 3 && (
              <Button onClick={handleContinue} disabled={submitting}>{submitting? 'Guardando...' : 'Continuar'}</Button>
            )}
            {step === 3 && (
              <Button onClick={handleContinue} disabled={submitting}>{submitting? 'Finalizando...' : 'Finalizar'}</Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
