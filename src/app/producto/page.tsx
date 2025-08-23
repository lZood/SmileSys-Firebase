"use client";

import Link from "next/link";
import { SmileSysLogo } from "@/components/icons/smilesys-logo";
import { Button } from "@/components/ui/button";

const productSections = [
  {
    id: "agenda",
    title: "Agenda Inteligente",
    desc:
      "Arrastra y reprograma, evita solapamientos y recibe recordatorios automáticos. Integración con Google Calendar.",
    bullets: [
      "Vista diaria/semanal",
      "Drag & drop para reprogramar",
      "Recordatorios automáticos",
    ],
  },
  {
    id: "odontograma",
    title: "Odontograma Digital",
    desc:
      "Registro visual interactivo para diagnósticos, presupuestos y seguimiento clínico.",
    bullets: [
      "Evolución por pieza",
      "Vinculado a tratamientos",
      "Exportable",
    ],
  },
  {
    id: "facturacion",
    title: "Facturación y Pagos",
    desc:
      "Presupuestos, pagos y estado de cuenta vinculados al expediente clínico.",
    bullets: [
      "Presupuestos detallados",
      "Pagos parciales y totales",
      "Reportes de ingresos",
    ],
  },
  {
    id: "reportes",
    title: "Reportes & Métricas",
    desc:
      "Indicadores de productividad, ocupación y conversión para tomar mejores decisiones.",
    bullets: [
      "Top tratamientos",
      "Ocupación de agenda",
      "Conversión de presupuestos",
    ],
  },
  {
    id: "roles",
    title: "Roles & Permisos",
    desc:
      "Acceso granular para doctores, administración y staff de apoyo. Trazabilidad de cambios.",
    bullets: ["Perfiles por rol", "Historial de actividad", "Notificaciones"],
  },
];

export default function ProductoPage() {
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
            <Link href="/producto" className="text-primary font-semibold">
              Producto
            </Link>
            <Link href="/beneficios" className="hover:text-primary">
              Beneficios
            </Link>
            <Link href="/#pricing" className="hover:text-primary">
              Precios
            </Link>
            <Link href="/seguridad" className="hover:text-primary">
              Seguridad
            </Link>
            <Link href="/resources" className="hover:text-primary">
              Recursos
            </Link>
            <Link href="/contacto" className="hover:text-primary">
              Contacto
            </Link>
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
        {/* Hero Producto */}
        <section className="relative overflow-hidden bg-white animate-fade-in">
          <div className="relative max-w-7xl mx-auto px-6 py-20">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
              Todo sobre el Producto
            </h1>
            <p className="mt-4 text-muted-foreground max-w-2xl">
              Profundiza en cada módulo de SmileSys: agenda, pacientes, odontograma, facturación, reportes y más.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {productSections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="text-xs px-3 py-2 rounded-full border hover:border-primary hover:text-primary">
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Secciones de producto */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6 space-y-16">
            {productSections.map((s, idx) => (
              <div key={s.id} id={s.id} className="grid md:grid-cols-2 gap-14 items-center">
                <div className={`aspect-video rounded-xl border ${idx % 2 ? "bg-muted" : "bg-muted/40"} flex items-center justify-center text-xs text-muted-foreground animate-zoom-in group transition-all duration-500 hover:scale-105 hover:border-primary hover:bg-primary/10`}>
                  <span className="transition-transform duration-500 group-hover:scale-110">
                    Ilustración {s.title}
                  </span>
                </div>
                <div className="space-y-5 animate-slide-up">
                  <h2 className="text-3xl font-bold leading-tight">{s.title}</h2>
                  <p className="text-muted-foreground">{s.desc}</p>
                  <ul className="text-sm grid gap-2 text-muted-foreground">
                    {s.bullets.map((b) => (
                      <li key={b}>• {b}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-primary/95 text-primary-foreground text-center animate-fade-in">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Listo para probar SmileSys?</h2>
            <p className="text-primary-foreground/90 mb-6 text-sm md:text-base">
              Empieza gratis por 14 días. Sin tarjeta.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" asChild className="animate-pop">
                <Link href="/signup-new">Crear cuenta</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 animate-pop-delay">
                <Link href="/contacto">Agendar demo</Link>
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
