"use client";

import Link from "next/link";
import { SmileSysLogo } from "@/components/icons/smilesys-logo";
import { Button } from "@/components/ui/button";

const pillars = [
  { t: "Cifrado", d: "TLS en tránsito y cifrado en reposo para proteger los datos." },
  { t: "Control de acceso", d: "Roles y permisos granulares con mínimos privilegios." },
  { t: "Aislamiento", d: "Separación lógica por clínica y políticas estrictas de datos." },
  { t: "Auditoría", d: "Registros de actividad y trazabilidad de cambios clave." },
  { t: "Backups", d: "Copias de seguridad automatizadas y pruebas de restauración." },
  { t: "Cumplimiento", d: "Buenas prácticas y hoja de ruta de certificaciones." },
];

const controls = [
  "Cifrado TLS (HTTPS) y almacenamiento cifrado",
  "Autenticación segura y cierre de sesión forzado",
  "Roles, permisos y separación por clínica",
  "Políticas de retención y eliminación bajo solicitud",
  "Backups automáticos y redundancia",
  "Monitoreo y alertas ante eventos anómalos",
];

export default function SeguridadPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/10 via-background to-primary/30">
      {/* Header (reutilizado) */}
      <header className="fixed inset-x-0 top-0 z-40 border-b bg-background/75 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90">
            <SmileSysLogo className="h-8 w-8" />
            <span className="font-semibold text-lg">SmileSys</span>
          </Link>
          <nav className="hidden md:flex gap-7 text-sm font-medium">
            <Link href="/producto" className="hover:text-primary">Producto</Link>
            <Link href="/beneficios" className="hover:text-primary">Beneficios</Link>
            <Link href="/#pricing" className="hover:text-primary">Precios</Link>
            <Link href="/seguridad" className="text-primary font-semibold">Seguridad</Link>
            <Link href="/resources" className="hover:text-primary">Recursos</Link>
            <Link href="/contacto" className="hover:text-primary">Contacto</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/signup-new">Comenzar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-24">
        {/* Hero Seguridad */}
        <section className="relative overflow-hidden bg-white animate-fade-in">
          <div className="relative max-w-7xl mx-auto px-6 py-20">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">Seguridad y Privacidad</h1>
            <p className="mt-4 text-muted-foreground max-w-2xl">
              Protección de datos de pacientes y clínica con cifrado, controles de acceso y auditoría continua.
            </p>
          </div>
        </section>

        {/* Pilares */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold mb-8">Pilares</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {pillars.map((p, i) => (
                <div key={p.t} className="rounded-xl border bg-card p-6 animate-pop-delay" style={{ animationDelay: `${i * 0.1 + 0.2}s` }}>
                  <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl mb-4">🔒</div>
                  <h3 className="font-semibold mb-2">{p.t}</h3>
                  <p className="text-sm text-muted-foreground">{p.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Controles técnicos */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-14 items-start">
            <div>
              <h2 className="text-2xl font-bold mb-4">Controles técnicos</h2>
              <ul className="text-sm text-muted-foreground space-y-2">
                {controls.map((c) => (
                  <li key={c}>• {c}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border bg-muted/40 aspect-video flex items-center justify-center text-xs text-muted-foreground animate-zoom-in group transition-all duration-500 hover:scale-105 hover:border-primary hover:bg-primary/10">
              <span className="transition-transform duration-500 group-hover:scale-110">Diagrama de seguridad</span>
            </div>
          </div>
        </section>

        {/* Cumplimiento y privacidad */}
        <section className="py-16 bg-gradient-to-br from-primary/15 via-background to-primary/8 animate-fade-in">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-14 items-start">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold">Cumplimiento y privacidad</h2>
              <p className="text-sm text-muted-foreground">
                Buenas prácticas de seguridad por defecto y hoja de ruta hacia certificaciones relevantes. Procesos de gestión de incidencias y derechos del titular (acceso, rectificación, eliminación) bajo solicitud.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-2">Compromisos</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Acuerdos de confidencialidad y mínimos privilegios</li>
                <li>• Revisiones periódicas y pruebas de restauración</li>
                <li>• Versionado y trazabilidad de cambios</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-primary/95 text-primary-foreground text-center animate-fade-in">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Confía tus datos a SmileSys</h2>
            <p className="text-primary-foreground/90 mb-6 text-sm md:text-base">Arquitectura segura y controles para tu tranquilidad.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" asChild className="animate-pop">
                <Link href="/signup-new">Crear cuenta</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 animate-pop-delay">
                <Link href="/contacto">Hablar con nosotros</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer (reutilizado) */}
      <footer className="border-t py-10 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} SmileSys. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <Link href="#">Términos</Link>
            <Link href="#">Privacidad</Link>
            <Link href="/contacto">Contacto</Link>
            <Link href="mailto:contacto@smilesys.com">Soporte</Link>
          </div>
        </div>
      </footer>

      {/* Animations CSS (reuso) */}
      <style jsx global>{`
        .animate-fade-in{animation:fade-in 1s cubic-bezier(.4,0,.2,1) both}
        .animate-slide-up{animation:slide-up 1.1s cubic-bezier(.4,0,.2,1) both}
        .animate-pop{animation:pop .7s cubic-bezier(.4,0,.2,1) both}
        .animate-pop-delay{animation:pop-delay 1.2s cubic-bezier(.4,0,.2,1) both}
        .animate-zoom-in{animation:zoom-in 1.2s cubic-bezier(.4,0,.2,1) both}
      `}</style>
    </div>
  );
}
