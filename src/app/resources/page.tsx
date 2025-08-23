'use client';
import Link from 'next/link';
import { articles } from '@/content/resources';
import { Button } from '@/components/ui/button';
import { SmileSysLogo } from '@/components/icons/smilesys-logo';

export default function ResourcesIndex() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/10 via-background to-primary/30">
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
            <Link href="/resources" className="text-primary">Recursos</Link>
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
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight">Recursos y Blog</h1>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">Buenas prácticas, operaciones y crecimiento para clínicas dentales. Aprende cómo aprovechar SmileSys para optimizar procesos.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {articles.map(a => (
              <Link key={a.slug} href={`/resources/${a.slug}`} className="group rounded-xl border bg-card p-5 flex flex-col hover:shadow-sm transition">
                <div className="text-xs text-muted-foreground mb-2 flex gap-2 flex-wrap">
                  <span>{new Date(a.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                  <span>• {a.readingMinutes} min</span>
                </div>
                <h2 className="font-semibold mb-2 group-hover:text-primary line-clamp-2">{a.title}</h2>
                <p className="text-sm text-muted-foreground line-clamp-4 flex-1">{a.excerpt}</p>
                <div className="mt-4 text-sm font-medium text-primary">Leer más →</div>
              </Link>
            ))}
          </div>
          <div className="mt-16 text-center">
            <Button asChild><Link href="/signup-new">Probar SmileSys Gratis</Link></Button>
          </div>
        </div>
      </main>

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
    </div>
  );
}
