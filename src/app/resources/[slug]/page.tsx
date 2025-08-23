import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArticle } from '@/content/resources';
import { Button } from '@/components/ui/button';
import { SmileSysLogo } from '@/components/icons/smilesys-logo';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: 'Artículo no encontrado - Recursos SmileSys' };
  return { title: `${article.title} | Recursos SmileSys`, description: article.excerpt };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return notFound();
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
        <div className="max-w-3xl mx-auto px-6 py-14">
          <div className="mb-8">
            <Link href="/resources" className="text-sm text-muted-foreground hover:text-primary">← Volver</Link>
          </div>
          <article>
            <header className="mb-8">
              <div className="text-xs text-muted-foreground mb-2 flex gap-3 flex-wrap">
                <span>{new Date(article.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                <span>• {article.readingMinutes} min lectura</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight leading-tight">{article.title}</h1>
              <div className="mt-3 flex gap-2 flex-wrap">
                {article.tags.map(t => (
                  <span key={t} className="text-[11px] uppercase tracking-wide bg-primary/10 text-primary px-2 py-1 rounded">{t}</span>
                ))}
              </div>
            </header>
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: article.body }} />
          </article>
          <div className="mt-12 border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-sm text-muted-foreground">¿Listo para aplicar estas ideas? Centraliza agenda, pacientes y reportes con SmileSys.</div>
            <Button asChild><Link href="/signup-new">Comenzar Gratis</Link></Button>
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
