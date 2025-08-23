"use client";

import Link from "next/link";
import { SmileSysLogo } from "@/components/icons/smilesys-logo";
import { Button } from "@/components/ui/button";

export default function ContactoPage() {
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
            <Link href="/seguridad" className="hover:text-primary">Seguridad</Link>
            <Link href="/resources" className="hover:text-primary">Recursos</Link>
            <Link href="/contacto" className="text-primary font-semibold">Contacto</Link>
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
        {/* Hero */}
        <section className="relative overflow-hidden bg-white animate-fade-in">
          <div className="relative max-w-7xl mx-auto px-6 py-20">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">Contacto</h1>
            <p className="mt-4 text-muted-foreground max-w-2xl">Estamos para ayudarte. Elige el canal que prefieras y te responderemos lo antes posible.</p>
          </div>
        </section>

        {/* Tarjetas de contacto */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-1">Ventas</h3>
              <p className="text-sm text-muted-foreground mb-3">Planes, demos y precios.</p>
              <div className="text-sm">Email: <a className="underline" href="mailto:devsmilesys@gmail.com">devsmilesys@gmail.com</a></div>
              <div className="text-sm">Teléfono: <a className="underline" href="tel:6873668085">687 366 8085</a></div>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-1">Soporte</h3>
              <p className="text-sm text-muted-foreground mb-3">Ayuda técnica y dudas operativas.</p>
              <div className="text-sm">Email: <a className="underline" href="mailto:devsmilesys@gmail.com">devsmilesys@gmail.com</a></div>
              <div className="text-sm">Teléfono: <a className="underline" href="tel:6873668085">687 366 8085</a></div>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-1">Prensa</h3>
              <p className="text-sm text-muted-foreground mb-3">Consultas de comunicación y prensa.</p>
              <div className="text-sm">Email: <a className="underline" href="mailto:devsmilesys@gmail.com">devsmilesys@gmail.com</a></div>
              <div className="text-sm">WhatsApp: <a className="underline" href="https://wa.me/6873668085" target="_blank" rel="noopener noreferrer">Enviar mensaje</a></div>
            </div>
          </div>
        </section>

        {/* Horarios */}
        <section className="py-6">
          <div className="max-w-7xl mx-auto px-6">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-2">Horarios de atención</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Lunes a Viernes: 9:00 am - 6:00 pm</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 text-center">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-2xl font-bold mb-3">¿Prefieres que te contactemos?</h2>
            <p className="text-sm text-muted-foreground mb-5">Déjanos tus datos y te llamamos.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <a href="mailto:contacto@smilesys.com?subject=Contacto%20SmileSys">Escribir por email</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://wa.me/6873668085" target="_blank" rel="noopener noreferrer">Chatear por WhatsApp</a>
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
