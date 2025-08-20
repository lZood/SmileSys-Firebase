'use client';

import Link from 'next/link';
import { SmileSysLogo } from '@/components/icons/smilesys-logo';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const features = [
    { t: 'Agenda Inteligente', d: 'Arrastra y reprograma, evita solapamientos y recibe recordatorios automáticos.' },
    { t: 'Odontograma Digital', d: 'Registro visual interactivo para diagnósticos y seguimiento de tratamientos.' },
    { t: 'Facturación Integrada', d: 'Presupuestos, pagos y estado de cuenta vinculados al expediente clínico.' },
    { t: 'Reportes & Métricas', d: 'Indicadores de productividad, ocupación y conversión de presupuestos.' },
    { t: 'Roles & Permisos', d: 'Acceso granular para doctores, administración y staff de apoyo.' },
    { t: 'Notificaciones en Tiempo Real', d: 'Alertas inmediatas sobre citas, pagos y actualizaciones de pacientes.' },
  ];
  const plans = [
    { name: 'Starter', price: 'Gratis', tagline: 'Para comenzar', highlighted: false, features: ['1 clínica', 'Hasta 3 miembros', 'Agenda básica', 'Odontograma estándar', 'Soporte por email'] },
    { name: 'Pro', price: '$49/mes', tagline: 'Escala tu operación', highlighted: true, features: ['Clínicas ilimitadas', 'Miembros ilimitados', 'Integración Google Calendar', 'Reportes avanzados', 'Automatizaciones (próx.)', 'Soporte prioritario'] },
    { name: 'Enterprise', price: 'Custom', tagline: 'Operaciones avanzadas', highlighted: false, features: ['SLA y soporte dedicado', 'Integraciones personalizadas', 'Exportaciones avanzadas', 'Auditoría extendida'] },
  ];
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/10 via-background to-primary/30">
      <header className="fixed inset-x-0 top-0 z-40 border-b bg-background/70 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SmileSysLogo className="h-8 w-8" />
            <span className="font-semibold text-lg">SmileSys</span>
          </div>
          <nav className="hidden md:flex gap-7 text-sm font-medium">
            <a href="#producto" className="hover:text-primary">Producto</a>
            <a href="#beneficios" className="hover:text-primary">Beneficios</a>
            <a href="#pricing" className="hover:text-primary">Precios</a>
            <a href="#seguridad" className="hover:text-primary">Seguridad</a>
            <Link href="/resources" className="hover:text-primary">Recursos</Link>
            <a href="#contacto" className="hover:text-primary">Contacto</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link href="/login">Iniciar sesión</Link></Button>
            <Button asChild><Link href="/signup-new">Comenzar</Link></Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-24">
          {/* HERO */}
          <section className="relative overflow-hidden bg-gradient-to-b from-primary/20 via-background to-primary/10 animate-fade-in">
            <div className="absolute -top-24 -left-24 h-[600px] w-[600px] rounded-full bg-primary/20 blur-3xl animate-float" />
            <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-primary/10 blur-2xl animate-float2" />
            <div className="relative max-w-7xl mx-auto px-6 py-28 grid md:grid-cols-2 gap-14 items-center">
              <div className="animate-slide-up">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
                  La Plataforma Todo‑en‑Uno para la Gestión Dental
                </h1>
                <p className="mt-6 text-lg text-muted-foreground max-w-prose">
                  Centraliza agenda, pacientes, odontogramas, facturación y métricas. Reduce tareas manuales y mejora la experiencia del paciente con procesos inteligentes.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Button size="lg" asChild className="animate-pop"><Link href="/signup-new">Probar Gratis</Link></Button>
                  <Button size="lg" variant="outline" asChild className="animate-pop-delay"><Link href="#pricing">Ver Planes</Link></Button>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">14 días gratis • Sin tarjeta • Cancela cuando quieras</p>
              </div>
              <div className="relative animate-fade-in">
                <div className="aspect-video w-full rounded-xl border bg-muted/40 flex items-center justify-center text-xs text-muted-foreground shadow-xl animate-zoom-in group transition-all duration-500 hover:scale-105 hover:border-primary hover:bg-primary/10">
                  {/* IMAGE_PLACEHOLDER: Demo App Screenshot */}
                  <span className="transition-transform duration-500 group-hover:scale-110">Imagen / Demo</span>
                </div>
              </div>
            </div>
          </section>

          {/* BLOQUE 1 */}
          <section id="producto" className="py-24 animate-fade-in">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
              <div className="aspect-video rounded-xl border bg-muted/40 flex items-center justify-center text-xs text-muted-foreground animate-zoom-in group md:order-first order-last transition-all duration-500 hover:scale-105 hover:border-primary hover:bg-primary/10">
                {/* IMAGE_PLACEHOLDER: Calendar Illustration */}
                <span className="transition-transform duration-500 group-hover:scale-110">Imagen Calendario</span>
              </div>
              <div className="space-y-6 animate-slide-up md:order-last order-first">
                <h2 className="text-3xl font-bold leading-tight">Optimiza la Gestión de Citas</h2>
                <p className="text-muted-foreground">Nuestra Agenda Inteligente reduce ausencias con recordatorios automáticos, evita dobles reservas gracias a la integración con Google Calendar y te muestra huecos aprovechables para incrementar ocupación.</p>
                <ul className="text-sm grid gap-2 text-muted-foreground">
                  <li>• Vista diaria y semanal interactiva</li>
                  <li>• Arrastrar y soltar para reprogramar</li>
                  <li>• Recordatorios y notificaciones en tiempo real</li>
                </ul>
                <div className="pt-2"><Button asChild className="animate-pop" ><Link href="/signup-new">Crear cuenta</Link></Button></div>
              </div>
            </div>
          </section>

          {/* BLOQUE 2 */}
          <section className="py-24 bg-muted/30 animate-fade-in">
            <div className="max-w-7xl mx-auto px-6 space-y-32">
              {/* Sub‑bloque 1: texto izquierda / ilustración derecha */}
              <div className="grid md:grid-cols-2 gap-20 items-center">
                <div className="space-y-6 animate-slide-up">
                  <h2 className="text-3xl font-bold leading-tight">
                    Colabora con tu <span className="relative inline-block after:absolute after:inset-x-0 after:bottom-1 after:h-2 after:bg-primary/30 after:-z-10">Equipo</span>
                  </h2>
                  <p className="text-muted-foreground">Centraliza la comunicación clínica y administrativa. Roles y permisos aseguran acceso correcto; las notificaciones mantienen a todos sincronizados sin cadenas infinitas de mensajes.</p>
                  <ul className="text-sm grid gap-2 text-muted-foreground">
                    <li>• Roles personalizables y seguros</li>
                    <li>• Notificaciones internas y email</li>
                    <li>• Historial y trazabilidad de cambios</li>
                  </ul>
                  <Button asChild size="sm" className="animate-pop"><Link href="/signup-new">Empezar</Link></Button>
                </div>
                <div className="aspect-video rounded-xl border bg-muted flex items-center justify-center text-xs text-muted-foreground animate-zoom-in group transition-all duration-500 hover:scale-105 hover:border-primary hover:bg-primary/10">
                  {/* IMAGE_PLACEHOLDER: Team Collaboration Illustration */}
                  <span className="transition-transform duration-500 group-hover:scale-110">Ilustración Equipo</span>
                </div>
              </div>
              {/* Sub‑bloque 2: diagrama red izquierda / texto derecha */}
              <div className="grid md:grid-cols-2 gap-20 items-center">
                <div className="relative aspect-square w-full max-w-md mx-auto flex items-center justify-center animate-fade-in">
                  {/* Static network diagram image, white for light mode, black for dark mode */}
                  <img
                    src="/images/ts1.png"
                    alt="Diagrama de equipo"
                    className="block dark:hidden w-full h-full object-contain"
                  />
                  <img
                    src="/images/ts2.png"
                    alt="Diagrama de equipo"
                    className="hidden dark:block w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-6 animate-slide-up">
                  <h3 className="text-3xl font-bold leading-tight">Trabajo en <span className="relative inline-block after:absolute after:inset-x-0 after:bottom-1 after:h-2 after:bg-primary/30 after:-z-10">Sincronía</span></h3>
                  <p className="text-muted-foreground">Cada cambio en citas, pagos o expediente clínico se refleja en tiempo real. Los miembros adecuados reciben alertas, reduciendo errores y repeticiones de tareas.</p>
                  <ul className="text-sm grid gap-2 text-muted-foreground">
                    <li>• Notificaciones en tiempo real</li>
                    <li>• Menos fricción, más coordinación</li>
                    <li>• Visibilidad compartida y controlada</li>
                  </ul>
                  <div className="pt-1"><Button variant="outline" size="sm" asChild className="animate-pop"><Link href="/signup-new">Probar colaboración</Link></Button></div>
                </div>
              </div>
            </div>
          </section>

          {/* BLOQUE 3 DARK */}
          <section className="py-24 bg-primary/95 text-primary-foreground animate-fade-in" id="beneficios">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
              <div className="space-y-6 animate-slide-up">
                <h2 className="text-3xl font-bold leading-tight">Odontograma Digital Interactivo</h2>
                <p className="text-primary-foreground/90">Mejora la comunicación con el paciente mostrando de forma clara diagnósticos, evolución y tratamientos recomendados. Aumenta aceptación de presupuestos y confianza.</p>
                <ul className="text-sm grid gap-2 text-primary-foreground/90">
                  <li>• Registro visual unificado</li>
                  <li>• Asociación a presupuestos y pagos</li>
                  <li>• Seguimiento de evolución clínica</li>
                </ul>
              </div>
              <div className="aspect-video rounded-xl border border-primary/30 bg-primary/20 flex items-center justify-center text-xs animate-zoom-in group transition-all duration-500 hover:scale-105 hover:border-primary-foreground hover:bg-primary/30">
                {/* IMAGE_PLACEHOLDER: Odontograma */}
                <span className="transition-transform duration-500 group-hover:scale-110">Odontograma</span>
              </div>
            </div>
          </section>

          {/* BLOQUE 4 */}
          <section className="py-24 animate-fade-in">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
              <div className="aspect-video rounded-xl border bg-muted/40 flex items-center justify-center text-xs text-muted-foreground animate-zoom-in group transition-all duration-500 hover:scale-105 hover:border-primary hover:bg-primary/10">
                {/* IMAGE_PLACEHOLDER: Customization */}
                <span className="transition-transform duration-500 group-hover:scale-110">Personalización</span>
              </div>
              <div className="space-y-6 animate-slide-up">
                <h2 className="text-3xl font-bold leading-tight">Personaliza Flujos a tus Necesidades</h2>
                <p className="text-muted-foreground">Configura horarios, tipos de tratamiento, plantillas de consentimientos y más para acelerar la operación diaria y reducir errores de registro.</p>
                <ul className="text-sm grid gap-2 text-muted-foreground">
                  <li>• Plantillas reutilizables</li>
                  <li>• Estandarización de duraciones</li>
                  <li>• Configuración rápida de clínica</li>
                </ul>
              </div>
            </div>
          </section>

          {/* FEATURE GRID */}
          <section className="py-24 bg-muted/20 animate-fade-in">
            <div className="max-w-7xl mx-auto px-6">
              <h2 className="text-3xl font-bold mb-10">Todo lo que Necesitas en un Sólo Lugar</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {features.map((f,i) => {
                  let icon;
                  switch (f.t) {
                    case 'Agenda Inteligente':
                      icon = <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 9h18"/></svg>; // Calendar
                      break;
                    case 'Odontograma Digital':
                      icon = (
                        <svg className="h-7 w-7" viewBox="0 0 40 46" fill="none">
                          <path d="M10 10 C 10 0, 30 0, 30 10 L 30 30 C 30 45, 25 45, 25 45 L 23 30 L 17 30 L 15 45 C 15 45, 10 45, 10 30 Z" className="stroke-current stroke-[2] fill-none transition-colors duration-300 group-hover:stroke-primary" />
                        </svg>
                      ); // Custom tooth path
                      break;
                    case 'Facturación Integrada':
                      icon = <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 10h8M8 14h6"/></svg>; // Bill
                      break;
                    case 'Reportes & Métricas':
                      icon = <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 17v-6m4 6V7m4 10v-4m4 4V9"/></svg>; // Chart
                      break;
                    case 'Roles & Permisos':
                      icon = <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0112 0v2"/></svg>; // User
                      break;
                    case 'Notificaciones en Tiempo Real':
                      icon = <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>; // Bell
                      break;
                    default:
                      icon = <span>★</span>;
                  }
                  return (
                    <div key={f.t} className={`relative rounded-xl border bg-gradient-to-br from-primary/5 via-card to-primary/10 p-6 shadow-lg hover:shadow-2xl transition-all duration-400 group animate-pop-delay`} style={{animationDelay: `${i*0.1+0.2}s`}}>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl shadow-md group-hover:scale-125 group-hover:bg-primary/40 group-hover:border-2 group-hover:border-primary transition-transform duration-400">
                          {icon}
                        </div>
                      </div>
                      <h3 className="font-semibold mb-2 mt-8 text-lg group-hover:text-primary transition-colors duration-300">{f.t}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-primary/80 transition-colors duration-300">{f.d}</p>
                      <div className="absolute inset-0 rounded-xl pointer-events-none group-hover:ring-4 group-hover:ring-primary/20 transition-all duration-300" />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* PRICING */}
          <section id="pricing" className="py-28 animate-fade-in">
            <div className="max-w-7xl mx-auto px-6">
              <h2 className="text-3xl font-bold text-center mb-4">Planes y Precios</h2>
              <p className="text-sm text-muted-foreground text-center max-w-xl mx-auto mb-12">Elige el plan que mejor se adapte al tamaño y crecimiento de tu clínica. Cambia de plan en cualquier momento.</p>
              <div className="grid md:grid-cols-3 gap-8">
                {plans.map((p,i) => (
                  <div key={p.name} className={`relative rounded-xl border flex flex-col p-6 shadow-sm ${p.highlighted ? 'bg-primary text-primary-foreground border-primary' : 'bg-card'} animate-pop-delay group transition-all duration-400 hover:scale-[1.04] hover:shadow-2xl`} style={{animationDelay: `${i*0.15+0.2}s`}}>
                    {p.highlighted && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] tracking-wide px-2 py-1 rounded bg-primary-foreground text-primary font-semibold">POPULAR</span>}
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-300">{p.name}</h3>
                    <p className={`text-sm mb-4 ${p.highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'} group-hover:text-primary/80 transition-colors duration-300`}>{p.tagline}</p>
                    <div className="text-2xl font-bold mb-4">{p.price}</div>
                    <ul className={`space-y-2 text-sm flex-1 ${p.highlighted ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                      {p.features.map(f => (
                        <li key={f} className={`flex items-start gap-2`}><span className={p.highlighted ? 'text-primary-foreground' : 'text-primary'}>•</span><span>{f}</span></li>
                      ))}
                    </ul>
                    <Button className="mt-6 group-hover:scale-105 transition-transform duration-300" variant={p.highlighted ? 'secondary' : 'outline'} asChild>
                      <Link href="/signup-new">Elegir {p.name}</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SEGURIDAD */}
          <section id="seguridad" className="py-24 bg-muted/30 animate-fade-in">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
              <div className="animate-slide-up">
                <h2 className="text-3xl font-bold mb-6">Seguridad y Privacidad</h2>
                <p className="text-muted-foreground leading-relaxed mb-4 text-sm">Cifrado en tránsito y en reposo, políticas de acceso basadas en roles, aislamiento por clínica y registros auditables. Trabajamos hacia certificaciones que refuercen la confianza en la plataforma.</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Cifrado TLS y políticas de acceso</li>
                  <li>• Backups automáticos</li>
                  <li>• Aislamiento lógico multi‑clínica</li>
                </ul>
              </div>
              <div className="aspect-video rounded-xl border bg-muted flex items-center justify-center text-xs text-muted-foreground animate-zoom-in group transition-all duration-500 hover:scale-105 hover:border-primary hover:bg-primary/10">
                {/* IMAGE_PLACEHOLDER: Security Illustration */}
                <span className="transition-transform duration-500 group-hover:scale-110">Seguridad</span>
              </div>
            </div>
          </section>

          {/* INTEGRACIONES */}
          <section className="py-24 animate-fade-in">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
              <div className="aspect-video rounded-xl border bg-muted/40 flex items-center justify-center text-xs text-muted-foreground animate-zoom-in group transition-all duration-500 hover:scale-105 hover:border-primary hover:bg-primary/10">
                {/* IMAGE_PLACEHOLDER: Integrations network */}
                <span className="transition-transform duration-500 group-hover:scale-110">Integraciones</span>
              </div>
              <div className="animate-slide-up">
                <h2 className="text-3xl font-bold mb-6">Integraciones Clave</h2>
                <p className="text-muted-foreground mb-4">Conecta SmileSys con Google Calendar para sincronizar agendas y próximamente con más servicios para automatizar aún más tu operación.</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Sincronización bidireccional de citas</li>
                  <li>• Evita dobles reservas y huecos innecesarios</li>
                  <li>• Próximamente: Más integraciones (facturación electrónica, mensajería)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* TESTIMONIOS PLACEHOLDER */}
          <section className="py-24 bg-muted/20 animate-fade-in">
            <div className="max-w-7xl mx-auto px-6 text-center">
              <h2 className="text-3xl font-bold mb-12">Lo que dicen nuestros usuarios</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[1,2,3].map(i => (
                  <div key={i} className="rounded-xl border bg-card p-6 text-left animate-pop-delay group transition-all duration-400 hover:scale-[1.04] hover:shadow-2xl" style={{animationDelay: `${i*0.2+0.2}s`}}>
                    <div className="text-4xl leading-none mb-4 group-hover:text-primary transition-colors duration-300">“”</div>
                    <p className="text-sm text-muted-foreground mb-4 group-hover:text-primary/80 transition-colors duration-300">{/* TESTIMONIO_PLACEHOLDER */}Texto de testimonio pendiente.</p>
                    <div className="text-sm font-medium group-hover:text-primary transition-colors duration-300">Nombre Usuario</div>
                    <div className="text-xs text-muted-foreground group-hover:text-primary/60 transition-colors duration-300">Rol / Clínica</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA FINAL */}
          <section id="contacto" className="py-28 bg-primary/95 text-primary-foreground text-center animate-fade-in">
            <div className="max-w-3xl mx-auto px-6">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Empieza a Optimizar tu Clínica Hoy</h2>
              <p className="text-primary-foreground/90 mb-8 text-sm md:text-base">Centraliza información, mejora coordinación y toma decisiones con datos. SmileSys evoluciona contigo.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" variant="secondary" asChild className="animate-pop"><Link href="/signup-new">Crear cuenta</Link></Button>
                <Button size="lg" variant="outline" asChild className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 animate-pop-delay"><Link href="mailto:contacto@smilesys.com">Agendar demo</Link></Button>
              </div>
              <p className="mt-6 text-xs opacity-80">¿Equipo grande o necesidades especiales? <a href="mailto:contacto@smilesys.com" className="underline">Habla con ventas</a>.</p>
            </div>
          </section>
      </main>

      <footer className="border-t py-10 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} SmileSys. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <Link href="#">Términos</Link>
            <Link href="#">Privacidad</Link>
            <Link href="mailto:contacto@smilesys.com">Soporte</Link>
          </div>
        </div>
      </footer>
        {/* Animations CSS */}
        <style jsx global>{`
          @keyframes fade-in { from { opacity: 0; transform: translateY(30px);} to { opacity: 1; transform: none; } }
          @keyframes slide-up { from { opacity: 0; transform: translateY(60px);} to { opacity: 1; transform: none; } }
          @keyframes pop { 0% { opacity: 0; transform: scale(0.8);} 80% { opacity: 1; transform: scale(1.05);} 100% { opacity: 1; transform: scale(1);} }
          @keyframes pop-delay { 0% { opacity: 0; transform: scale(0.8);} 60% { opacity: 1; transform: scale(1.05);} 100% { opacity: 1; transform: scale(1);} }
          @keyframes zoom-in { from { opacity: 0; transform: scale(0.7);} to { opacity: 1; transform: scale(1);} }
          @keyframes float { 0% { transform: translateY(0);} 50% { transform: translateY(30px);} 100% { transform: translateY(0);} }
          @keyframes float2 { 0% { transform: translateY(0);} 50% { transform: translateY(-20px);} 100% { transform: translateY(0);} }
          @keyframes spin-slow { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
          @keyframes spin-slower { 0% { transform: rotate(0deg);} 100% { transform: rotate(-360deg);} }
          .animate-fade-in { animation: fade-in 1s cubic-bezier(.4,0,.2,1) both; }
          .animate-slide-up { animation: slide-up 1.1s cubic-bezier(.4,0,.2,1) both; }
          .animate-pop { animation: pop 0.7s cubic-bezier(.4,0,.2,1) both; }
          .animate-pop-delay { animation: pop-delay 1.2s cubic-bezier(.4,0,.2,1) both; }
          .animate-zoom-in { animation: zoom-in 1.2s cubic-bezier(.4,0,.2,1) both; }
          .animate-float { animation: float 6s ease-in-out infinite; }
          .animate-float2 { animation: float2 7s ease-in-out infinite; }
          .animate-spin-slow { animation: spin-slow 18s linear infinite; }
          .animate-spin-slower { animation: spin-slower 32s linear infinite; }
        `}</style>
    </div>
  );
}
