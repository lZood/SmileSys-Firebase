'use client';

import Link from 'next/link';
import { SmileSysLogo } from '@/components/icons/smilesys-logo';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const features = [
    { t: 'Agenda Inteligente', d: 'Gestión visual de citas, recordatorios automatizados y vistas diarias/semanales.' },
    { t: 'Gestión de Pacientes', d: 'Perfiles completos, antecedentes médicos y seguimiento de tratamientos.' },
    { t: 'Odontograma Interactivo', d: 'Visualización precisa para planificar y documentar procedimientos.' },
    { t: 'Reportes y Métricas', d: 'Indicadores clave de productividad, ingresos y ocupación.' },
    { t: 'Permisos y Roles', d: 'Control granular de acceso para administradores, doctores y staff.' },
    { t: 'Notificaciones', d: 'Alertas en tiempo real sobre pagos, citas y actualizaciones.' },
  ];
  const plans = [
    { name: 'Starter', price: 'Gratis', tagline: 'Para comenzar', features: ['1 Clínica', 'Hasta 3 miembros', 'Agenda básica', 'Soporte por email'] },
    { name: 'Pro', price: '$49/mes', tagline: 'Crecimiento', features: ['Clínicas ilimitadas', 'Miembros ilimitados', 'Integración Google Calendar', 'Reportes avanzados', 'Soporte prioritario'] },
    { name: 'Enterprise', price: 'Custom', tagline: 'Escala y soporte dedicado', features: ['Acuerdos SLA', 'Integraciones avanzadas', 'Soporte dedicado', 'Roadmap conjunto'] },
  ];
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/60 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SmileSysLogo className="h-8 w-8" />
            <span className="font-semibold text-lg">SmileSys</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <a href="#features" className="hover:text-primary">Características</a>
            <a href="#pricing" className="hover:text-primary">Precios</a>
            <a href="#security" className="hover:text-primary">Seguridad</a>
            <a href="#contact" className="hover:text-primary">Contacto</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link href="/login">Iniciar sesión</Link></Button>
            <Button asChild><Link href="/signup-new">Comenzar</Link></Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative py-24 md:py-36 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
          <div className="relative max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
                Gestiona tu Clínica Dental <span className="text-primary">de Forma Inteligente</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-prose">
                SmileSys centraliza pacientes, agenda, tratamientos, facturación y comunicación en una sola plataforma segura y moderna.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button size="lg" asChild><Link href="/signup-new">Probar Gratis</Link></Button>
                <Button size="lg" variant="outline" asChild><Link href="#pricing">Ver Precios</Link></Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Prueba gratuita sin tarjeta. Cancela cuando quieras.</p>
            </div>
            <div className="relative rounded-xl border bg-card shadow-sm p-6">
              <div className="grid gap-4">
                <div className="space-y-1">
                  <h3 className="font-semibold">Panel Unificado</h3>
                  <p className="text-sm text-muted-foreground">Citas, recordatorios y métricas clave en un vistazo.</p>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold">Integración con Google Calendar</h3>
                  <p className="text-sm text-muted-foreground">Sincroniza agendas en tiempo real y evita dobles reservas.</p>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold">Facturación y Pagos</h3>
                  <p className="text-sm text-muted-foreground">Control de presupuestos, pagos y estados de cuenta.</p>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold">Historia Clínica y Odontograma</h3>
                  <p className="text-sm text-muted-foreground">Registro completo y visual del estado dental del paciente.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-24 bg-muted/30">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-10">Características Principales</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map(f => (
                <div key={f.t} className="rounded-lg border bg-card p-5 shadow-sm hover:shadow transition">
                  <h3 className="font-semibold mb-2">{f.t}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-24">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-10">Planes y Precios</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map(p => (
                <div key={p.name} className="rounded-xl border bg-card p-6 flex flex-col shadow-sm">
                  <h3 className="font-semibold text-lg">{p.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{p.tagline}</p>
                  <div className="text-2xl font-bold mb-4">{p.price}</div>
                  <ul className="space-y-2 text-sm flex-1">
                    {p.features.map(f => (
                      <li key={f} className="flex items-start gap-2"><span className="text-primary">•</span><span>{f}</span></li>
                    ))}
                  </ul>
                  <Button className="mt-6" variant={p.name === 'Pro' ? 'default' : 'outline'} asChild>
                    <Link href="/signup-new">Elegir {p.name}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="py-24 bg-muted/30">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Seguridad y Privacidad</h2>
              <p className="text-muted-foreground leading-relaxed mb-4 text-sm">Cifrado en tránsito y en reposo, políticas de acceso basadas en roles y registros auditables. Implementamos buenas prácticas para proteger la información sensible de tus pacientes.</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Autenticación robusta y control granular de permisos</li>
                <li>• Respaldo automático de datos</li>
                <li>• Aislamiento lógico por clínica</li>
              </ul>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="font-semibold mb-3">Cumplimiento en proceso</h3>
              <p className="text-sm text-muted-foreground">Trabajamos hacia certificaciones y estándares para reforzar la confianza y la seguridad de la plataforma.</p>
            </div>
          </div>
        </section>

        <section id="contact" className="py-24">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-6">¿Listo para transformar tu clínica?</h2>
            <p className="text-muted-foreground mb-8">Agenda una demo personalizada o comienza gratis ahora mismo.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild><Link href="/signup-new">Crear cuenta</Link></Button>
              <Button size="lg" variant="outline" asChild><Link href="mailto:contacto@smilesys.com">Agendar demo</Link></Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-10 text-center text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} SmileSys. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <Link href="#">Términos</Link>
            <Link href="#">Privacidad</Link>
            <Link href="mailto:contacto@smilesys.com">Soporte</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
