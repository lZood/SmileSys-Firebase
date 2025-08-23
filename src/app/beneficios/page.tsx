"use client";

import Link from "next/link";
import { SmileSysLogo } from "@/components/icons/smilesys-logo";
import { Button } from "@/components/ui/button";
import { CalendarCheck2, ThumbsUp, Clock3, Users2, BarChart3, Layers } from "lucide-react";

const benefits = [
  {
    t: "Menos ausencias",
  d: "Recordatorios automáticos y confirmaciones reducen ausencias y mejoran la ocupación.",
  },
  {
    t: "Más aceptación de tratamientos",
    d: "Odontograma visual y presupuestos claros ayudan a explicar y cerrar planes.",
  },
  {
    t: "Ahorro de tiempo",
    d: "Evita trabajos duplicados: agenda, pacientes, pagos y reportes en un solo lugar.",
  },
  {
    t: "Mejor coordinación",
    d: "Roles y notificaciones mantienen a clínica y administración en sincronía.",
  },
  {
    t: "Visibilidad en el negocio",
    d: "Métricas de productividad, ingresos y ocupación para decidir con datos.",
  },
  {
    t: "Escala ordenada",
    d: "Estandariza flujos y plantillas para crecer sin perder control operativo.",
  },
];

const stats = [
  { k: "-35%", v: "Ausencias" },
  { k: "+22%", v: "Aceptación" },
  { k: "-18h", v: "Tareas/mes" },
];

export default function BeneficiosPage() {
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
            <Link href="/beneficios" className="text-primary font-semibold">Beneficios</Link>
            <Link href="/#pricing" className="hover:text-primary">Precios</Link>
            <Link href="/seguridad" className="hover:text-primary">Seguridad</Link>
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
        {/* Hero Beneficios */}
        <section className="relative overflow-hidden bg-white animate-fade-in">
          <div className="relative max-w-7xl mx-auto px-6 py-20">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">Beneficios de SmileSys</h1>
            <p className="mt-4 text-muted-foreground max-w-2xl">
              Impacta tu operación con menos ausencias, mayor aceptación de tratamientos y mejor coordinación del equipo.
            </p>
          </div>
        </section>

        {/* Stats rápidos */}
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {stats.map((s) => (
              <div key={s.v} className="rounded-xl border bg-card p-6 text-center animate-pop-delay">
                <div className="text-3xl font-bold text-primary">{s.k}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Grid de beneficios */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((b, i) => (
                <div
                  key={b.t}
                  className="relative rounded-xl border bg-gradient-to-br from-primary/5 via-card to-primary/10 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 group animate-pop-delay"
                  style={{ animationDelay: `${i * 0.1 + 0.2}s` }}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {b.t === "Menos ausencias" && <CalendarCheck2 className="h-5 w-5" />}
                    {b.t === "Más aceptación de tratamientos" && <ThumbsUp className="h-5 w-5" />}
                    {b.t === "Ahorro de tiempo" && <Clock3 className="h-5 w-5" />}
                    {b.t === "Mejor coordinación" && <Users2 className="h-5 w-5" />}
                    {b.t === "Visibilidad en el negocio" && <BarChart3 className="h-5 w-5" />}
                    {b.t === "Escala ordenada" && <Layers className="h-5 w-5" />}
                  </div>
                  <h3 className="font-semibold mb-2 text-lg group-hover:text-primary transition-colors duration-300">{b.t}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-primary/80 transition-colors duration-300">{b.d}</p>
                  <div className="absolute inset-0 rounded-xl pointer-events-none group-hover:ring-4 group-hover:ring-primary/20 transition-all duration-300" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Evidencia/Testimonials breve */}
        <section className="py-16 bg-gradient-to-br from-primary/15 via-background to-primary/8 animate-fade-in">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-bold mb-8">Historias de impacto</h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Clínicas reducen ausencias y aumentan ingresos al consolidar su operación en SmileSys.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-primary/95 text-primary-foreground text-center animate-fade-in">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Empieza a medir resultados hoy</h2>
            <p className="text-primary-foreground/90 mb-6 text-sm md:text-base">14 días gratis. Sin tarjeta. Cancela cuando quieras.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" asChild className="animate-pop">
                <Link href="/signup-new">Crear cuenta</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 animate-pop-delay">
                <Link href="mailto:contacto@smilesys.com">Agendar demo</Link>
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
